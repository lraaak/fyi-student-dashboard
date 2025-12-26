from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.metrics import mean_absolute_error
from typing import List, Optional
import os

app = FastAPI(title="FYI Backend")

# --- CORS Setup ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Credentials ---
# IMPORTANT: Update these with your actual credentials before running
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "YOUR_PASSWORD_HERE"  # Replace with your MySQL password
DB_NAME = "dlsu_productivity_db"

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except mysql.connector.Error as err:
        print(f"DB Connection Error: {err}")
        raise HTTPException(status_code=500, detail="Database connection failed")

# --- Pydantic Models ---

# Subject Models
class SubjectCreate(BaseModel):
    subject_code: str
    subject_name: Optional[str] = None
    is_terror_prof: int = 0

class SubjectResponse(BaseModel):
    subject_code: str
    subject_name: Optional[str]
    is_terror_prof: int

# Task Models (removed is_terror_prof - now inherited from subject)
class TaskCreate(BaseModel):
    subject_code: str
    assignment_name: str
    task_category: str
    difficulty_rating: int
    days_to_deadline: int
    days_started_before_deadline: int
    predicted_hours: float
    actual_hours_spent: Optional[float] = 0.0
    final_grade_received: Optional[float] = 0.0

class TaskResponse(TaskCreate):
    task_id: int

# Prediction Models (removed is_terror_prof - auto-looked up from subjects table)
class PredictionInput(BaseModel):
    subject: str
    category: str
    difficulty: int
    days_to_deadline: int
    days_started_before: int

class PredictionOutput(BaseModel):
    estimated_hours: float
    projected_grade: float
    risk_level: str
    is_terror_prof: int  # Return this so frontend can display it

# --- Global ML State ---
ml_models = {}

def train_models():
    """Trains ML models by joining assignment_logs with subjects table."""
    print("Training models...")
    conn = get_db_connection()
    
    # Join with subjects to get is_terror_prof per subject
    query = """
        SELECT a.*, COALESCE(s.is_terror_prof, 0) as is_terror_prof
        FROM assignment_logs a
        LEFT JOIN subjects s ON a.subject_code = s.subject_code
    """
    df = pd.read_sql(query, conn)
    conn.close()

    if len(df) < 5:
        print("Not enough data to train models.")
        return False

    try:
        # Encoders
        le_subject = LabelEncoder()
        df['subject_code_encoded'] = le_subject.fit_transform(df['subject_code'])
        
        le_category = LabelEncoder()
        df['task_category_encoded'] = le_category.fit_transform(df['task_category'])
        
        ml_models['le_subject'] = le_subject
        ml_models['le_category'] = le_category
        
        df['is_terror_prof'] = df['is_terror_prof'].fillna(0).astype(int)
        
        # === FEATURE ENGINEERING ===
        # Sort by task_id to ensure chronological order
        df = df.sort_values('task_id').reset_index(drop=True)
        
        # Feature 1: Subject Cumulative GPA (running average per subject)
        df['subject_cumulative_gpa'] = df.groupby('subject_code')['final_grade_received'].expanding().mean().reset_index(level=0, drop=True)
        df['subject_cumulative_gpa'] = df['subject_cumulative_gpa'].fillna(df['final_grade_received'].mean())
        
        # Feature 2: Workload Last 7 Days (sum of hours in previous tasks)
        df['workload_last_7_days'] = 0.0
        for idx in range(len(df)):
            # Sum hours from tasks within 7 days before this one
            recent_hours = df.loc[:idx-1, 'actual_hours_spent'].tail(7).sum() if idx > 0 else 0
            df.at[idx, 'workload_last_7_days'] = recent_hours
        
        # Feature 3: Assignment Sequence Number (nth assignment in this subject)
        df['assignment_sequence'] = df.groupby('subject_code').cumcount() + 1
        
        # === DURATION PREDICTION MODEL ===
        X_reg1 = df[['difficulty_rating', 'subject_code_encoded', 'task_category_encoded', 
                     'is_terror_prof', 'subject_cumulative_gpa', 'workload_last_7_days', 'assignment_sequence']]
        y_reg1 = df['actual_hours_spent']
        
        # GridSearchCV for Duration Model
        param_grid_duration = {
            'n_estimators': [50, 100],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }
        
        rf_duration = RandomForestRegressor(random_state=42, n_jobs=-1)
        
        if len(df) >= 20:
            print("Running GridSearchCV for Duration Model...")
            grid_duration = GridSearchCV(rf_duration, param_grid_duration, cv=3, scoring='r2', n_jobs=-1, verbose=0)
            grid_duration.fit(X_reg1, y_reg1)
            reg1 = grid_duration.best_estimator_
            print(f"Best Duration Params: {grid_duration.best_params_}")
            
            # K-Fold CV with best model
            n_folds = min(5, len(df))
            cv_scores_duration = cross_val_score(reg1, X_reg1, y_reg1, cv=n_folds, scoring='r2')
            cv_mae_duration = -cross_val_score(reg1, X_reg1, y_reg1, cv=n_folds, scoring='neg_mean_absolute_error')
            
            ml_models['duration_r2'] = float(cv_scores_duration.mean())
            ml_models['duration_mae'] = float(cv_mae_duration.mean())
            print(f"Duration Model - R² (CV): {ml_models['duration_r2']:.3f}, MAE (CV): {ml_models['duration_mae']:.3f} hours")
        else:
            # Not enough data for GridSearch, use default params
            reg1 = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
            reg1.fit(X_reg1, y_reg1)
            ml_models['duration_r2'] = None
            ml_models['duration_mae'] = None
            print("Not enough data for GridSearchCV on duration model")
        
        ml_models['duration_model'] = reg1
        
        # === GRADE PREDICTION MODEL ===
        X_reg2 = df[['actual_hours_spent', 'days_started_before_deadline', 'task_category_encoded', 
                     'is_terror_prof', 'subject_cumulative_gpa', 'workload_last_7_days', 'assignment_sequence']]
        y_reg2 = df['final_grade_received']
        
        # GridSearchCV for Grade Model
        param_grid_grade = {
            'n_estimators': [50, 100],
            'max_depth': [5, 10, 15],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }
        
        rf_grade = RandomForestRegressor(random_state=42, n_jobs=-1)
        
        if len(df) >= 20:
            print("Running GridSearchCV for Grade Model...")
            grid_grade = GridSearchCV(rf_grade, param_grid_grade, cv=3, scoring='r2', n_jobs=-1, verbose=0)
            grid_grade.fit(X_reg2, y_reg2)
            reg2 = grid_grade.best_estimator_
            print(f"Best Grade Params: {grid_grade.best_params_}")
            
            # K-Fold CV with best model
            n_folds = min(5, len(df))
            cv_scores_grade = cross_val_score(reg2, X_reg2, y_reg2, cv=n_folds, scoring='r2')
            cv_mae_grade = -cross_val_score(reg2, X_reg2, y_reg2, cv=n_folds, scoring='neg_mean_absolute_error')
            
            ml_models['grade_r2'] = float(cv_scores_grade.mean())
            ml_models['grade_mae'] = float(cv_mae_grade.mean())
            print(f"Grade Model - R² (CV): {ml_models['grade_r2']:.3f}, MAE (CV): {ml_models['grade_mae']:.3f} GPA points")
        else:
            # Not enough data for GridSearch, use default params
            reg2 = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
            reg2.fit(X_reg2, y_reg2)
            ml_models['grade_r2'] = None
            ml_models['grade_mae'] = None
            print("Not enough data for GridSearchCV on grade model")
        
        ml_models['grade_model'] = reg2
        
        print("Models trained successfully with feature engineering.")
        return True
    except Exception as e:
        print(f"Training failed: {e}")
        return False

# --- Startup: Create Tables ---
@app.on_event("startup")
def startup_event():
    try:
        conn = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        conn.database = DB_NAME
        
        # Create subjects table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                subject_code VARCHAR(10) PRIMARY KEY,
                subject_name VARCHAR(100),
                is_terror_prof TINYINT(1) DEFAULT 0
            );
        """)
        
        # Create assignment_logs table (no is_terror_prof column needed)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS assignment_logs (
                task_id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(10),
                assignment_name VARCHAR(100),
                task_category VARCHAR(50),
                difficulty_rating INT,
                days_to_deadline INT,
                predicted_hours FLOAT,
                actual_hours_spent FLOAT,
                days_started_before_deadline INT,
                final_grade_received FLOAT
            );
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB Init Error: {e}")

    train_models()

# --- Subject Routes ---

@app.get("/subjects", response_model=List[SubjectResponse])
def get_subjects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM subjects ORDER BY subject_code")
    subjects = cursor.fetchall()
    conn.close()
    return subjects

@app.get("/model-metrics")
def get_model_metrics():
    """Return cross-validation metrics for model accuracy display"""
    return {
        "duration_model": {
            "r2_score": ml_models.get('duration_r2'),
            "mae": ml_models.get('duration_mae'),
            "accuracy_percentage": int(ml_models.get('duration_r2', 0) * 100) if ml_models.get('duration_r2') else None
        },
        "grade_model": {
            "r2_score": ml_models.get('grade_r2'),
            "mae": ml_models.get('grade_mae'),
            "accuracy_percentage": int(ml_models.get('grade_r2', 0) * 100) if ml_models.get('grade_r2') else None
        },
        "has_metrics": ml_models.get('duration_r2') is not None
    }

@app.post("/subjects")
def create_or_update_subject(subject: SubjectCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Upsert: Insert or Update on duplicate key
    query = """
        INSERT INTO subjects (subject_code, subject_name, is_terror_prof)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            subject_name = VALUES(subject_name),
            is_terror_prof = VALUES(is_terror_prof)
    """
    name = subject.subject_name if subject.subject_name else subject.subject_code
    values = (subject.subject_code, name, subject.is_terror_prof)
    
    try:
        cursor.execute(query, values)
        conn.commit()
        conn.close()
        
        # Retrain models with updated terror status
        train_models()
        
        return {"message": "Subject saved", "subject_code": subject.subject_code}
    except mysql.connector.Error as err:
        conn.close()
        raise HTTPException(status_code=500, detail=str(err))

# --- Task Routes ---

@app.get("/tasks")
def get_tasks():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Join with subjects to include is_terror_prof in response
    cursor.execute("""
        SELECT a.*, COALESCE(s.is_terror_prof, 0) as is_terror_prof
        FROM assignment_logs a
        LEFT JOIN subjects s ON a.subject_code = s.subject_code
        ORDER BY a.task_id DESC LIMIT 50
    """)
    tasks = cursor.fetchall()
    conn.close()
    return tasks

@app.post("/tasks")
def create_task(task: TaskCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Auto-create subject if it doesn't exist
    cursor.execute("""
        INSERT IGNORE INTO subjects (subject_code, subject_name, is_terror_prof)
        VALUES (%s, %s, 0)
    """, (task.subject_code, task.subject_code))
    
    # Insert the task (without is_terror_prof)
    query = """
    INSERT INTO assignment_logs (
        subject_code, assignment_name, task_category, difficulty_rating, 
        days_to_deadline, predicted_hours, actual_hours_spent, 
        days_started_before_deadline, final_grade_received
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        task.subject_code, task.assignment_name, task.task_category, 
        task.difficulty_rating, task.days_to_deadline, task.predicted_hours, 
        task.actual_hours_spent, task.days_started_before_deadline, 
        task.final_grade_received
    )
    try:
        cursor.execute(query, values)
        conn.commit()
        task_id = cursor.lastrowid
        conn.close()
        
        train_models()
        
        return {"message": "Task created", "task_id": task_id}
    except mysql.connector.Error as err:
        conn.close()
        raise HTTPException(status_code=500, detail=str(err))

# --- Prediction Route ---

@app.post("/predict", response_model=PredictionOutput)
def predict_outcome(data: PredictionInput):
    if 'duration_model' not in ml_models:
        raise HTTPException(status_code=400, detail="Models not trained yet (need more data)")
    
    # Lookup subject's terror status from DB
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT is_terror_prof FROM subjects WHERE subject_code = %s", (data.subject,))
    result = cursor.fetchone()
    
    is_terror = result['is_terror_prof'] if result else 0
    
    # Calculate engineered features from historical data
    # Feature 1: Subject Cumulative GPA
    cursor.execute("""
        SELECT AVG(final_grade_received) as avg_gpa 
        FROM assignment_logs 
        WHERE subject_code = %s
    """, (data.subject,))
    gpa_result = cursor.fetchone()
    subject_cumulative_gpa = gpa_result['avg_gpa'] if gpa_result and gpa_result['avg_gpa'] else 3.0
    
    # Feature 2: Workload Last 7 Days (sum of recent hours)
    cursor.execute("""
        SELECT SUM(actual_hours_spent) as total_hours 
        FROM (
            SELECT actual_hours_spent 
            FROM assignment_logs 
            ORDER BY task_id DESC 
            LIMIT 7
        ) recent
    """)
    workload_result = cursor.fetchone()
    workload_last_7_days = workload_result['total_hours'] if workload_result and workload_result['total_hours'] else 0.0
    
    # Feature 3: Assignment Sequence (count of assignments in this subject)
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM assignment_logs 
        WHERE subject_code = %s
    """, (data.subject,))
    seq_result = cursor.fetchone()
    assignment_sequence = (seq_result['count'] if seq_result else 0) + 1
    
    conn.close()
    
    try:
        # Transform inputs
        if data.subject in ml_models['le_subject'].classes_:
            subj_encoded = ml_models['le_subject'].transform([data.subject])[0]
        else:
            raise HTTPException(status_code=400, detail="Unknown Subject Code")

        if data.category in ml_models['le_category'].classes_:
            cat_encoded = ml_models['le_category'].transform([data.category])[0]
        else:
            cat_encoded = 0 

        # Predict Duration with engineered features
        dur_pred = ml_models['duration_model'].predict([[
            data.difficulty, subj_encoded, cat_encoded, is_terror,
            subject_cumulative_gpa, workload_last_7_days, assignment_sequence
        ]])[0]
        
        # Predict Grade with engineered features
        grade_pred = ml_models['grade_model'].predict([[
            dur_pred, data.days_started_before, cat_encoded, is_terror,
            subject_cumulative_gpa, workload_last_7_days, assignment_sequence
        ]])[0]
        
        # Cap grade at 4.0 (max GPA)
        grade_pred = min(grade_pred, 4.0)
        
        # Risk Logic
        if grade_pred < 2.0:
            risk = "High Risk"
        elif grade_pred >= 3.95:  # Catches 4.0 and anything that rounds to it
            risk = "ACE"
        elif grade_pred > 3.5:
            risk = "Great Outlook"
        else:
            risk = "Steady"

        return {
            "estimated_hours": float(dur_pred),
            "projected_grade": float(grade_pred),
            "risk_level": risk,
            "is_terror_prof": is_terror
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
