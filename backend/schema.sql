-- How Much You Need - Database Schema
-- Execute this in your Supabase SQL Editor

-- 1. Questions table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  created_by_ip VARCHAR(45)
);

-- 2. Responses table  
CREATE TABLE responses (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0 AND amount <= 100000000),
  submitted_at TIMESTAMP DEFAULT NOW(),
  user_ip VARCHAR(45),
  UNIQUE(question_id, user_ip) -- Prevent duplicate responses from same IP
);

-- 3. Question Stats cache (for performance)
CREATE TABLE question_stats (
  question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  response_count INTEGER DEFAULT 0,
  mean DECIMAL(12,2),
  median DECIMAL(12,2),
  q1 DECIMAL(12,2),
  q2 DECIMAL(12,2),
  q3 DECIMAL(12,2),
  min_amount INTEGER,
  max_amount INTEGER,
  histogram JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_responses_question_id ON responses(question_id);
CREATE INDEX idx_responses_user_ip ON responses(user_ip);

-- Insert initial questions (from your mock data)
INSERT INTO questions (text, status, approved_at) VALUES
('길거리에서 노래 크게 틀고 홍박사 챌린지 하기', 'approved', NOW()),
('회사 복도에서 큰 소리로 노래 부르기', 'approved', NOW()),
('지하철에서 모르는 사람에게 말 걸기', 'approved', NOW()),
('하루 종일 잠옷 입고 돌아다니기', 'approved', NOW()),
('대중 앞에서 춤추기 (30분)', 'approved', NOW()),
('하루 동안 핸드폰 없이 지내기', 'approved', NOW()),
('24시간 동안 말 안하기', 'approved', NOW()),
('머리를 파란색으로 염색하기', 'approved', NOW()),
('일주일 동안 매일 아침 6시에 일어나기', 'approved', NOW()),
('SNS 계정 한 달 동안 삭제하기', 'approved', NOW());

-- Initialize stats for each question (will be updated as responses come in)
INSERT INTO question_stats (question_id, response_count, histogram)
SELECT id, 0, '[0,0,0,0,0,0,0]'::jsonb
FROM questions WHERE status = 'approved';
