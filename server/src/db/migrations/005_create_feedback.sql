CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  goal_achieved BOOLEAN,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 1 AND 100),
  full_feedback JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
