-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'failed')) DEFAULT 'pending',
  verification_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own domains"
  ON domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own domains"
  ON domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains"
  ON domains FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
