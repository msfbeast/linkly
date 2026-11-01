-- Refuse script-capable URLs as link and product destinations.
--
-- The redirect page and storefront navigate to these with
-- window.location / window.open, where a javascript: URL runs on our
-- origin (React only neutralises it in href attributes). The app now
-- checks before navigating (utils/safeUrl.ts); this stops such URLs being
-- saved at all, through the app, the API or direct REST calls.
--
-- Whitespace and control characters are stripped before matching, because
-- browsers ignore them inside the scheme ("java\tscript:"). No existing rows
-- match (checked in production). Safe to re-run.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'links_original_url_no_script') THEN
    ALTER TABLE public.links ADD CONSTRAINT links_original_url_no_script CHECK (
      regexp_replace(original_url, '[[:space:][:cntrl:]]', '', 'g') !~* '^(javascript|data|vbscript|file|blob|filesystem):'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_original_url_no_script') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_original_url_no_script CHECK (
      original_url IS NULL OR
      regexp_replace(original_url, '[[:space:][:cntrl:]]', '', 'g') !~* '^(javascript|data|vbscript|file|blob|filesystem):'
    );
  END IF;
END $$;
