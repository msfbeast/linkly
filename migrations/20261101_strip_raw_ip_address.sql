-- Stop storing raw visitor IPs in ip_address.
--
-- The record_click database function writes the visitor's raw IP into an
-- ip_address column (click_events, or clicks in its older version). It is a
-- SECURITY DEFINER function callable by anyone, so rather than depend on
-- which version of it is deployed, this trigger blanks ip_address on every
-- insert and update, whoever writes it. Visitor counting uses the hashed
-- ip_hash column instead (see utils/ipHash.ts).
--
-- Existing rows are cleaned by scripts/hash-stored-ips.js, which hashes the
-- old values into ip_hash before clearing them. Apply this migration first,
-- then run the script.
--
-- Only tables that have an ip_address column get the trigger, so this is
-- safe whether or not either table or column exists. Safe to re-run.

CREATE OR REPLACE FUNCTION public.strip_raw_ip_address()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Via jsonb so the function doesn't reference the column by name.
  NEW := jsonb_populate_record(NEW, '{"ip_address": null}'::jsonb);
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['click_events', 'clicks'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'ip_address'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS strip_raw_ip_address ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER strip_raw_ip_address BEFORE INSERT OR UPDATE ON public.%I '
        'FOR EACH ROW EXECUTE FUNCTION public.strip_raw_ip_address()', t);
    END IF;
  END LOOP;
END $$;
