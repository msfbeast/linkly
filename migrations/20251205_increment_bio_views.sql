-- Bio Profile Views Counter Function
-- Run this in Supabase SQL Editor

-- Create the increment_bio_views function
CREATE OR REPLACE FUNCTION increment_bio_views(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE bio_profiles
    SET views = COALESCE(views, 0) + 1
    WHERE id = profile_id;
END;
$$;

-- Grant execute permission to authenticated and anon users (for public bio pages)
GRANT EXECUTE ON FUNCTION increment_bio_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_bio_views(UUID) TO anon;
