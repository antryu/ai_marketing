-- DEVELOPMENT ONLY: Disable RLS for development
-- TODO: Re-enable this in production!

-- Disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics DISABLE ROW LEVEL SECURITY;
