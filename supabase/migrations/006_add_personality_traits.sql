-- Add personality traits to personas table for better targeting
-- Phase 1: Target Persona enhancement

ALTER TABLE public.personas
ADD COLUMN mbti TEXT, -- 'ENFP', 'INTJ', etc. (16 types)
ADD COLUMN generation TEXT, -- 'Z세대', '밀레니얼', 'X세대', '베이비부머'
ADD COLUMN blood_type TEXT, -- 'A', 'B', 'O', 'AB' (optional, Korean preference)
ADD COLUMN zodiac_sign TEXT; -- '양자리', '황소자리', etc. (optional)

-- Add comments for clarity
COMMENT ON COLUMN public.personas.mbti IS 'MBTI 성격 유형 (예: ENFP, INTJ) - 16가지';
COMMENT ON COLUMN public.personas.generation IS '세대 구분 (Z세대, 밀레니얼, X세대, 베이비부머)';
COMMENT ON COLUMN public.personas.blood_type IS '혈액형 (A, B, O, AB) - 한국 문화 특성';
COMMENT ON COLUMN public.personas.zodiac_sign IS '별자리 (12개) - 선택사항';

-- Create index for commonly searched fields
CREATE INDEX idx_personas_mbti ON public.personas(mbti);
CREATE INDEX idx_personas_generation ON public.personas(generation);
