-- CareRadar v3.1: insights table for Study session storage
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL,
  my_answer TEXT DEFAULT '',
  insight_text TEXT DEFAULT '',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and reads (for demo; tighten for production)
CREATE POLICY "Allow anonymous insert" ON insights FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON insights FOR SELECT USING (true);
