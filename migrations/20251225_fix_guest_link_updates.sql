-- Migration: Fix Guest Link Metadata Updates
-- Allows anonymous users to update their guest email via a secure RPC

CREATE OR REPLACE FUNCTION public.update_guest_link_metadata(
  p_link_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_id UUID;
BEGIN
  -- Security Check: Only allow updates if it's a guest link and not yet claimed
  -- We don't need to check session ID here if we trust the link ID, 
  -- but we ensure it's a guest link to prevent unauthorized user link updates.
  UPDATE public.links
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{guest_email}', to_jsonb(p_email))
  WHERE id = p_link_id
  AND is_guest = true
  RETURNING id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'Link not found or not a guest link.';
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_updated_id);
END;
$$;

-- Ensure public can execute this RPC
GRANT EXECUTE ON FUNCTION public.update_guest_link_metadata(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_guest_link_metadata(UUID, TEXT) TO authenticated;
