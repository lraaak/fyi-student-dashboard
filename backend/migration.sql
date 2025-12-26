-- ============================================
-- FYI Dashboard: User Authentication Migration
-- ============================================
-- Run each section separately in MySQL Workbench

-- Step 1: Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email)
);

-- Step 2: Add user_id column to assignment_logs
ALTER TABLE assignment_logs 
ADD COLUMN user_id INT DEFAULT 1 AFTER task_id;

-- Step 3: Add user_id column to subjects  
ALTER TABLE subjects 
ADD COLUMN user_id INT DEFAULT 1 AFTER subject_code;

-- Step 4: Create a default user
-- Password hash for 'password123'
INSERT INTO users (user_id, email, password_hash, name) VALUES 
(1, 'demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaOu6', 'Demo User');

-- Step 5: Add foreign key constraints
ALTER TABLE assignment_logs 
ADD CONSTRAINT fk_assignment_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE subjects 
ADD CONSTRAINT fk_subject_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Step 6: Create indexes
CREATE INDEX idx_assignment_user ON assignment_logs(user_id);
CREATE INDEX idx_subject_user ON subjects(user_id);

-- Verification
SELECT 'Migration complete!' AS status;
SELECT * FROM users;
