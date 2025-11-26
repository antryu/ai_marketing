-- Add SEO keywords column to contents table
-- This allows easier access to keywords for display and filtering

ALTER TABLE public.contents
ADD COLUMN seo_keywords TEXT[];

-- Add index for SEO keywords search
CREATE INDEX idx_contents_seo_keywords ON public.contents USING GIN (seo_keywords);

-- Add comment
COMMENT ON COLUMN public.contents.seo_keywords IS 'SEO 키워드 배열 - 검색 최적화 및 콘텐츠 분류에 사용';
