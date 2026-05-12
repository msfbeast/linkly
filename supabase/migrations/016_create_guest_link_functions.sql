-- ============================================
-- Migration 016: Create Guest Link RPC Functions
-- Fix: Guest link creation fails with RLS 401 because
-- the 'create_guest_link' and 'update_guest_link_metadata' 
-- SECURITY DEFINER functions were never created.
-- ============================================

-- 1. Create the guest link creation function (bypasses RLS)
DROP FUNCTION IF EXISTS public.create_guest_link(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_guest_link(
    p_original_url TEXT,
    p_short_code TEXT,
    p_guest_session_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id UUID;
    result JSON;
BEGIN
    new_id := gen_random_uuid();

    INSERT INTO public.links (
        id,
        original_url,
        short_code,
        title,
        clicks,
        created_at,
        is_guest,
        guest_session_id,
        metadata
    ) VALUES (
        new_id,
        p_original_url,
        p_short_code,
        'Guest Link',
        0,
        NOW(),
        TRUE,
        p_guest_session_id,
        jsonb_build_object('guest_session_id', p_guest_session_id)
    );

    SELECT json_build_object('id', new_id) INTO result;
    RETURN result;
END;
$$;

-- Grant execution to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_guest_link(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_guest_link(TEXT, TEXT, TEXT) TO authenticated;

-- 2. Create the guest link metadata update function (for saving email)
DROP FUNCTION IF EXISTS public.update_guest_link_metadata(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.update_guest_link_metadata(
    p_link_id UUID,
    p_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.links
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('guest_email', p_email)
    WHERE id = p_link_id
      AND is_guest = TRUE;
END;
$$;

-- Grant execution
GRANT EXECUTE ON FUNCTION public.update_guest_link_metadata(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_guest_link_metadata(UUID, TEXT) TO authenticated;

-- 3. Add guest link columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'links' AND column_name = 'is_guest'
    ) THEN
        ALTER TABLE public.links ADD COLUMN is_guest BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'links' AND column_name = 'guest_session_id'
    ) THEN
        ALTER TABLE public.links ADD COLUMN guest_session_id TEXT;
    END IF;
END $$;

-- 4. Add RLS policy to allow reading guest links by short_code (for redirect)
DROP POLICY IF EXISTS "Allow public read access to guest links" ON public.links;
CREATE POLICY "Allow public read access to guest links" ON public.links
    FOR SELECT
    USING (is_guest = TRUE);
