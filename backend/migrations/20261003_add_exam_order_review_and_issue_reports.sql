CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

ALTER TABLE exam_attempts
  ADD COLUMN IF NOT EXISTS review_data JSONB;

CREATE INDEX IF NOT EXISTS idx_exams_display_order ON exams(display_order, title);

CREATE TABLE IF NOT EXISTS question_issue_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_question_issue_reports_status_created_at
  ON question_issue_reports(status, created_at DESC);
