-- Free plan: 50 links instead of 15.
--
-- The dashboard and upgrade prompt already said 50, but this trigger
-- stopped free accounts at 15. Product links count towards the limit.
-- Same function as 20261101_team_invites_and_link_limit.sql with the new
-- number. Safe to re-run.

CREATE OR REPLACE FUNCTION public.enforce_free_link_limit()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_count integer;
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NULL OR NEW.team_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT subscription_tier INTO v_tier FROM public.profiles WHERE id = NEW.user_id;
  IF coalesce(v_tier, 'free') <> 'free' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_count FROM public.links
  WHERE user_id = NEW.user_id AND team_id IS NULL;

  IF v_count >= 50 THEN
    RAISE EXCEPTION 'Link limit reached for Free Tier. Please upgrade to create more links.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;
