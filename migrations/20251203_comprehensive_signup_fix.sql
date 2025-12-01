-- Comprehensive Signup Fix
-- Resolves 500 errors by ensuring constraints and triggers are robust

-- 1. Ensure username is nullable (prevent NOT NULL violations)
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;

-- 2. Fix Username Constraint (Allow dots and NULLs)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_username_format;
ALTER TABLE profiles ADD CONSTRAINT check_username_format 
  CHECK (username IS NULL OR username ~* '^[a-zA-Z0-9._-]+$');

-- 3. Recreate Trigger with correct search_path and error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username text;
  v_full_name text;
  v_avatar_url text;
BEGIN
  -- Set search path to ensure we use public tables
  -- (Good practice for SECURITY DEFINER functions)
  -- Note: We can't use SET search_path in the DECLARE block, 
  -- so we rely on the function definition below or explicit schema qualification.
  
  -- Extract metadata with fallbacks
  v_username := new.raw_user_meta_data->>'username';
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name');
  v_avatar_url := new.raw_user_meta_data->>'avatar_url';

  -- Clean username if it's empty string (treat as null)
  IF v_username = '' THEN
    v_username := NULL;
  END IF;

  -- Insert into profiles
  BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (new.id, v_username, v_full_name, v_avatar_url)
    ON CONFLICT (id) DO UPDATE
    SET
      username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();
  EXCEPTION
    WHEN unique_violation THEN
      -- Username taken, try without it
      RAISE WARNING 'Username % already exists, creating profile without username', v_username;
      INSERT INTO public.profiles (id, full_name, avatar_url)
      VALUES (new.id, v_full_name, v_avatar_url)
      ON CONFLICT (id) DO NOTHING;
    WHEN OTHERS THEN
      -- Catch-all for other errors (e.g. constraint violations)
      RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
      -- Minimal insert to ensure profile exists
      INSERT INTO public.profiles (id) VALUES (new.id) ON CONFLICT DO NOTHING;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
