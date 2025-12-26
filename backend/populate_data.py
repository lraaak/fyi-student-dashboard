import mysql.connector
import os

def populate_historical_data():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="", # Pue MYSQL Workbench Password here
        database="dlsu_productivity_db"
    )
    cursor = conn.cursor()

    data = [
        # CCINFOM (Information Management)
        ('CCINFOM', 'Assignment No. 1', 'Technical', 3, 7, 2.0, 2.0, 2, 4.0),
        ('CCINFOM', 'Sept 26 Activity', 'Technical', 2, 3, 1.0, 1.0, 0, 4.0),
        ('CCINFOM', 'Oct 3 F2F Session', 'Technical', 2, 3, 1.0, 1.0, 0, 4.0),
        ('CCINFOM', 'ERD Submission', 'Technical', 4, 10, 8.0, 8.0, 0, 4.0),
        ('CCINFOM', 'Final DB App', 'Project', 5, 14, 20.0, 22.0, 0, 3.75),
        ('CCINFOM', 'Midterm Exams', 'Theory', 4, 7, 10.0, 10.0, 1, 4.0),
        ('CCINFOM', 'Relational DB Exam', 'Theory', 4, 5, 8.0, 8.0, 0, 3.8),

        # CSSWENG (Software Engineering)
        ('CSSWENG', 'MCO2 Data Analysis', 'Project', 5, 15, 15.0, 15.0, 0, 4.0),
        ('CSSWENG', 'Language Comparison', 'Theory', 3, 7, 5.0, 6.0, 0, 3.72),
        ('CSSWENG', 'MP Class Presentation', 'Project', 3, 5, 4.0, 4.0, 0, 3.4),
        ('CSSWENG', 'Final Exam', 'Theory', 5, 10, 12.0, 15.0, 1, 3.6),
        ('CSSWENG', 'Midterm Exam', 'Theory', 4, 10, 10.0, 12.0, 1, 3.7),
        ('CSSWENG', 'MCO1 & 2 Machine Project', 'Project', 5, 20, 20.0, 25.0, 2, 4.0),
        ('CSSWENG', 'MCO3 Comparative Analysis', 'Project', 5, 15, 15.0, 18.0, 0, 3.56),

        # CSALGCM (Algorithms & Complexity)
        ('CSALGCM', 'Fool Arcana Problem Set', 'Technical', 3, 5, 2.0, 2.0, 1, 4.0),
        ('CSALGCM', 'Time Complexity Analysis', 'Technical', 4, 5, 4.0, 4.0, 1, 4.0),
        ('CSALGCM', 'Divide and conquer Quiz', 'Technical', 4, 3, 2.0, 2.0, 0, 4.0),
        ('CSALGCM', 'Dynamic Programming Basics', 'Technical', 5, 5, 4.0, 5.0, 1, 4.0),
        ('CSALGCM', 'Huffman Encoding Quiz', 'Technical', 4, 3, 2.0, 2.0, 0, 4.0),
        ('CSALGCM', 'Hands-On Exam 1', 'Technical', 4, 7, 10.0, 10.0, 1, 4.0),
        ('CSALGCM', 'Hands-On Exam 2', 'Technical', 5, 7, 12.0, 14.0, 1, 4.0),
        ('CSALGCM', 'Final Exam', 'Theory', 5, 10, 15.0, 20.0, 2, 2.32),

        # CSINTSY (Intelligent Systems)
        ('CSINTSY', 'SokoBot MCO1', 'Project', 4, 14, 15.0, 15.0, 0, 4.0),
        ('CSINTSY', 'PinoyBot MCO2', 'Project', 5, 14, 20.0, 25.0, 0, 4.0),
        ('CSINTSY', 'Activity 5: SokoBot Testing', 'Technical', 3, 4, 2.0, 2.0, 0, 4.0),
        ('CSINTSY', 'CatBot MCO3', 'Project', 5, 14, 15.0, 20.0, 0, 3.8),
        ('CSINTSY', 'Activity 7: PinoyBot Testing', 'Technical', 3, 3, 2.0, 3.0, 0, 4.0),
        ('CSINTSY', 'Final Exam', 'Theory', 5, 10, 12.0, 15.0, 1, 3.44)
    ]

    query = """
    INSERT INTO assignment_logs (
        subject_code, assignment_name, task_category, difficulty_rating, 
        days_to_deadline, predicted_hours, actual_hours_spent, 
        days_started_before_deadline, final_grade_received
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    cursor.executemany(query, data)
    conn.commit()
    print(f"Successfully inserted {cursor.rowcount} records.")
    
    conn.close()

if __name__ == "__main__":
    populate_historical_data()
