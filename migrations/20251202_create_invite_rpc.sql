-- Create RPC function to handle team invites securely
-- This bypasses client-side RLS complexity while maintaining security checks

CREATE OR REPLACE FUNCTION create_team_invite(
  p_team_id UUID,
  p_email TEXT,
  p_role TEXT,
  p_token TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
SET search_path = public
AS $$
DECLARE
  v_inviter_id UUID;
  v_invite_id UUID;
BEGIN
  v_inviter_id := auth.uid();
  
  -- 1. Check if user is authenticated
  IF v_inviter_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Check permissions (Must be owner or admin of the team)
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = v_inviter_id 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: You must be an owner or admin to invite members.';
  END IF;

  -- 3. Insert invite
  INSERT INTO team_invites (team_id, email, role, token, expires_at, created_by)
  VALUES (
    p_team_id, 
    p_email, 
    p_role, 
    p_token, 
    NOW() + INTERVAL '7 days',
    v_inviter_id
  )
  RETURNING id INTO v_invite_id;

  -- 4. Return result
  RETURN jsonb_build_object('id', v_invite_id);
END;
$$;
