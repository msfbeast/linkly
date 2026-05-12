-- Grant "Pro" access to kaivalyas@trak.in and arnavr@trak.in
-- Run this in your Supabase SQL Editor

-- 1. Update the Profiles table (Application Logic)
UPDATE profiles
SET 
  subscription_tier = 'pro',
  subscription_status = 'active',
  updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('kaivalyas@trak.in', 'arnavr@trak.in')
);

-- 2. Update Auth Metadata (Core Security/RLS)
-- This ensures that the users' JWT tokens will contain the correct subscription data on next login
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"subscription": "pro"}'::jsonb
WHERE email IN ('kaivalyas@trak.in', 'arnavr@trak.in');
