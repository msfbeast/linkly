-- Security Hardening Migration
-- Updates RPC functions with Input Validation and Rate Limiting

-- 1. Harden create_team_with_owner
-- Drop first to handle parameter name changes
DROP FUNCTION IF EXISTS create_team_with_owner(text, text, uuid);

CREATE OR REPLACE FUNCTION create_team_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_owner_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_count INTEGER;
BEGIN
  -- A. Input Validation
  -- 1. Name Length (3-50 chars)
  IF length(p_name) < 3 OR length(p_name) > 50 THEN
    RAISE EXCEPTION 'Invalid name: Must be between 3 and 50 characters.';
  END IF;

  -- 2. Slug Validation (lowercase, numbers, hyphens only)
  IF NOT p_slug ~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid slug: Must contain only lowercase letters, numbers, and hyphens.';
  END IF;

  -- B. Rate Limiting
  -- Max 5 teams created per hour per user
  SELECT count(*) INTO v_count 
  FROM teams 
  WHERE owner_id = p_owner_id 
  AND created_at > NOW() - INTERVAL '1 hour';

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: You can only create 5 teams per hour.';
  END IF;

  -- C. Execution (Original Logic)
  -- 1. Create Team
  INSERT INTO teams (name, slug, owner_id)
  VALUES (p_name, p_slug, p_owner_id)
  RETURNING id INTO v_team_id;

  -- 2. Add Owner as Member
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (v_team_id, p_owner_id, 'owner');

  RETURN jsonb_build_object('id', v_team_id, 'name', p_name, 'slug', p_slug);
END;
$$;

-- 2. Harden create_team_invite
-- Drop first to handle parameter name changes
DROP FUNCTION IF EXISTS create_team_invite(uuid, text, text, text);

CREATE OR REPLACE FUNCTION create_team_invite(
  p_team_id UUID,
  p_email TEXT,
  p_role TEXT,
  p_token TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inviter_id UUID;
  v_invite_id UUID;
  v_count INTEGER;
BEGIN
  v_inviter_id := auth.uid();
  
  -- A. Input Validation
  -- 1. Email Validation (Basic Regex)
  IF NOT p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address.';
  END IF;

  -- B. Rate Limiting
  -- Max 20 invites sent per hour per user
  SELECT count(*) INTO v_count 
  FROM team_invites 
  WHERE created_by = v_inviter_id 
  AND created_at > NOW() - INTERVAL '1 hour';

  IF v_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: You can only send 20 invites per hour.';
  END IF;

  -- C. Execution (Original Logic)
  -- 1. Check permissions (Must be owner or admin)
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
    AND user_id = v_inviter_id 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: You must be an owner or admin to invite members.';
  END IF;

  -- 2. Insert invite
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

  RETURN jsonb_build_object('id', v_invite_id);
END;
$$;
