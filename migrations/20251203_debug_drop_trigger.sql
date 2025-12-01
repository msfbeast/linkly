-- DEBUG: Drop Signup Trigger
-- This will temporarily disable automatic profile creation to isolate the 500 error.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
