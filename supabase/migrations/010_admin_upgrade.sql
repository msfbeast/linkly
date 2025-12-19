-- Upgrade specific user to full access (Business Tier + Super Admin)
-- Run this in your Supabase SQL Editor

-- 1. Update the Profiles table (Application Logic)
UPDATE profiles
SET 
  subscription_tier = 'business',
  subscription_status = 'active',
  role = 'super_admin',
  updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'msfconsole007@gmail.com'
);

-- 2. Update Auth Metadata (Core Security/RLS)
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "super_admin", "subscription": "business"}'::jsonb
WHERE email = 'msfconsole007@gmail.com';
