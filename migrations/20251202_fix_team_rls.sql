-- Migration: Fix Team RLS Policies
-- Adds missing INSERT/UPDATE/DELETE policies for team_members and team_invites

-- Team Members Policies

-- Allow users to add themselves as owner when creating a team
-- This is tricky because the team exists but they aren't a member yet.
-- We check if they are the owner of the team they are trying to join.
CREATE POLICY "Team owners can add themselves" 
  ON team_members FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.owner_id = auth.uid()
    )
  );

-- Allow admins/owners to add other members (if we implement direct add later)
CREATE POLICY "Team admins can add members" 
  ON team_members FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Allow admins/owners to update member roles
CREATE POLICY "Team admins can update members" 
  ON team_members FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Allow admins/owners to remove members
CREATE POLICY "Team admins can remove members" 
  ON team_members FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Team Invites Policies

-- Allow admins/owners to create invites
CREATE POLICY "Team admins can create invites" 
  ON team_invites FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invites.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Allow admins/owners to delete invites
CREATE POLICY "Team admins can delete invites" 
  ON team_invites FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invites.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );
