-- Add video_projects table
CREATE TABLE IF NOT EXISTS public.video_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    format TEXT NOT NULL, -- '16:9', '9:16', '1:1', '4:5'
    quality TEXT DEFAULT '1080p', -- '720p', '1080p', '4k'
    duration INTEGER, -- seconds

    scenes JSONB NOT NULL, -- Array of VideoScene objects

    status TEXT DEFAULT 'draft', -- 'draft', 'rendering', 'completed', 'failed'

    metadata JSONB, -- AI generation info, model, topic, platform, style

    video_url TEXT, -- Final rendered video URL
    thumbnail_url TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view video projects of their brands"
    ON public.video_projects FOR SELECT
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert video projects for their brands"
    ON public.video_projects FOR INSERT
    WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update video projects of their brands"
    ON public.video_projects FOR UPDATE
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete video projects of their brands"
    ON public.video_projects FOR DELETE
    USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.video_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Index
CREATE INDEX idx_video_projects_brand_id ON public.video_projects(brand_id);
