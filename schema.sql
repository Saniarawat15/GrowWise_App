-- ==========================================================
-- GrowWise Relational Database Schema (MySQL 8.0+)
-- "Grow with confidence. Learn with purpose."
-- ==========================================================

CREATE DATABASE IF NOT EXISTS growwise_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE growwise_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  age INT NULL,
  education_level VARCHAR(64) DEFAULT 'College Student',
  main_growth_goal VARCHAR(128) DEFAULT 'Improve confidence & communication',
  streak_count INT DEFAULT 1,
  last_active_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- 2. User Goals Table
CREATE TABLE IF NOT EXISTS user_goals (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('Confidence', 'English', 'Communication', 'Career', 'Study', 'Personal Growth') NOT NULL DEFAULT 'Personal Growth',
  deadline DATE NULL,
  progress INT NOT NULL DEFAULT 0, -- 0 to 100
  status ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
  milestones_json JSON, -- Array of [{ id, text, completed }]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_goals_user (user_id, status)
) ENGINE=InnoDB;

-- 3. Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  mood ENUM('great', 'good', 'okay', 'low', 'difficult') NOT NULL DEFAULT 'good',
  ai_reflection_json JSON NULL, -- AI-generated themes, emotions, observations, questions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_journal_user (user_id, created_at)
) ENGINE=InnoDB;

-- 4. Daily Activities Table
CREATE TABLE IF NOT EXISTS daily_activities (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  activity_type ENUM('Mind', 'Communication', 'Confidence') NOT NULL,
  activity_text VARCHAR(500) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  activity_date DATE NOT NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_activity_date (user_id, activity_type, activity_date),
  INDEX idx_daily_user_date (user_id, activity_date)
) ENGINE=InnoDB;

-- 5. English Progress Table
CREATE TABLE IF NOT EXISTS english_progress (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  grammar_score INT NOT NULL DEFAULT 70,
  vocabulary_score INT NOT NULL DEFAULT 65,
  fluency_score INT NOT NULL DEFAULT 60,
  confidence_score INT NOT NULL DEFAULT 65,
  exercises_completed INT NOT NULL DEFAULT 0,
  recorded_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_english_user_date (user_id, recorded_date)
) ENGINE=InnoDB;

-- 6. Confidence Activities Table
CREATE TABLE IF NOT EXISTS confidence_activities (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  activity VARCHAR(255) NOT NULL,
  difficulty ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  category VARCHAR(64) DEFAULT 'Speaking',
  points INT NOT NULL DEFAULT 10,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  user_reflection TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_confidence_user (user_id, difficulty, completed)
) ENGINE=InnoDB;

-- 7. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(128) DEFAULT 'Growth Coaching Session',
  mode VARCHAR(64) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_user (user_id, created_at)
) ENGINE=InnoDB;

-- 8. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  sender ENUM('user', 'assistant') NOT NULL,
  message TEXT NOT NULL,
  action_type VARCHAR(64) NULL, -- 'talk', 'english', 'confidence', 'interview', 'presentation', 'reflect'
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  INDEX idx_messages_session (session_id, timestamp)
) ENGINE=InnoDB;

-- ==========================================================
-- Sample Seed Data for Demo User (Alex)
-- ==========================================================
INSERT IGNORE INTO users (id, name, email, password_hash, age, education_level, main_growth_goal, streak_count, last_active_date)
VALUES (
  'demo-user-alex',
  'Alex Chen',
  'alex@growwise.edu',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- demo hashed password
  20,
  'Undergraduate (3rd Year)',
  'Speak English more confidently & conquer presentation anxiety',
  5,
  CURRENT_DATE()
);
