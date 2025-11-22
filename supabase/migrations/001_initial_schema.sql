-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users 테이블 (Supabase Auth 확장)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands 테이블 (멀티 브랜드)
CREATE TABLE public.brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,

    -- 제품 정보
    product_type TEXT, -- 'b2b_saas', 'ecommerce', 'education' etc
    target_market TEXT[], -- ['korea', 'usa']

    -- 브랜드 에셋
    logo_url TEXT,
    brand_colors JSONB, -- {primary: '#xxx', secondary: '#xxx'}
    brand_voice JSONB, -- {tone: 'professional', style: 'friendly'}

    -- 메타
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personas 테이블
CREATE TABLE public.personas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,

    name TEXT NOT NULL, -- "바쁜 마케팅 매니저"
    description TEXT,

    -- 인구통계
    age_range TEXT, -- "25-34"
    gender TEXT,
    location TEXT[],

    -- 직업/역할
    job_title TEXT[],
    industry TEXT[],
    company_size TEXT,

    -- 심리/행동
    pain_points TEXT[],
    goals TEXT[],
    values TEXT[],

    -- 온라인 행동
    platforms TEXT[], -- ['threads', 'linkedin']
    content_preferences JSONB,

    -- AI 생성 메타
    confidence_score DECIMAL(3,2), -- 0.00-1.00
    data_sources TEXT[],

    is_primary BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content 테이블
CREATE TABLE public.contents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,

    -- 콘텐츠
    title TEXT,
    body TEXT NOT NULL,
    media_urls TEXT[], -- 이미지/영상 URL

    -- 메타데이터
    topic TEXT,
    content_type TEXT, -- 'text', 'image', 'video', 'carousel'

    -- AI 생성 정보
    ai_model TEXT, -- 'gpt-4o-mini', 'deepseek'
    ai_prompt TEXT,
    generation_time_ms INTEGER,

    -- 플랫폼별 최적화
    platform_variations JSONB, -- {threads: {text: '...', hashtags: []}}

    -- 상태
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Connections 테이블
CREATE TABLE public.platform_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,

    platform TEXT NOT NULL, -- 'threads', 'linkedin', 'instagram'

    -- OAuth tokens
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- 플랫폼 계정 정보
    platform_user_id TEXT,
    platform_username TEXT,

    -- 상태
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(brand_id, platform)
);

-- Published Posts 테이블
CREATE TABLE public.published_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'threads', 'linkedin'

    -- 플랫폼 게시물 정보
    platform_post_id TEXT, -- Thread/LinkedIn 게시물 ID
    platform_url TEXT,

    -- 발행 정보
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,

    -- 성과 (주기적으로 업데이트)
    metrics JSONB, -- {views: 1234, likes: 89, comments: 12}
    last_metrics_update TIMESTAMP WITH TIME ZONE,

    -- 상태
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed'
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics 테이블 (집계된 성과)
CREATE TABLE public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,

    date DATE NOT NULL,
    platform TEXT NOT NULL,

    -- 메트릭
    posts_published INTEGER DEFAULT 0,
    total_impressions INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,

    -- 비즈니스 메트릭 (Phase 2)
    leads_generated INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(brand_id, date, platform)
);

-- RLS (Row Level Security) 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for brands
CREATE POLICY "Users can view own brands"
    ON public.brands FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brands"
    ON public.brands FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands"
    ON public.brands FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brands"
    ON public.brands FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for personas
CREATE POLICY "Users can view personas of their brands"
    ON public.personas FOR SELECT
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert personas for their brands"
    ON public.personas FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update personas of their brands"
    ON public.personas FOR UPDATE
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete personas of their brands"
    ON public.personas FOR DELETE
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- RLS Policies for contents
CREATE POLICY "Users can view contents of their brands"
    ON public.contents FOR SELECT
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert contents for their brands"
    ON public.contents FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update contents of their brands"
    ON public.contents FOR UPDATE
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete contents of their brands"
    ON public.contents FOR DELETE
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- RLS Policies for platform_connections
CREATE POLICY "Users can view connections of their brands"
    ON public.platform_connections FOR SELECT
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert connections for their brands"
    ON public.platform_connections FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update connections of their brands"
    ON public.platform_connections FOR UPDATE
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete connections of their brands"
    ON public.platform_connections FOR DELETE
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- RLS Policies for published_posts
CREATE POLICY "Users can view posts of their brands"
    ON public.published_posts FOR SELECT
    USING (content_id IN (
        SELECT id FROM public.contents WHERE brand_id IN (
            SELECT id FROM public.brands WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert posts for their brands"
    ON public.published_posts FOR INSERT
    WITH CHECK (content_id IN (
        SELECT id FROM public.contents WHERE brand_id IN (
            SELECT id FROM public.brands WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can update posts of their brands"
    ON public.published_posts FOR UPDATE
    USING (content_id IN (
        SELECT id FROM public.contents WHERE brand_id IN (
            SELECT id FROM public.brands WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete posts of their brands"
    ON public.published_posts FOR DELETE
    USING (content_id IN (
        SELECT id FROM public.contents WHERE brand_id IN (
            SELECT id FROM public.brands WHERE user_id = auth.uid()
        )
    ));

-- RLS Policies for analytics
CREATE POLICY "Users can view analytics of their brands"
    ON public.analytics FOR SELECT
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert analytics for their brands"
    ON public.analytics FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.personas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.contents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.platform_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.published_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_brands_user_id ON public.brands(user_id);
CREATE INDEX idx_personas_brand_id ON public.personas(brand_id);
CREATE INDEX idx_contents_brand_id ON public.contents(brand_id);
CREATE INDEX idx_contents_status ON public.contents(status);
CREATE INDEX idx_published_posts_content_id ON public.published_posts(content_id);
CREATE INDEX idx_published_posts_platform ON public.published_posts(platform);
CREATE INDEX idx_analytics_brand_date ON public.analytics(brand_id, date DESC);
