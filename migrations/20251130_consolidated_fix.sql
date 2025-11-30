-- CONSOLIDATED FIX SCRIPT
-- Run this entire script in Supabase SQL Editor to fix all 404/406 errors.

-- 1. Fix Profiles Schema (Solves 406 Error)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP WITH TIME ZONE;

-- 2. Create Teams Tables (Solves 404 Error)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Enable RLS for Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for Teams
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Users can view teams they belong to') THEN
        CREATE POLICY "Users can view teams they belong to" ON teams FOR SELECT USING (
            auth.uid() = owner_id OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Users can create teams') THEN
        CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Owners and Admins can update teams') THEN
        CREATE POLICY "Owners and Admins can update teams" ON teams FOR UPDATE USING (
            auth.uid() = owner_id OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid() AND team_members.role IN ('owner', 'admin'))
        );
    END IF;
END $$;

-- 5. Create API Keys Table (Prevent future 404s)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can manage their own API keys') THEN
        CREATE POLICY "Users can manage their own API keys" ON api_keys FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
