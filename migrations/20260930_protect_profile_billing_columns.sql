-- Protect billing and role columns on profiles from client-side writes.
--
-- The "Users can update own profile." policy lets a signed-in user update
-- any column of their own row, including subscription_tier and role. That
-- meant anyone could grant themselves a paid plan or admin from the browser
-- console. RLS can't restrict columns, so this trigger does.
--
-- Rules for requests made as the API roles (anon / authenticated):
--   * role can only be changed by a super_admin
--   * billing columns can only be changed by an admin or super_admin
--   * self-inserted profiles must use the defaults
-- The service role (server API routes, webhooks), the postgres role
-- (SQL editor, migrations) and SECURITY DEFINER functions (signup trigger)
-- are not affected.
--
-- Columns are read through to_jsonb() so the trigger works whether or not
-- optional columns (e.g. the stripe_* ones) exist in this database.

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
SET search_path = public
AS $$
DECLARE
  billing_cols text[] := ARRAY[
    'subscription_tier',
    'subscription_status',
    'trial_ends_at',
    'razorpay_customer_id',
    'razorpay_subscription_id',
    'stripe_customer_id',
    'stripe_subscription_id'
  ];
  col text;
  new_row jsonb := to_jsonb(NEW);
  old_row jsonb;
  caller_role text;
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF coalesce(new_row->>'role', 'user') <> 'user'
       OR coalesce(new_row->>'subscription_tier', 'free') <> 'free'
       OR coalesce(new_row->>'subscription_status', 'active') <> 'active'
       OR new_row->>'trial_ends_at' IS NOT NULL
       OR new_row->>'razorpay_customer_id' IS NOT NULL
       OR new_row->>'razorpay_subscription_id' IS NOT NULL
       OR new_row->>'stripe_customer_id' IS NOT NULL
       OR new_row->>'stripe_subscription_id' IS NOT NULL THEN
      RAISE EXCEPTION 'Not allowed to set billing or role fields on profiles'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  old_row := to_jsonb(OLD);
  caller_role := public.current_profile_role();

  IF (new_row->'role') IS DISTINCT FROM (old_row->'role')
     AND caller_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Only a super admin can change profile roles'
      USING ERRCODE = '42501';
  END IF;

  FOREACH col IN ARRAY billing_cols LOOP
    IF (new_row->col) IS DISTINCT FROM (old_row->col)
       AND coalesce(caller_role, '') NOT IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Not allowed to change %', col
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();
