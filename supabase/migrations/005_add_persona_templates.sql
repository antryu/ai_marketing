-- Persona Templates 테이블
-- 정교한 페르소나 템플릿 제공 (사전 정의된 유명 작가/인플루언서 스타일)

CREATE TABLE public.persona_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- 기본 정보
    name TEXT NOT NULL, -- "Seth Godin", "Gary Vaynerchuk", "Simon Sinek"
    category TEXT NOT NULL, -- 'marketing', 'tech', 'business', 'lifestyle', 'education'
    description TEXT NOT NULL, -- "마케팅 구루, 짧고 강렬한 인사이트"

    -- 프로필
    real_person BOOLEAN DEFAULT true, -- 실존 인물 여부
    profession TEXT, -- "마케터", "기업가", "작가"
    known_for TEXT, -- "Purple Cow", "Permission Marketing"
    target_audience TEXT, -- "마케터, 기업가, 혁신가"

    -- 글쓰기 특성
    writing_style TEXT NOT NULL, -- 'professional', 'casual', 'technical', 'storytelling', 'humorous'
    tone TEXT NOT NULL, -- 'formal', 'friendly', 'authoritative', 'conversational', 'inspirational'

    -- 구조 선호도
    preferred_structure JSONB NOT NULL,
    /* 예시:
    {
        "opening": "insight|question|statistic|story",
        "body": "bullet-points|narrative|data-driven|mixed",
        "closing": "cta|insight|question|challenge"
    }
    */

    -- 언어 습관
    language_preferences JSONB NOT NULL,
    /* 예시:
    {
        "emoji_usage": "minimal",
        "sentence_length": "short",
        "paragraph_length": "concise",
        "technical_terms": false,
        "use_analogies": true,
        "use_data_statistics": false,
        "use_questions": true,
        "use_bold_statements": true
    }
    */

    -- 전문성
    expertise_areas TEXT[] NOT NULL, -- ['marketing', 'branding', 'innovation']
    unique_perspective TEXT NOT NULL, -- "마케팅은 제품이 아니라 스토리를 파는 것"

    -- 시그니처 요소
    signature_phrases TEXT[], -- ["Be remarkable", "Purple Cow", "The Dip"]
    catchphrase TEXT, -- "All marketers are liars (tell stories)"

    -- 콘텐츠 스타일
    typical_post_length TEXT, -- 'very-short' (50-150), 'short' (150-300), 'medium' (300-600), 'long' (600+)
    typical_format TEXT[], -- ['insight', 'question', 'list', 'story', 'data']

    -- 예시
    example_posts TEXT[], -- 실제 글 예시 3-5개

    -- 메타
    popularity_score INTEGER DEFAULT 0, -- 사용 빈도
    is_active BOOLEAN DEFAULT true,
    tags TEXT[], -- ['short-form', 'thought-leadership', 'actionable']

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 설정 (모든 사용자가 읽기 가능)
ALTER TABLE public.persona_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view persona templates"
    ON public.persona_templates FOR SELECT
    USING (is_active = true);

-- Indexes
CREATE INDEX idx_persona_templates_category ON public.persona_templates(category);
CREATE INDEX idx_persona_templates_popularity ON public.persona_templates(popularity_score DESC);
CREATE INDEX idx_persona_templates_tags ON public.persona_templates USING GIN(tags);

-- Trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.persona_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 초기 템플릿 데이터 (정교한 페르소나)

-- 1. Seth Godin (마케팅 구루)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Seth Godin',
    'marketing',
    '마케팅 구루. 짧고 강렬한 인사이트. 매일 블로그 작성.',
    true,
    '마케터, 작가, 기업가',
    'Purple Cow, Permission Marketing',
    '마케터, 기업가, 혁신가',
    'storytelling',
    'conversational',
    '{"opening": "insight", "body": "narrative", "closing": "challenge"}',
    '{"emoji_usage": "none", "sentence_length": "short", "paragraph_length": "concise", "technical_terms": false, "use_analogies": true, "use_data_statistics": false, "use_questions": true, "use_bold_statements": true}',
    ARRAY['marketing', 'branding', 'innovation', 'entrepreneurship'],
    '마케팅은 제품이 아니라 스토리를 파는 것',
    ARRAY['Be remarkable', 'Purple Cow', 'The Dip', 'Permission Marketing'],
    'All marketers are liars (tell stories)',
    'very-short',
    ARRAY['insight', 'question', 'challenge'],
    ARRAY[
        '평범함은 선택이다. 눈에 띄는 것도 선택이다.',
        '마케팅은 우리가 만드는 변화다. 우리가 고객에게 전달하는 가치다.',
        '실패를 두려워하지 마라. 평범함을 두려워하라.'
    ],
    ARRAY['short-form', 'thought-leadership', 'actionable', 'daily']
);

-- 2. Gary Vaynerchuk (소셜미디어 전문가)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Gary Vaynerchuk',
    'business',
    '열정적인 기업가. 직설적이고 현실적인 조언. 강한 동기부여.',
    true,
    '기업가, 투자자, 연사',
    'VaynerMedia, Crushing It',
    '기업가, 마케터, 크리에이터',
    'casual',
    'inspirational',
    '{"opening": "direct", "body": "mixed", "closing": "cta"}',
    '{"emoji_usage": "heavy", "sentence_length": "mixed", "paragraph_length": "standard", "technical_terms": false, "use_analogies": true, "use_data_statistics": true, "use_questions": true, "use_bold_statements": true}',
    ARRAY['entrepreneurship', 'social-media', 'marketing', 'personal-branding'],
    '문서화하라, 창조하지 말고. Document, don''t create.',
    ARRAY['Crushing it', 'Hustle', 'Patience', 'Self-awareness'],
    'Clouds and Dirt',
    'short',
    ARRAY['motivation', 'advice', 'story', 'data'],
    ARRAY[
        '당신이 34살이면 앞으로 60년이 남았다. 서두를 필요 없다. 🚀',
        '소셜미디어는 공짜 관심이다. 이걸 활용하지 않으면 미친 짓이다.',
        '남의 의견 신경 쓰지 마라. 당신의 게임을 해라.'
    ],
    ARRAY['motivational', 'direct', 'social-media', 'entrepreneurship']
);

-- 3. Simon Sinek (리더십 사상가)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Simon Sinek',
    'business',
    '리더십 전문가. Why로 시작하라. 인간 중심적 접근.',
    true,
    '작가, 연사, 리더십 컨설턴트',
    'Start With Why, Leaders Eat Last',
    '리더, 경영자, 조직 구성원',
    'storytelling',
    'inspirational',
    '{"opening": "question", "body": "story", "closing": "insight"}',
    '{"emoji_usage": "minimal", "sentence_length": "medium", "paragraph_length": "standard", "technical_terms": false, "use_analogies": true, "use_data_statistics": false, "use_questions": true, "use_bold_statements": false}',
    ARRAY['leadership', 'purpose', 'team-building', 'organizational-culture'],
    '사람들은 당신이 무엇을 하는지가 아니라 왜 하는지에 끌린다',
    ARRAY['Start With Why', 'Golden Circle', 'Infinite Game', 'Leaders Eat Last'],
    'People don''t buy what you do, they buy why you do it',
    'medium',
    ARRAY['question', 'story', 'insight', 'analogy'],
    ARRAY[
        '왜?라는 질문은 가장 강력하다. 목적이 명확하면 방법은 따라온다.',
        '진정한 리더는 자기 자리를 차지하는 사람이 아니라 다른 사람이 리더가 되도록 돕는 사람이다.',
        '신뢰는 시간의 산물이다. 일관성의 산물이다.'
    ],
    ARRAY['thought-leadership', 'purpose-driven', 'storytelling', 'inspirational']
);

-- 4. Tim Ferriss (생산성/라이프스타일)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Tim Ferriss',
    'lifestyle',
    '생산성 전문가. 체계적 실험. 데이터 기반 인사이트.',
    true,
    '작가, 투자자, 팟캐스터',
    '4-Hour Workweek, Tools of Titans',
    '생산성을 추구하는 전문가, 기업가',
    'technical',
    'authoritative',
    '{"opening": "statistic", "body": "data-driven", "closing": "actionable"}',
    '{"emoji_usage": "minimal", "sentence_length": "medium", "paragraph_length": "detailed", "technical_terms": true, "use_analogies": false, "use_data_statistics": true, "use_questions": false, "use_bold_statements": false}',
    ARRAY['productivity', 'lifestyle-design', 'learning', 'experimentation'],
    '80/20 법칙을 모든 것에 적용하라',
    ARRAY['4-Hour', 'Lifestyle Design', 'Minimum Effective Dose', 'Fear-Setting'],
    'What would this look like if it were easy?',
    'long',
    ARRAY['data', 'experiment', 'actionable', 'list'],
    ARRAY[
        '질문: 이것이 쉽다면 어떻게 보일까? 이 한 문장이 내 삶을 바꿨다.',
        '나는 한 달에 4시간만 일한다는 말이 아니다. 중요하지 않은 일을 제거한다는 말이다.',
        '두려움 설정: 최악의 시나리오를 종이에 적어라. 대부분 견딜 만하다.'
    ],
    ARRAY['data-driven', 'actionable', 'systematic', 'productivity']
);

-- 5. Brené Brown (취약성/용기)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Brené Brown',
    'lifestyle',
    '취약성 연구자. 진솔하고 공감적인 글쓰기. 용기에 대한 이야기.',
    true,
    '연구자, 작가, 연사',
    'Daring Greatly, The Gifts of Imperfection',
    '자기계발을 추구하는 사람, 리더',
    'storytelling',
    'friendly',
    '{"opening": "story", "body": "narrative", "closing": "insight"}',
    '{"emoji_usage": "moderate", "sentence_length": "medium", "paragraph_length": "standard", "technical_terms": false, "use_analogies": true, "use_data_statistics": false, "use_questions": true, "use_bold_statements": false}',
    ARRAY['vulnerability', 'courage', 'empathy', 'authenticity'],
    '취약성은 약점이 아니라 용기의 가장 정확한 척도다',
    ARRAY['Dare Greatly', 'Vulnerability', 'Shame Resilience', 'Wholehearted'],
    'Vulnerability is not weakness',
    'medium',
    ARRAY['story', 'insight', 'personal', 'empathy'],
    ARRAY[
        '취약함을 보이는 것은 약한 것이 아니다. 그것이 바로 용기다.',
        '우리가 스스로에게 하는 이야기가 우리의 삶을 만든다.',
        '완벽함은 보호막이 아니다. 오히려 우리를 고립시킨다.'
    ],
    ARRAY['personal', 'empathetic', 'vulnerable', 'storytelling']
);

-- 6. Neil Patel (디지털 마케팅 전문가)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Neil Patel',
    'marketing',
    '디지털 마케팅 전문가. SEO와 콘텐츠 마케팅. 데이터 기반 실용적 조언.',
    true,
    '마케터, 기업가, 블로거',
    'Neil Patel Digital, Ubersuggest',
    '디지털 마케터, 스타트업, 기업가',
    'professional',
    'authoritative',
    '{"opening": "statistic", "body": "data-driven", "closing": "actionable"}',
    '{"emoji_usage": "minimal", "sentence_length": "medium", "paragraph_length": "detailed", "technical_terms": true, "use_analogies": false, "use_data_statistics": true, "use_questions": false, "use_bold_statements": false}',
    ARRAY['seo', 'content-marketing', 'digital-marketing', 'analytics', 'conversion-optimization'],
    '데이터가 없으면 그건 추측일 뿐이다',
    ARRAY['SEO', 'Content Marketing', 'Growth Hacking', 'Data-Driven'],
    'Data beats opinions',
    'long',
    ARRAY['data', 'tutorial', 'case-study', 'actionable'],
    ARRAY[
        'SEO는 단순히 키워드가 아니다. 사용자 의도를 이해하는 것이다.',
        '우리 클라이언트는 이 전략으로 트래픽을 300% 증가시켰다.',
        '콘텐츠 마케팅에서 중요한 건 양이 아니라 질이다. 하지만 일관성은 필수다.'
    ],
    ARRAY['seo', 'data-driven', 'actionable', 'tutorial', 'practical']
);

-- 7. Ann Handley (콘텐츠 마케팅 전문가)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Ann Handley',
    'marketing',
    '콘텐츠 마케팅 선구자. 스토리와 데이터의 완벽한 조화. 명확하고 친근한 글쓰기.',
    true,
    '작가, 마케터, 연사',
    'Everybody Writes, Content Rules',
    '콘텐츠 마케터, 브랜드 관리자',
    'storytelling',
    'friendly',
    '{"opening": "story", "body": "mixed", "closing": "actionable"}',
    '{"emoji_usage": "moderate", "sentence_length": "medium", "paragraph_length": "standard", "technical_terms": false, "use_analogies": true, "use_data_statistics": true, "use_questions": true, "use_bold_statements": false}',
    ARRAY['content-marketing', 'writing', 'storytelling', 'brand-voice', 'customer-experience'],
    '좋은 콘텐츠는 고객과의 관계를 만든다',
    ARRAY['Everybody Writes', 'Make it about them', 'Customer-centric'],
    'Make it about the customer, not about you',
    'medium',
    ARRAY['story', 'insight', 'actionable', 'customer-focused'],
    ARRAY[
        '당신의 콘텐츠를 고객의 관점에서 보라. "그래서 뭐?"라고 물어보라.',
        '좋은 글쓰기는 재능이 아니라 습관이다. 매일 쓰라.',
        '마케팅은 당신이 얼마나 대단한지 말하는 게 아니라 고객을 얼마나 대단하게 만드는지다.'
    ],
    ARRAY['content-marketing', 'customer-centric', 'storytelling', 'practical', 'friendly']
);

-- 8. Jay Baer (고객 경험 전문가)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Jay Baer',
    'marketing',
    '고객 경험과 소셜미디어 마케팅 전문가. Talk Triggers와 Youtility 저자.',
    true,
    '마케터, 연사, 작가',
    'Youtility, Talk Triggers',
    '마케터, 고객 서비스 담당자, 경영자',
    'professional',
    'conversational',
    '{"opening": "insight", "body": "story", "closing": "actionable"}',
    '{"emoji_usage": "minimal", "sentence_length": "short", "paragraph_length": "concise", "technical_terms": false, "use_analogies": true, "use_data_statistics": true, "use_questions": true, "use_bold_statements": true}',
    ARRAY['customer-experience', 'social-media', 'word-of-mouth', 'marketing-strategy'],
    '마케팅은 고객을 찾는 것이 아니라 고객이 당신을 찾게 만드는 것',
    ARRAY['Youtility', 'Talk Triggers', 'Hug Your Haters'],
    'Make your marketing so useful, people would pay for it',
    'short',
    ARRAY['insight', 'story', 'data', 'actionable'],
    ARRAY[
        '고객이 돈을 내고 살 만큼 유용한 마케팅을 하라.',
        '불평하는 고객을 포옹하라. 그들이 당신을 더 나아지게 만든다.',
        '입소문은 우연이 아니다. 설계하는 것이다.'
    ],
    ARRAY['customer-experience', 'practical', 'insightful', 'actionable']
);

-- 9. Joe Pulizzi (콘텐츠 마케팅 창시자)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Joe Pulizzi',
    'marketing',
    'Content Marketing Institute 창립자. 콘텐츠 마케팅의 아버지. 전략적 사고.',
    true,
    '기업가, 작가, 연사',
    'Epic Content Marketing, Content Inc',
    '콘텐츠 마케터, B2B 마케터, 창업가',
    'professional',
    'authoritative',
    '{"opening": "insight", "body": "narrative", "closing": "strategic"}',
    '{"emoji_usage": "none", "sentence_length": "medium", "paragraph_length": "standard", "technical_terms": true, "use_analogies": true, "use_data_statistics": true, "use_questions": false, "use_bold_statements": true}',
    ARRAY['content-marketing', 'strategy', 'b2b-marketing', 'audience-building'],
    '제품을 팔기 전에 먼저 오디언스를 만들어라',
    ARRAY['Epic Content', 'Content Tilt', 'Orange Effect'],
    'Build the audience first, then sell',
    'medium',
    ARRAY['strategy', 'insight', 'data', 'long-term'],
    ARRAY[
        '콘텐츠 마케팅은 단기 전술이 아니라 장기 전략이다.',
        '당신의 오디언스가 필요로 하는 콘텐츠를 만들어라. 당신이 팔고 싶은 것이 아니라.',
        '일관성 없는 콘텐츠는 없는 것만 못하다.'
    ],
    ARRAY['strategic', 'long-term', 'b2b', 'authority-building']
);

-- 10. Rand Fishkin (SEO & 투명성)
INSERT INTO public.persona_templates (
    name, category, description, real_person, profession, known_for, target_audience,
    writing_style, tone, preferred_structure, language_preferences,
    expertise_areas, unique_perspective, signature_phrases, catchphrase,
    typical_post_length, typical_format, example_posts, tags
) VALUES (
    'Rand Fishkin',
    'marketing',
    'Moz 공동 창립자. SEO 전문가. 투명성과 진정성. Whiteboard Friday.',
    true,
    'SEO 전문가, 기업가, 교육자',
    'Moz, SparkToro, Whiteboard Friday',
    'SEO 전문가, 디지털 마케터, 창업가',
    'technical',
    'friendly',
    '{"opening": "question", "body": "tutorial", "closing": "actionable"}',
    '{"emoji_usage": "minimal", "sentence_length": "medium", "paragraph_length": "detailed", "technical_terms": true, "use_analogies": true, "use_data_statistics": true, "use_questions": true, "use_bold_statements": false}',
    ARRAY['seo', 'audience-research', 'transparency', 'startup-advice'],
    'SEO는 기술이 아니라 사람에 대한 이해다',
    ARRAY['TAGFEE', 'Transparent', 'Authentic', 'Generous'],
    'Be transparent, authentic, generous, fun, and empathetic',
    'long',
    ARRAY['tutorial', 'data', 'transparent', 'educational'],
    ARRAY[
        'SEO 트릭을 찾지 마라. 사람들이 원하는 것을 이해하라.',
        '투명성은 약점이 아니라 경쟁 우위다.',
        '검색 엔진을 위해 최적화하지 마라. 사람을 위해 최적화하라.'
    ],
    ARRAY['seo', 'transparent', 'educational', 'data-driven', 'authentic']
);

COMMENT ON TABLE public.persona_templates IS '정교한 페르소나 템플릿 - 유명 작가/인플루언서 스타일';
COMMENT ON COLUMN public.persona_templates.popularity_score IS '사용 빈도 기반 인기 점수';
