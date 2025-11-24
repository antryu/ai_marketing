-- PRODUCTION: Enable RLS for all tables
-- This ensures data isolation between users

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Verify RLS policies exist (these should already exist from 001_initial_schema.sql)
-- If policies were dropped, they will need to be recreated

-- Test query to verify RLS is working:
-- SELECT * FROM brands; -- Should only return current user's brands
