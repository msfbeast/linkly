-- Limit password guesses on protected links.
--
-- unlock_link could be called by anyone with the public anon key, as often
-- as they liked, so a short link password could be guessed by script.
-- Unlocking now goes through /api/link/unlock, which passes a keyed hash of
-- the visitor's IP to unlock_link_checked (service role only). Wrong
-- passwords are recorded, and a link stops accepting guesses:
--   * from one visitor after 5 wrong passwords in 15 minutes, and
--   * from everyone after 100 wrong passwords in an hour (many addresses).
-- A right password clears that visitor's failures.
--
-- Part 1 of 2, additive: apply BEFORE deploying the app version that calls
-- /api/link/unlock. Part 2 (20261101_unlock_attempt_limit_part2.sql) removes
-- the open unlock_link and goes AFTER that deploy. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.link_unlock_failures (
    link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    visitor text NOT NULL,
    failed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS link_unlock_failures_link_time ON public.link_unlock_failures (link_id, failed_at);

-- Server-side bookkeeping only: no policies, no API access.
ALTER TABLE public.link_unlock_failures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.link_unlock_failures FROM PUBLIC, anon, authenticated;

-- {"status":"ok","link":{...}} | {"status":"wrong"} | {"status":"limited"}
CREATE OR REPLACE FUNCTION public.unlock_link_checked(p_short_code text, p_password text, p_visitor text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  l public.links;
  v text := coalesce(nullif(p_visitor, ''), 'unknown');
BEGIN
  SELECT * INTO l FROM public.links WHERE short_code = p_short_code LIMIT 1;
  IF NOT FOUND OR coalesce(l.password_hash, '') = '' THEN
    RETURN jsonb_build_object('status', 'wrong');
  END IF;

  -- One attempt per link at a time, so parallel guesses can't all pass the
  -- count below before any of their failures is recorded.
  PERFORM pg_advisory_xact_lock(hashtextextended('unlock:' || l.id::text, 0));

  IF (SELECT count(*) FROM public.link_unlock_failures
      WHERE link_id = l.id AND visitor = v AND failed_at > now() - interval '15 minutes') >= 5
     OR (SELECT count(*) FROM public.link_unlock_failures
      WHERE link_id = l.id AND failed_at > now() - interval '1 hour') >= 100 THEN
    RETURN jsonb_build_object('status', 'limited');
  END IF;

  IF p_password IS NULL OR extensions.crypt(p_password, l.password_hash) <> l.password_hash THEN
    INSERT INTO public.link_unlock_failures (link_id, visitor) VALUES (l.id, v);
    DELETE FROM public.link_unlock_failures WHERE link_id = l.id AND failed_at < now() - interval '1 day';
    RETURN jsonb_build_object('status', 'wrong');
  END IF;

  DELETE FROM public.link_unlock_failures WHERE link_id = l.id AND visitor = v;
  l.password_hash := NULL;              -- unlocked: project as unprotected
  RETURN jsonb_build_object('status', 'ok',
    'link', public.link_public_json(l) || jsonb_build_object('requires_password', true));
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_link_checked(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_link_checked(text, text, text) TO service_role;
