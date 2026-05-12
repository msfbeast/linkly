-- Grant "Pro" access to akshaychaudhari@trak.in
-- Run this in your Supabase SQL Editor

-- 1. Update the Profiles table (Application Logic)
UPDATE profiles
SET 
  subscription_tier = 'pro',
  subscription_status = 'active',
  updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'akshaychaudhari@trak.in'
);

-- 2. Update Auth Metadata (Core Security/RLS)
-- This ensures that the user's JWT token will contain the correct subscription data on next login
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"subscription": "pro"}'::jsonb
WHERE email = 'akshaychaudhari@trak.in';
