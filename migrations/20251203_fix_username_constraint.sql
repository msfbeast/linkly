-- Fix Username Constraint
-- Allow dots in usernames to match client-side validation

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS check_username_format;

ALTER TABLE profiles
  ADD CONSTRAINT check_username_format 
  CHECK (username ~* '^[a-zA-Z0-9._-]+$');
