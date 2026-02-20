CREATE TABLE progress_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id),
  confidence_score INTEGER,
  session_count INTEGER DEFAULT 1,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
