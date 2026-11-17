-- Repair link destinations that aren't web addresses, and stop new ones.
--
-- 17 links had destinations the redirect couldn't use, so visitors on a
-- computer got a server error (two of them, with ~1,000 clicks each, were
-- Amazon links saved without https://):
--   * no scheme ("amazon.in/...", "www.amazon.in/...", "google.com"):
--     https:// is added;
--   * a title pasted in front ("Folo – https://play.google.com/..."):
--     the address is kept;
--   * anything else (one email address) is left; the redirect now refuses
--     it with a plain "not a valid web address" page instead of an error.
-- Some short codes also had spaces or were empty; codes with spaces work
-- again because the redirect now decodes the address.
--
-- From now on links.original_url and links.short_code are checked when a
-- link is created or either column is changed, whichever way it is
-- written (app, guest links, API):
--   * destinations are normalised the same way, and refused if they still
--     aren't http(s) addresses (bio widgets' widget:// pass through);
--   * short codes may only use letters, digits, - and _, 1–64 characters.
-- Rows are only checked when those columns change, so click counting and
-- other updates of existing rows are unaffected.
--
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.normalize_web_url(p_url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    s text := btrim(p_url);
    found text;
    host text;
BEGIN
    IF s IS NULL OR s = '' THEN
        RETURN NULL;
    END IF;
    IF s ~* '^https?://' THEN
        s := regexp_replace(s, '\s', '%20', 'g');
    ELSE
        found := substring(s from '(?i)https?://[^\s<>"'']+');
        IF found IS NOT NULL THEN
            s := found;
        ELSE
            host := substring(s from '^[^/?#]*');
            IF s ~ '\s' OR host ~ '@' OR host !~ '[^.]\.[^.]' THEN
                RETURN NULL;
            END IF;
            s := 'https://' || s;
        END IF;
    END IF;
    IF s !~* '^https?://[^/?#\s]+' THEN
        RETURN NULL;
    END IF;
    RETURN s;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_web_url(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_web_url(text) TO service_role;

-- Repair what can be repaired.
UPDATE public.links
SET original_url = public.normalize_web_url(original_url)
WHERE original_url !~* '^(https?|widget)://'
  AND public.normalize_web_url(original_url) IS NOT NULL;

CREATE OR REPLACE FUNCTION public.check_link_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v text;
BEGIN
    IF TG_OP = 'INSERT' OR NEW.original_url IS DISTINCT FROM OLD.original_url THEN
        IF NEW.original_url IS NOT NULL AND NEW.original_url !~* '^widget://' THEN
            v := public.normalize_web_url(NEW.original_url);
            IF v IS NULL THEN
                RAISE EXCEPTION 'Enter a web address, like https://example.com/page.'
                    USING ERRCODE = '22023';
            END IF;
            NEW.original_url := v;
        END IF;
    END IF;
    IF TG_OP = 'INSERT' OR NEW.short_code IS DISTINCT FROM OLD.short_code THEN
        IF NEW.short_code IS NULL OR NEW.short_code !~ '^[A-Za-z0-9_-]{1,64}$' THEN
            RAISE EXCEPTION 'Short codes can only use letters, numbers, hyphens and underscores (up to 64).'
                USING ERRCODE = '22023';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_link_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS check_link_fields ON public.links;
CREATE TRIGGER check_link_fields
    BEFORE INSERT OR UPDATE OF original_url, short_code ON public.links
    FOR EACH ROW EXECUTE FUNCTION public.check_link_fields();
