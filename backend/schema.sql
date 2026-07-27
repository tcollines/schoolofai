-- Create Database
CREATE DATABASE IF NOT EXISTS school_of_ai;
USE school_of_ai;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('ADMIN', 'INSTRUCTOR', 'PRO', 'INDIVIDUAL', 'PLUS', 'SPONSORED') DEFAULT 'INDIVIDUAL',
    avatar_url MEDIUMTEXT,
    wallet_balance DECIMAL(10, 2) DEFAULT 100.00,
    password VARCHAR(255) NOT NULL,
    nationality VARCHAR(100) NULL,
    date_of_birth DATE NULL,
    avatar_scale DECIMAL(5, 2) DEFAULT 1.00,
    avatar_pos_x INT DEFAULT 0,
    avatar_pos_y INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- 2. Instructors Table
CREATE TABLE IF NOT EXISTS instructors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    bio TEXT,
    avatar VARCHAR(255),
    courses_count INT DEFAULT 0,
    passcode VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for instructors
CREATE INDEX idx_instructors_email ON instructors(email);

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    instructor_email VARCHAR(100) NOT NULL,
    instructor_avatar VARCHAR(255),
    duration VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    image_url TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    access_tier ENUM('FREE', 'PAID') DEFAULT 'FREE',
    status ENUM('DRAFT', 'PUBLISHED') DEFAULT 'DRAFT',
    is_verified BOOLEAN DEFAULT FALSE,
    description TEXT,
    outcomes JSON,
    sections JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for courses
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_instructor_email ON courses(instructor_email);
CREATE INDEX idx_courses_is_verified ON courses(is_verified);

-- 4. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    progress INT DEFAULT 0,
    status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    exam_completed BOOLEAN DEFAULT FALSE,
    exam_score INT DEFAULT NULL,
    quiz_score INT DEFAULT NULL,
    final_score INT DEFAULT NULL,
    exam_marks_released BOOLEAN DEFAULT FALSE,
    certificate_url TEXT DEFAULT NULL,
    is_certificate_verified BOOLEAN DEFAULT FALSE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course (user_id, course_id)
);

-- Indexes for foreign keys (essential to prevent slow JOIN queries)
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- 5. Mails Table
CREATE TABLE IF NOT EXISTS mails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_email VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for mails
CREATE INDEX idx_mails_sender ON mails(sender_email);
CREATE INDEX idx_mails_recipient ON mails(recipient_email);

-- 6. Events Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for events
CREATE INDEX idx_events_type ON events(type);

-- 7. Audit Logs Table (Logging/Auditing requirement)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_email VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for auditing
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ========================================================
-- SEED DATA
-- ========================================================

-- Seed Profiles (Only Master Admin)
INSERT INTO profiles (id, full_name, email, role, avatar_url, wallet_balance, password) VALUES
('user-chemayek', 'Abraham Chemayek', 'chemayekabraham289@gmail.com', 'ADMIN', '', 100.00, 'student123')
ON DUPLICATE KEY UPDATE id=id;


-- Seed Courses
INSERT INTO courses (id, title, instructor, instructor_email, instructor_avatar, duration, category, rating, image_url, price, access_tier, status, is_verified, description, outcomes, sections) VALUES
(
    '5', 
    'Succeed in the Age of AI', 
    'Abraham Chemayek', 
    'chemayekabraham289@gmail.com', 
    'AC', 
    '6h 30m', 
    'Technology', 
    4.70, 
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800', 
    9.99, 
    'PAID', 
    'PUBLISHED', 
    1, 
    'Master foundational concepts and tools of AI productivity.',
    '["Master AI basics", "Optimize work productivity"]',
    '[{"id":"sai-m1","title":"Introduction to AI Success","lessons":[{"id":"sai-l1","title":"Thriving with Artificial Intelligence","type":"video","duration":"12m","videoUrl":"https://www.w3schools.com/html/mov_bbb.mp4"},{"id":"sai-l2","title":"AI Tools and Productivity","type":"article","duration":"8m","content":"In the age of AI, success belongs to those who collaborate with machine intelligence..."}]}]'
),
(
    '6', 
    'Articulation Unleashed: Speak With Precision and Clarity', 
    'Abraham Chemayek', 
    'chemayekabraham289@gmail.com', 
    'AC', 
    '4h 15m', 
    'Personal Development', 
    4.50, 
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800', 
    9.99, 
    'PAID', 
    'PUBLISHED', 
    1, 
    'Learn vocal clarity techniques, pacing, and speaking with absolute confidence.',
    '["Improve public speaking", "Master vocal tone control"]',
    '[{"id":"au-m1","title":"Foundations of Clear Speech","lessons":[{"id":"au-l1","title":"Speaking with Confidence","type":"video","duration":"15m","videoUrl":"https://www.w3schools.com/html/mov_bbb.mp4"},{"id":"au-l2","title":"Vocal Clarity Techniques","type":"article","duration":"10m","content":"Mastering the art of vocal clarity requires proper breath control, pacing, and pitch modulation..."}]}]'
),
(
    '7', 
    'Ultimate PMP renewal, get all 60 PDUs approved by PMI', 
    'Abraham Chemayek', 
    'chemayekabraham289@gmail.com', 
    'AC', 
    '8h 45m', 
    'Business', 
    4.60, 
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800', 
    9.99, 
    'PAID', 
    'PUBLISHED', 
    1, 
    'Strategic project leadership course to renew your PMP status.',
    '["Renew PMP status", "Master Agile and Waterfall hybrids"]',
    '[{"id":"pmp-m1","title":"Strategic Project Leadership","lessons":[{"id":"pmp-l1","title":"Earning your PDUs","type":"video","duration":"18m","videoUrl":"https://www.w3schools.com/html/mov_bbb.mp4"},{"id":"pmp-l2","title":"Agile & Waterfall Hybrid Management","type":"article","duration":"12m","content":"Project management standards have evolved..."}]}]'
),
(
    '8', 
    'ChatGPT: Complete ChatGPT Course For Work 2026', 
    'Abraham Chemayek', 
    'chemayekabraham289@gmail.com', 
    'AC', 
    '5h 20m', 
    'Technology', 
    4.50, 
    'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?auto=format&fit=crop&q=80&w=800', 
    9.99, 
    'PAID', 
    'PUBLISHED', 
    1, 
    'Master prompt engineering and automating office workflows with GPT models.',
    '["Write better prompts", "Automate workflows"]',
    '[{"id":"gpt-m1","title":"Prompt Engineering Foundations","lessons":[{"id":"gpt-l1","title":"Writing Better Prompts for Work","type":"video","duration":"14m","videoUrl":"https://www.w3schools.com/html/mov_bbb.mp4"},{"id":"gpt-l2","title":"Automating Workflows with GPT","type":"article","duration":"10m","content":"ChatGPT can assist in generating reports..."}]}]'
)
ON DUPLICATE KEY UPDATE id=id;
