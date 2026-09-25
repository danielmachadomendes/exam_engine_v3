-- Habilita extensão para geração de UUID caso queira usar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENUMS
-- =====================================================
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE question_type AS ENUM ('single_choice', 'multiple_choice');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'timed_out');

-- =====================================================
-- 2. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    status account_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. EXAMS TABLE
-- =====================================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Ex: 'CSA', 'CAD', 'CIS-ITSM'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 90,
    total_questions INT NOT NULL DEFAULT 60,
    passing_score_percentage NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. DOMAINS TABLE (Tópicos do exame com ponderação)
-- =====================================================
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    weight_percentage NUMERIC(5, 2) NOT NULL, -- Ex: 30.00 para 30%
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_positive_weight CHECK (weight_percentage > 0)
);

-- =====================================================
-- 5. QUESTIONS TABLE
-- =====================================================
-- options: JSONB estruturado, ex: [{"id": "a", "text": "Option A"}, {"id": "b", "text": "Option B"}]
-- correct_answers: JSONB array com IDs das respostas certas, ex: ["a"] ou ["a", "c"]
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type question_type NOT NULL DEFAULT 'single_choice',
    options JSONB NOT NULL,
    correct_answers JSONB NOT NULL,
    explanation TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. EXAM ATTEMPTS TABLE
-- =====================================================
-- user_answers: JSONB map com respostas do usuário, ex: {"<question_id>": ["a", "c"]}
-- domain_scores: JSONB breakdown do resultado por domínio
CREATE TABLE exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    status attempt_status NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INT DEFAULT 0,
    user_answers JSONB DEFAULT '{}'::jsonb,
    score_percentage NUMERIC(5, 2),
    is_passed BOOLEAN,
    domain_scores JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_questions_domain_id ON questions(domain_id);
CREATE INDEX idx_domains_exam_id ON domains(exam_id);
CREATE INDEX idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);