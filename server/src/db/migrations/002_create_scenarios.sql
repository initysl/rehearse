CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('work', 'health', 'family', 'social', 'financial', 'legal')),
  description TEXT NOT NULL,
  character_profile JSONB NOT NULL,
  difficulty_variants JSONB NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
