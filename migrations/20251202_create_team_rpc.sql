-- Migration: Create Team RPC
-- Creates a stored procedure to handle team creation and owner assignment atomically
-- This avoids RLS race conditions where the owner cannot add themselves to the team_members table

CREATE OR REPLACE FUNCTION create_team_with_owner(
  team_name TEXT,
  team_slug TEXT,
  owner_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS for the function execution
AS $$
DECLARE
  new_team_id UUID;
  new_team_created_at TIMESTAMP WITH TIME ZONE;
  result JSONB;
BEGIN
  -- 1. Insert the new team
  INSERT INTO teams (name, slug, owner_id)
  VALUES (team_name, team_slug, owner_uuid)
  RETURNING id, created_at INTO new_team_id, new_team_created_at;

  -- 2. Add the owner as a member
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (new_team_id, owner_uuid, 'owner');

  -- 3. Construct the return object
  result := jsonb_build_object(
    'id', new_team_id,
    'name', team_name,
    'slug', team_slug,
    'owner_id', owner_uuid,
    'created_at', new_team_created_at
  );

  RETURN result;
END;
$$;
