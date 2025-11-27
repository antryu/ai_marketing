-- 구독자 관리 시스템
-- 이메일 뉴스레터 구독자 관리를 위한 테이블

-- 1. 구독자 테이블
CREATE TABLE public.subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,

    -- 구독자 정보
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,

    -- 구독 상태
    status TEXT DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced', 'complained'

    -- 태그 및 세그먼트
    tags TEXT[], -- ['vip', 'trial-user', 'enterprise']

    -- 출처 추적
    source TEXT, -- 'landing-page', 'manual-import', 'api', 'referral'
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,

    -- UTM 파라미터 (마케팅 추적)
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,

    -- 추가 정보
    metadata JSONB, -- 커스텀 필드 저장
    notes TEXT, -- 관리자 메모

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 중복 방지
    UNIQUE(brand_id, email)
);

-- 2. 구독자 그룹 (세그먼트)
CREATE TABLE public.subscriber_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,

    -- 그룹 타입
    group_type TEXT DEFAULT 'manual', -- 'manual', 'dynamic'

    -- 동적 필터 조건 (동적 그룹용)
    filter_conditions JSONB, -- {tags: ['vip'], subscribed_after: '2024-01-01'}

    -- 통계
    subscriber_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 구독자-그룹 관계 (다대다)
CREATE TABLE public.subscriber_group_members (
    subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.subscriber_groups(id) ON DELETE CASCADE,

    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by TEXT, -- 'auto' or user_id

    PRIMARY KEY (subscriber_id, group_id)
);

-- 4. 이메일 캠페인
CREATE TABLE public.email_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,

    -- 캠페인 정보
    name TEXT NOT NULL, -- 내부용 캠페인 이름
    subject TEXT NOT NULL,
    preview_text TEXT, -- 미리보기 텍스트

    -- 이메일 본문
    body_html TEXT NOT NULL,
    body_text TEXT,

    -- 발신자 정보
    from_email TEXT NOT NULL,
    from_name TEXT,
    reply_to TEXT,

    -- 타겟 그룹
    target_groups UUID[], -- subscriber_groups의 ID 배열
    target_tags TEXT[], -- 특정 태그 타겟팅

    -- 상태
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'

    -- 발송 시간
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,

    -- 통계
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_complained INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,

    -- 성과 계산
    open_rate DECIMAL(5,2), -- 오픈율 (%)
    click_rate DECIMAL(5,2), -- 클릭율 (%)

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 이메일 발송 로그 (개별 발송 추적)
CREATE TABLE public.email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,

    -- 발송 상태
    status TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'

    -- 이벤트 타임스탬프
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    complained_at TIMESTAMP WITH TIME ZONE,

    -- 에러 정보
    error_code TEXT,
    error_message TEXT,
    bounce_type TEXT, -- 'hard', 'soft'

    -- 이메일 서비스 제공자 정보
    provider_message_id TEXT, -- Resend/SendGrid 메시지 ID

    -- 클릭 추적
    links_clicked TEXT[], -- 클릭된 링크 URL 배열
    click_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 구독 양식 (랜딩 페이지용)
CREATE TABLE public.subscription_forms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,

    -- 양식 정보
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,

    -- 양식 필드 설정
    fields JSONB, -- {email: {required: true}, name: {required: false}}

    -- 자동 태그
    auto_tags TEXT[], -- 이 양식으로 가입한 구독자에게 자동 추가할 태그

    -- 성공 메시지
    success_message TEXT,
    redirect_url TEXT,

    -- 통계
    total_submissions INTEGER DEFAULT 0,
    total_confirmed INTEGER DEFAULT 0,

    -- 상태
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 설정
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscribers
CREATE POLICY "Users can manage subscribers of their brands"
    ON public.subscribers FOR ALL
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- RLS Policies for subscriber_groups
CREATE POLICY "Users can manage groups of their brands"
    ON public.subscriber_groups FOR ALL
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- RLS Policies for subscriber_group_members
CREATE POLICY "Users can manage group members of their brands"
    ON public.subscriber_group_members FOR ALL
    USING (
        group_id IN (
            SELECT id FROM public.subscriber_groups
            WHERE brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
        )
    );

-- RLS Policies for email_campaigns
CREATE POLICY "Users can manage campaigns of their brands"
    ON public.email_campaigns FOR ALL
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- RLS Policies for email_logs
CREATE POLICY "Users can view email logs of their brands"
    ON public.email_logs FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.email_campaigns
            WHERE brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "System can insert email logs"
    ON public.email_logs FOR INSERT
    WITH CHECK (true);

-- RLS Policies for subscription_forms
CREATE POLICY "Users can manage forms of their brands"
    ON public.subscription_forms FOR ALL
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- Public 양식 제출용 policy
CREATE POLICY "Anyone can view active forms"
    ON public.subscription_forms FOR SELECT
    USING (is_active = true);

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.subscriber_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.subscription_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX idx_subscribers_brand_id ON public.subscribers(brand_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_status ON public.subscribers(status);
CREATE INDEX idx_subscribers_tags ON public.subscribers USING GIN(tags);
CREATE INDEX idx_subscribers_created_at ON public.subscribers(created_at DESC);

CREATE INDEX idx_subscriber_groups_brand_id ON public.subscriber_groups(brand_id);
CREATE INDEX idx_subscriber_group_members_subscriber ON public.subscriber_group_members(subscriber_id);
CREATE INDEX idx_subscriber_group_members_group ON public.subscriber_group_members(group_id);

CREATE INDEX idx_email_campaigns_brand_id ON public.email_campaigns(brand_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled_at ON public.email_campaigns(scheduled_at);

CREATE INDEX idx_email_logs_campaign_id ON public.email_logs(campaign_id);
CREATE INDEX idx_email_logs_subscriber_id ON public.email_logs(subscriber_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);

CREATE INDEX idx_subscription_forms_brand_id ON public.subscription_forms(brand_id);

-- 함수: 그룹 구독자 수 업데이트
CREATE OR REPLACE FUNCTION update_group_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.subscriber_groups
    SET subscriber_count = (
        SELECT COUNT(*)
        FROM public.subscriber_group_members
        WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
    )
    WHERE id = COALESCE(NEW.group_id, OLD.group_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_count
    AFTER INSERT OR DELETE ON public.subscriber_group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_subscriber_count();

-- 함수: 캠페인 성과율 계산
CREATE OR REPLACE FUNCTION calculate_campaign_rates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_delivered > 0 THEN
        NEW.open_rate = (NEW.total_opened::DECIMAL / NEW.total_delivered * 100)::DECIMAL(5,2);
    END IF;

    IF NEW.total_delivered > 0 THEN
        NEW.click_rate = (NEW.total_clicked::DECIMAL / NEW.total_delivered * 100)::DECIMAL(5,2);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_rates
    BEFORE UPDATE ON public.email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION calculate_campaign_rates();
