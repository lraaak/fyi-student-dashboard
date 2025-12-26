import streamlit as st
import mysql.connector
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import time

# --- Database Credentials ---
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "4Skinz.123"
DB_NAME = "dlsu_productivity_db"

# --- Database Connection & Setup ---
def get_db_connection():
    """Establishes a secure connection to the MySQL database."""
    try:
        # First connect to MySQL server to ensure DB exists
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        
        # Create Database if it doesn't exist
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        conn.database = DB_NAME
        
        # Create Table if it doesn't exist
        schema = """
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
        """
        cursor.execute(schema)
        conn.commit()
        return conn
    except mysql.connector.Error as err:
        st.error(f"Database Error: {err}")
        return None

def fetch_data():
    """Fetches all data from the database into a Pandas DataFrame."""
    conn = get_db_connection()
    if conn:
        query = "SELECT * FROM assignment_logs"
        df = pd.read_sql(query, conn)
        conn.close()
        return df
    return pd.DataFrame()

def insert_task(subject_code, assignment_name, task_category, difficulty_rating, 
                days_to_deadline, predicted_hours, actual_hours_spent, 
                days_started_before_deadline, final_grade_received):
    """Inserts a new task record into the database."""
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        query = """
        INSERT INTO assignment_logs (
            subject_code, assignment_name, task_category, difficulty_rating, 
            days_to_deadline, predicted_hours, actual_hours_spent, 
            days_started_before_deadline, final_grade_received
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (subject_code, assignment_name, task_category, difficulty_rating, 
                  days_to_deadline, predicted_hours, actual_hours_spent, 
                  days_started_before_deadline, final_grade_received)
        try:
            cursor.execute(query, values)
            conn.commit()
            st.success("Task successfully logged!")
        except mysql.connector.Error as err:
            st.error(f"Error inserting data: {err}")
        finally:
            conn.close()

# --- Machine Learning Models ---
def train_models(df):
    """Trains ML models on the provided DataFrame."""
    models = {}
    
    # Needs enough data to train
    if len(df) < 5:
        return None

    try:
        # Encoders
        le_subject = LabelEncoder()
        df['subject_code_encoded'] = le_subject.fit_transform(df['subject_code'])
        
        le_category = LabelEncoder()
        df['task_category_encoded'] = le_category.fit_transform(df['task_category'])
        
        models['le_subject'] = le_subject
        models['le_category'] = le_category
        
        # 1. Duration Prediction (Linear Regression)
        # Predict: actual_hours_spent
        # Features: difficulty_rating, subject_code, task_category
        X_reg1 = df[['difficulty_rating', 'subject_code_encoded', 'task_category_encoded']]
        y_reg1 = df['actual_hours_spent']
        
        reg1 = LinearRegression()
        reg1.fit(X_reg1, y_reg1)
        models['duration_model'] = reg1
        
        # 3. Grade Outlook (Linear Regression)
        # Predict: final_grade_received
        # Features: actual_hours_spent, days_started_before_deadline, task_category
        X_reg2 = df[['actual_hours_spent', 'days_started_before_deadline', 'task_category_encoded']]
        y_reg2 = df['final_grade_received']
        
        reg2 = LinearRegression()
        reg2.fit(X_reg2, y_reg2)
        models['grade_model'] = reg2
        
        return models
        
    except Exception as e:
        st.warning(f"Could not train models yet (insufficient variability or data): {e}")
        return None

# --- UI Layout ---
st.set_page_config(page_title="FYI Dashboard", page_icon="🎓", layout="wide")

st.title("FYI: Smart Student Productivity Dashboard")
st.markdown("### For Your Information: Track, Analyze, and Predict")

# Sidebar
st.sidebar.header("Navigation")
page = st.sidebar.radio("Go to:", ["Task Tracker", "Predictor"])

# Load Data
df = fetch_data()

# Train Models on Load (if data exists)
models = None
if not df.empty:
    models = train_models(df)

# --- Tab 1: Task Tracker ---
if page == "Task Tracker":
    st.header("📝 Manual Task Tracker")
    st.markdown("Log your assignments and study sessions here.")
    
    with st.form("task_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            subject_code = st.text_input("Subject Code (e.g., CSADPRG)", value="CSADPRG")
            assignment_name = st.text_input("Assignment Name")
            task_category = st.selectbox("Category (Target for ML)", ["Technical", "Theory", "Project", "High Priority", "Low Priority"])
            difficulty_rating = st.slider("Difficulty Rating (1-5)", 1, 5, 3)
            
        with col2:
            days_to_deadline = st.number_input("Days to Deadline", min_value=0, value=3)
            days_started_before_deadline = st.number_input("Days Started Before Deadline", min_value=0, value=1)
            predicted_hours = st.number_input("Predicted Hours (Your Estimate)", min_value=0.0, value=2.0, step=0.5)
            actual_hours_spent = st.number_input("Actual Hours Spent (Log after completion)", min_value=0.0, value=0.0, step=0.5)
            final_grade_received = st.number_input("Final Grade Received (0.0 - 4.0)", min_value=0.0, max_value=4.0, value=0.0, step=0.1)

        submitted = st.form_submit_button("Log Task")
        
        if submitted:
            if subject_code and assignment_name:
                insert_task(subject_code, assignment_name, task_category, difficulty_rating, 
                            days_to_deadline, predicted_hours, actual_hours_spent, 
                            days_started_before_deadline, final_grade_received)
                st.rerun()
            else:
                st.error("Please fill in Subject Code and Assignment Name.")

    st.divider()
    st.subheader("History")
    if not df.empty:
        st.dataframe(df.sort_values(by='task_id', ascending=False).head(10))
    else:
        st.info("No tasks logged yet.")

# --- Tab 2: Predictor ---
elif page == "Predictor":
    st.header("🔮 AI Predictor")
    st.markdown("Get insights on future tasks based on your history.")
    
    if models is None:
        st.warning("⚠️ Not enough data to generate predictions. Please log at least 5 varied tasks in the Tracker.")
        if not df.empty:
            st.dataframe(df)
    else:
        st.success("State-of-the-Art ML Models are Active!")
        
        st.subheader("Task Scenario Simulator")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            # Dropdown for subjects seen in history or new text
            existing_subjects = df['subject_code'].unique().tolist()
            pred_subject = st.selectbox("Subject", existing_subjects)
            # Dropdown for category
            pred_category = st.selectbox("Category", ["Technical", "Theory", "Project", "High Priority", "Low Priority"])
            
        with col2:
            pred_difficulty = st.slider("Difficulty", 1, 5, 3)
            pred_deadline = st.number_input("Days to Deadline", 1, 30, 3)
        
        with col3:
             pred_started = st.number_input("Days Started Before Deadline", 0, 30, 1)

        # Make Predictions
        if st.button("Generate Outlook"):
            try:
                # Handle unseen label for subject
                if pred_subject in models['le_subject'].classes_:
                    subj_encoded = models['le_subject'].transform([pred_subject])[0]
                    
                    # Handle encoding for category (handle if category hasn't been seen in training data)
                    # For safety, we should check models['le_category'].classes_
                    # If the user picks a category never seen before, we might crash. 
                    # Simpler approach: If not seen, default to 0 or catch error.
                    if pred_category in models['le_category'].classes_:
                        cat_encoded = models['le_category'].transform([pred_category])[0]
                    else:
                        # Fallback or Error? 
                        # Let's error to be safe as LinearRegression needs learned weights for specific integer
                        st.warning(f"Category '{pred_category}' hasn't been logged in history yet. Predictions might be less accurate.")
                        # Hack: Pick the first class as fallback to prevent crash, or just zero
                        cat_encoded = 0 

                    # Duration Prediction (Difficulty, Subject, Category)
                    dur_pred = models['duration_model'].predict([[pred_difficulty, subj_encoded, cat_encoded]])[0]
                    
                    # Grade Prediction (Duration, Started_Before, Category)
                    grade_pred = models['grade_model'].predict([[dur_pred, pred_started, cat_encoded]])[0]
                    
                    # Display
                    c1, c2 = st.columns(2)
                    c1.metric("Estimated Hours Needed", f"{dur_pred:.2f} hrs")
                    c2.metric("Projected Grade", f"{grade_pred:.2f} / 4.0")
                    
                    if grade_pred < 2.0:
                        st.error("📉 Risk Alert: Low grade projected. Try starting earlier!")
                    elif grade_pred > 3.5:
                        st.balloons()
                        st.success("🌟 Great Outlook!")
                    else:
                        st.info("Steady progress expected.")
                        
                else:
                    st.error("New subject code detected. Please train with at least one record of this subject first.")
            except Exception as e:
                st.error(f"Prediction Error: {e}")

        st.divider()
        st.subheader("Model Performance Stats")
        st.write(f"Training Set Size: {len(df)} records")

