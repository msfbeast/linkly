-- Profiles are no longer readable by everyone.
--
-- "Public profiles are viewable by everyone." (USING (true), full column
-- grants) let anyone read every user's plan and trial, Razorpay and Stripe
-- customer/subscription ids, role, notification settings, onboarding state
-- and affiliate ids.
--
-- Nothing public needs another user's profile row: bio pages and
-- storefronts read bio_profiles and auth metadata. The two lookups that did
-- read other rows now go through functions that return one fact:
--   is_username_taken(username)      sign-up availability check (authService)
--   custom_domain_username(user_id)  middleware, custom domain -> bio page
--
-- Now: users read their own profile; admins read all (admin dashboard);
-- server code uses the service role as before.
-- Safe to re-run.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- current_profile_role() is SECURITY DEFINER, so this doesn't recurse.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.current_profile_role() IN ('admin', 'super_admin'));

CREATE OR REPLACE FUNCTION public.is_username_taken(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username);
$$;
REVOKE ALL ON FUNCTION public.is_username_taken(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_taken(text) TO anon, authenticated, service_role;

-- The username behind an active custom domain (null otherwise).
CREATE OR REPLACE FUNCTION public.custom_domain_username(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.username FROM public.profiles p
  WHERE p.id = p_user_id
    AND EXISTS (SELECT 1 FROM public.domains d WHERE d.user_id = p.id AND d.status = 'active');
$$;
REVOKE ALL ON FUNCTION public.custom_domain_username(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_domain_username(uuid) TO anon, authenticated, service_role;
