-- Fix Signup Trigger
-- Robust handling of new user creation to prevent 500 errors

-- Drop existing trigger and function to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username text;
  v_full_name text;
  v_avatar_url text;
BEGIN
  -- Extract metadata with fallbacks
  -- The app sends 'display_name', but we map it to 'full_name'
  v_username := new.raw_user_meta_data->>'username';
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name');
  v_avatar_url := new.raw_user_meta_data->>'avatar_url';

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
      -- If username is taken (unique constraint violation), try inserting without username
      -- This allows the user to be created, and they can fix the username later in settings
      RAISE WARNING 'Username % already exists, creating profile without username', v_username;
      INSERT INTO public.profiles (id, full_name, avatar_url)
      VALUES (new.id, v_full_name, v_avatar_url)
      ON CONFLICT (id) DO NOTHING;
    WHEN OTHERS THEN
      -- Log other errors but don't block signup
      RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
      -- Attempt minimal insert
      INSERT INTO public.profiles (id) VALUES (new.id) ON CONFLICT DO NOTHING;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
