-- Add custom_theme column to bio_profiles table
-- This fixes the "Could not find the 'custom_theme' column" error
-- and enables deep customization persistence.

ALTER TABLE bio_profiles 
ADD COLUMN IF NOT EXISTS custom_theme jsonb DEFAULT '{}'::jsonb;

-- Optional: Add other likely missing columns for future-proofing if they are in your types
-- ALTER TABLE bio_profiles ADD COLUMN IF NOT EXISTS seo jsonb DEFAULT '{}'::jsonb;
-- ALTER TABLE bio_profiles ADD COLUMN IF NOT EXISTS appearance jsonb DEFAULT '{}'::jsonb;
