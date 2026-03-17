-- ═══════════════════════════════════
-- TREND TRACKING
-- ═══════════════════════════════════

CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  pub_date TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  track TEXT NOT NULL CHECK (track IN ('caretech','investment','competitor','policy')),
  matched_keywords TEXT[],
  cluster_id UUID, -- REFERENCES news_clusters(id) handled later or assumed
  sentiment TEXT CHECK (sentiment IN ('positive','negative','neutral')),
  is_read BOOLEAN DEFAULT FALSE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE news_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  track TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  importance_score INTEGER DEFAULT 0
);
ALTER TABLE news_items ADD CONSTRAINT fk_news_cluster FOREIGN KEY (cluster_id) REFERENCES news_clusters(id);

CREATE TABLE signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL CHECK (signal_type IN ('S1_policy','S2_funding','S3_competitor')),
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  raw_score INTEGER CHECK (raw_score BETWEEN 0 AND 100),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  related_keywords TEXT[],
  region TEXT CHECK (region IN ('korea','global')),
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE opportunity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  s1_score INTEGER, s2_score INTEGER, s3_score INTEGER,
  total_score INTEGER,
  recommended_action TEXT,
  status TEXT DEFAULT 'active',
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE procurement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT,
  estimated_price BIGINT,
  bid_deadline TIMESTAMPTZ,
  announcement_date TIMESTAMPTZ,
  source_url TEXT,
  matched_keywords TEXT[],
  fit_score TEXT CHECK (fit_score IN ('high','medium','low')),
  fit_reason TEXT,
  status TEXT DEFAULT 'open',
  awarded_to TEXT,
  awarded_price BIGINT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id)
);

-- ═══════════════════════════════════
-- STUDY (5단계 학습 세션 구조)
-- ═══════════════════════════════════

CREATE TABLE analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  company_name TEXT NOT NULL,
  category TEXT,
  level TEXT CHECK (level IN ('L1','L2','L3')),
  data_badge TEXT CHECK (data_badge IN ('real','synthetic','mixed')),
  data_source TEXT,
  source_url TEXT,
  source_summary TEXT,
  questions JSONB NOT NULL,
  ai_references JSONB,
  my_insight TEXT,
  carevia_application TEXT,
  depth_scores JSONB,
  time_spent_minutes INTEGER,
  self_rating INTEGER CHECK (self_rating BETWEEN 1 AND 5),
  tags TEXT[],
  linked_signal_id UUID REFERENCES signal_events(id),
  linked_news_id UUID REFERENCES news_items(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pricing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  company_name TEXT NOT NULL,
  level TEXT CHECK (level IN ('L1','L2','L3')),
  data_badge TEXT CHECK (data_badge IN ('real','synthetic','mixed')),
  data_source TEXT,
  source_url TEXT,
  questions JSONB NOT NULL,
  ai_references JSONB,
  my_insight TEXT,
  carevia_application TEXT,
  pricing_unit TEXT,
  pricing_model TEXT,
  base_price TEXT,
  depth_scores JSONB,
  tags TEXT[],
  linked_procurement_id UUID REFERENCES procurement_items(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bid_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  procurement_id UUID REFERENCES procurement_items(id),
  title TEXT,
  estimated_price BIGINT,
  awarded_price BIGINT,
  award_ratio NUMERIC,
  awarded_company TEXT,
  evaluation_criteria TEXT,
  questions JSONB,
  ai_references JSONB,
  my_insight TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sroi_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  scenario_type TEXT CHECK (scenario_type IN ('real_event','tracking_linked','ai_scenario')),
  data_badge TEXT CHECK (data_badge IN ('real','synthetic','mixed')),
  input_description TEXT,
  input_amount BIGINT NOT NULL,
  outputs JSONB NOT NULL,
  total_output BIGINT NOT NULL,
  sroi_ratio NUMERIC NOT NULL,
  iris_categories TEXT[],
  questions JSONB,
  ai_feedback JSONB,
  my_insight TEXT,
  depth_scores JSONB,
  source_project TEXT CHECK (source_project IN ('carevia','hosidahm','other')),
  source_site TEXT,
  tags TEXT[],
  linked_signal_id UUID REFERENCES signal_events(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pitch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  company_name TEXT,
  source_url TEXT,
  source_type TEXT,
  questions JSONB NOT NULL,
  ai_references JSONB,
  my_carevia_script TEXT,
  script_feedback TEXT,
  my_insight TEXT,
  depth_scores JSONB,
  tags TEXT[],
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE field_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  site TEXT NOT NULL,
  event_description TEXT NOT NULL,
  questions JSONB,
  ai_feedback JSONB,
  my_insight TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════
-- KNOWLEDGE BASE
-- ═══════════════════════════════════

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source_session_id UUID NOT NULL,
  source_module TEXT NOT NULL
    CHECK (source_module IN ('analysis','pricing','sroi','pitch','field_story')),
  content TEXT NOT NULL,
  carevia_application TEXT,
  applied_in_practice BOOLEAN DEFAULT FALSE,
  applied_description TEXT,
  applied_date DATE,
  applied_outcome TEXT,
  tags TEXT[],
  linked_insight_ids UUID[],
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  q1_market_signal TEXT,
  q2_pricing_insight TEXT,
  q3_sroi_discovery TEXT,
  q4_next_week_focus TEXT,
  q5_applied_in_practice TEXT,
  ai_weekly_summary TEXT,
  ai_blind_spots TEXT,
  ai_growth_note TEXT,
  streak_days INTEGER,
  total_memos INTEGER,
  competency_scores JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cumulative_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT CHECK (period IN ('weekly','monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  blind_spots JSONB,
  growth_trajectory JSONB,
  strengths JSONB,
  level_recommendation TEXT,
  overall_depth_trend JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  morning_completed BOOLEAN DEFAULT FALSE,
  lunch_completed BOOLEAN DEFAULT FALSE,
  evening_completed BOOLEAN DEFAULT FALSE,
  morning_session_id UUID,
  lunch_session_id UUID,
  evening_session_id UUID,
  user_id UUID REFERENCES auth.users(id),
  UNIQUE(date, user_id)
);

-- ═══════════════════════════════════
-- SYNTHETIC DATA POOL
-- ═══════════════════════════════════

CREATE TABLE synthetic_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  based_on TEXT NOT NULL,
  category TEXT,
  description TEXT,
  financials JSONB,
  learning_focus TEXT,
  carevia_relevance TEXT,
  level TEXT CHECK (level IN ('L1','L2','L3')),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sroi_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site TEXT NOT NULL,
  event TEXT NOT NULL,
  hint TEXT,
  difficulty TEXT CHECK (difficulty IN ('L1','L2','L3')),
  learning_focus TEXT,
  based_on TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON news_items FOR ALL USING (auth.uid() = user_id);

ALTER TABLE signal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON signal_events FOR ALL USING (auth.uid() = user_id);

ALTER TABLE opportunity_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON opportunity_scores FOR ALL USING (auth.uid() = user_id);

ALTER TABLE procurement_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON procurement_items FOR ALL USING (auth.uid() = user_id);

ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON analysis_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE pricing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON pricing_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE bid_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON bid_analyses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE sroi_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON sroi_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE pitch_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON pitch_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE field_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON field_stories FOR ALL USING (auth.uid() = user_id);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON insights FOR ALL USING (auth.uid() = user_id);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON weekly_reviews FOR ALL USING (auth.uid() = user_id);

ALTER TABLE cumulative_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON cumulative_feedback FOR ALL USING (auth.uid() = user_id);

ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON daily_streaks FOR ALL USING (auth.uid() = user_id);
