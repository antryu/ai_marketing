-- 간단한 구독자 관리 테이블 (최소 정보만)
-- 현재 사용 중인 구독자 정보만 저장

-- 구독자 테이블
CREATE TABLE public.subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- 필수 정보만
    email TEXT NOT NULL,
    name TEXT,

    -- 상태
    status TEXT DEFAULT 'active', -- 'active', 'unsubscribed'

    -- 언제 가입했는지
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 한 사용자당 이메일 중복 방지
    UNIQUE(user_id, email)
);

-- RLS 설정
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 자기 구독자만 관리
CREATE POLICY "Users can manage own subscribers"
    ON public.subscribers FOR ALL
    USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 인덱스
CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_status ON public.subscribers(status);
