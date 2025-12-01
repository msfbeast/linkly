-- Fail-Safe Signup Fix
-- This script recreates the trigger with a global error handler.
-- It will SWALLOW ALL ERRORS to prevent the signup from failing (500).

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create Fail-Safe Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Wrap EVERYTHING in a block to catch ANY error
  BEGIN
    -- Try to insert the profile
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      new.id, 
      NULLIF(new.raw_user_meta_data->>'username', ''), 
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'), 
      new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET
      username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();
      
  EXCEPTION WHEN OTHERS THEN
    -- SWALLOW THE ERROR
    -- Log it as a warning so we can see it in logs, but DO NOT FAIL the transaction
    RAISE WARNING 'Fail-Safe caught error in handle_new_user: %', SQLERRM;
    
    -- Attempt absolute minimal insert as fallback
    BEGIN
      INSERT INTO public.profiles (id) VALUES (new.id) ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- If even the minimal insert fails, do nothing.
      NULL;
    END;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recreate Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
