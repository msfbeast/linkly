-- Guest Link Creation Support

-- 1. Add columns to links table
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS claim_token UUID UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS guest_session_id TEXT;

-- Index for faster cleanup and lookups
CREATE INDEX IF NOT EXISTS idx_links_is_guest ON public.links(is_guest);
CREATE INDEX IF NOT EXISTS idx_links_claim_token ON public.links(claim_token);
CREATE INDEX IF NOT EXISTS idx_links_expires_at ON public.links(expires_at);

-- 2. RPC: Create Guest Link (Secure & Rate Limited)
CREATE OR REPLACE FUNCTION public.create_guest_link(
  p_original_url TEXT,
  p_short_code TEXT,
  p_guest_session_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id UUID;
  v_claim_token UUID;
  v_expires_at TIMESTAMPTZ;
  v_rate_limit_count INT;
BEGIN
  -- Rate Limiting: Check how many guest links this session created in the last hour
  SELECT COUNT(*) INTO v_rate_limit_count
  FROM public.links
  WHERE guest_session_id = p_guest_session_id
  AND created_at > NOW() - INTERVAL '1 hour';

  IF v_rate_limit_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded. You can only create 10 guest links per hour.';
  END IF;

  -- Generate values
  v_claim_token := gen_random_uuid();
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Insert Link
  INSERT INTO public.links (
    original_url,
    short_code,
    title,
    is_guest,
    claim_token,
    expires_at,
    guest_session_id,
    clicks,
    created_at
  ) VALUES (
    p_original_url,
    p_short_code,
    'Guest Link',
    true,
    v_claim_token,
    v_expires_at,
    p_guest_session_id,
    0,
    NOW()
  )
  RETURNING id INTO v_link_id;

  -- Return the result
  RETURN jsonb_build_object(
    'id', v_link_id,
    'short_code', p_short_code,
    'claim_token', v_claim_token,
    'expires_at', v_expires_at
  );
END;
$$;

-- 3. RPC: Claim Guest Link
CREATE OR REPLACE FUNCTION public.claim_guest_link(
  p_claim_token UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id UUID;
BEGIN
  -- Update the link to belong to the user
  UPDATE public.links
  SET 
    user_id = p_user_id,
    is_guest = false,
    claim_token = NULL,
    expires_at = NULL,
    guest_session_id = NULL
  WHERE claim_token = p_claim_token
  AND is_guest = true
  RETURNING id INTO v_link_id;

  IF v_link_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired claim token.';
  END IF;

  RETURN jsonb_build_object('success', true, 'link_id', v_link_id);
END;
$$;

-- 4. RLS Policies for Guest Links
-- Allow anyone to read guest links (for redirection)
DROP POLICY IF EXISTS "Public can read guest links" ON public.links;

CREATE POLICY "Public can read guest links"
ON public.links FOR SELECT
USING (is_guest = true);

-- Allow anyone to insert guest links (via RPC only, but RLS needs to allow it if we weren't using SECURITY DEFINER)
-- Since we use SECURITY DEFINER RPC, we don't strictly need an INSERT policy for public, 
-- but it's good practice to keep the table locked down and rely on the RPC.
