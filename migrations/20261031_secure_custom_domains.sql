-- Secure custom domain ownership.
--
-- 1. Only the server may activate a domain. The "Users can update their own
--    domains" policy let a signed-in user set status = 'active' on any
--    domain name they typed in, without any DNS check. Verification now runs
--    in /api/domain/verify (service role); this trigger blocks the API roles
--    from setting status/verified_at, or renaming or reassigning a domain.
--
-- 2. One active owner per domain, but any number of pending claims. With a
--    plain UNIQUE (domain), whoever typed a domain in first blocked its real
--    owner from adding it. Now the first claim whose DNS actually points at
--    us wins (the verify endpoint removes the losing pending claims).

-- Drop whatever plain unique constraint exists on domains.domain (its name
-- differs depending on which earlier migration created the table).
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.domains'::regclass
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 1
      AND a.attname = 'domain'
  LOOP
    EXECUTE format('ALTER TABLE public.domains DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS domains_active_domain_key
  ON public.domains (lower(domain))
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.domains (lower(domain));

CREATE OR REPLACE FUNCTION public.protect_domain_verification_columns()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.domain := lower(trim(NEW.domain));
    IF NEW.status IS DISTINCT FROM 'pending' OR NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'New domains must start as pending'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.domain IS DISTINCT FROM OLD.domain
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.verification_token IS DISTINCT FROM OLD.verification_token THEN
    RAISE EXCEPTION 'Domain status and ownership can only be changed by verification'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_domain_verification_columns ON public.domains;
CREATE TRIGGER protect_domain_verification_columns
  BEFORE INSERT OR UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_domain_verification_columns();
