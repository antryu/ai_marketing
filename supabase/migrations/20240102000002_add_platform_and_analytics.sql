-- Platform Connections Table
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'thread', 'linkedin', 'instagram', 'youtube', 'twitter'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published Posts Table
CREATE TABLE IF NOT EXISTS published_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_post_id VARCHAR(255),
  platform_url TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed'
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  published_post_id UUID REFERENCES published_posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  date DATE NOT NULL,

  -- Common metrics
  views INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,

  -- Platform-specific metrics (stored in JSONB)
  platform_metrics JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(published_post_id, date)
);

-- Community Insights Table (for listening feature)
CREATE TABLE IF NOT EXISTS community_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  source VARCHAR(100) NOT NULL, -- 'reddit', 'naver_cafe', 'kakao', 'linkedin_groups', etc.
  source_url TEXT,
  content TEXT NOT NULL,
  sentiment VARCHAR(50), -- 'positive', 'negative', 'neutral'
  topics TEXT[], -- Array of detected topics
  pain_points TEXT[],
  trends TEXT[],
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Data Table (for AI improvement)
CREATE TABLE IF NOT EXISTS learning_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  performance_score DECIMAL(5,2), -- Calculated from analytics
  successful_elements JSONB DEFAULT '{}', -- What worked well
  learning_insights JSONB DEFAULT '{}', -- AI extracted insights
  applied_to_next BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Allocations Table
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  allocated_budget DECIMAL(10,2) DEFAULT 0,
  spent_budget DECIMAL(10,2) DEFAULT 0,
  roi DECIMAL(10,2) DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'owner', 'admin', 'editor', 'viewer'
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'suspended'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(brand_id, user_id)
);

-- Content Templates Table
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'product_launch', 'case_study', 'tips', etc.
  template_structure JSONB NOT NULL,
  platforms TEXT[], -- Which platforms this template is for
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules Table
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL, -- 'schedule', 'event', 'performance'
  trigger_config JSONB NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- 'create_content', 'publish', 'alert', 'adjust_budget'
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_platform_connections_brand ON platform_connections(brand_id);
CREATE INDEX idx_published_posts_content ON published_posts(content_id);
CREATE INDEX idx_published_posts_status ON published_posts(status);
CREATE INDEX idx_analytics_post ON analytics(published_post_id);
CREATE INDEX idx_analytics_date ON analytics(date);
CREATE INDEX idx_community_insights_brand ON community_insights(brand_id);
CREATE INDEX idx_learning_data_content ON learning_data(content_id);
CREATE INDEX idx_budget_allocations_brand ON budget_allocations(brand_id);
CREATE INDEX idx_team_members_brand ON team_members(brand_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_content_templates_brand ON content_templates(brand_id);
CREATE INDEX idx_automation_rules_brand ON automation_rules(brand_id);

-- Enable Row Level Security
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access data for brands they're members of)
CREATE POLICY "Users can view platform connections for their brands"
  ON platform_connections FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage platform connections for their brands"
  ON platform_connections FOR ALL
  USING (
    brand_id IN (
      SELECT brand_id FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view published posts for their brands"
  ON published_posts FOR SELECT
  USING (
    content_id IN (
      SELECT id FROM contents WHERE brand_id IN (
        SELECT brand_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can manage published posts for their brands"
  ON published_posts FOR ALL
  USING (
    content_id IN (
      SELECT id FROM contents WHERE brand_id IN (
        SELECT brand_id FROM team_members
        WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view analytics for their brands"
  ON analytics FOR SELECT
  USING (
    published_post_id IN (
      SELECT pp.id FROM published_posts pp
      JOIN contents c ON pp.content_id = c.id
      WHERE c.brand_id IN (
        SELECT brand_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can view community insights for their brands"
  ON community_insights FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can view team members for their brands"
  ON team_members FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage team members"
  ON team_members FOR ALL
  USING (
    brand_id IN (
      SELECT brand_id FROM team_members
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );
