-- Writer Personas 테이블 (작성자 페르소나)
-- 사용자가 콘텐츠 작성 시 자신의 스타일/전문성/특성을 반영하기 위한 테이블

CREATE TABLE public.writer_personas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- 기본 정보
    name TEXT NOT NULL, -- "기술 전문가", "마케팅 전문가", "친근한 스토리텔러"
    description TEXT,

    -- 글쓰기 스타일
    writing_style TEXT NOT NULL, -- 'professional', 'casual', 'technical', 'storytelling', 'humorous'
    tone TEXT NOT NULL, -- 'formal', 'friendly', 'authoritative', 'conversational', 'inspirational'

    -- 구조 선호도
    preferred_structure JSONB, -- {opening: 'question', body: 'data-driven', closing: 'cta'}
    /* 예시:
    {
        "opening": "question|statistic|story|direct",
        "body": "bullet-points|narrative|data-driven|mixed",
        "closing": "cta|summary|question|insight"
    }
    */

    -- 전문성/관점
    expertise_areas TEXT[], -- ['technology', 'marketing', 'entrepreneurship', 'education']
    unique_perspective TEXT, -- "10년차 개발자 관점", "스타트업 CEO 경험 기반"

    -- 언어 습관
    language_preferences JSONB,
    /* 예시:
    {
        "emoji_usage": "heavy|moderate|minimal|none",
        "sentence_length": "short|medium|long|mixed",
        "paragraph_length": "concise|standard|detailed",
        "technical_terms": true|false,
        "industry_jargon": true|false,
        "use_analogies": true|false,
        "use_data_statistics": true|false
    }
    */

    -- 콘텐츠 선호도
    favorite_topics TEXT[], -- 선호하는 주제들
    avoided_topics TEXT[], -- 피하는 주제들

    -- 시그니처 요소
    signature_phrases TEXT[], -- 자주 사용하는 표현
    catchphrase TEXT, -- 대표 문구/슬로건

    -- 메타
    is_default BOOLEAN DEFAULT false, -- 기본 페르소나 여부
    usage_count INTEGER DEFAULT 0, -- 사용 횟수

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contents 테이블에 writer_persona_id 추가
ALTER TABLE public.contents
ADD COLUMN writer_persona_id UUID REFERENCES public.writer_personas(id) ON DELETE SET NULL;

-- RLS 설정
ALTER TABLE public.writer_personas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for writer_personas
CREATE POLICY "Users can view own writer personas"
    ON public.writer_personas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own writer personas"
    ON public.writer_personas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own writer personas"
    ON public.writer_personas FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own writer personas"
    ON public.writer_personas FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.writer_personas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_writer_personas_user_id ON public.writer_personas(user_id);
CREATE INDEX idx_writer_personas_is_default ON public.writer_personas(user_id, is_default);
CREATE INDEX idx_contents_writer_persona_id ON public.contents(writer_persona_id);

-- 기본 작성자 페르소나 예시 (사용자 가입 시 자동 생성 가능)
-- 실제로는 애플리케이션 레벨에서 처리하겠지만, 참고용 예시

COMMENT ON TABLE public.writer_personas IS '작성자 페르소나 - 콘텐츠 작성 시 사용자의 스타일/전문성/특성 반영';
COMMENT ON COLUMN public.writer_personas.writing_style IS '글쓰기 스타일: professional, casual, technical, storytelling, humorous';
COMMENT ON COLUMN public.writer_personas.tone IS '톤: formal, friendly, authoritative, conversational, inspirational';
COMMENT ON COLUMN public.writer_personas.preferred_structure IS 'JSON 형식의 구조 선호도 (opening, body, closing)';
COMMENT ON COLUMN public.writer_personas.language_preferences IS 'JSON 형식의 언어 습관 (emoji, 문장 길이, 용어 사용 등)';
