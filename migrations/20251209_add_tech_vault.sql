-- Tech Vault Items Table for storing user's gear/equipment showcase
-- Created: 2025-12-09
-- MIGRATION ALREADY APPLIED

CREATE TABLE IF NOT EXISTS tech_vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT CHECK (category IN ('camera', 'audio', 'computer', 'accessories', 'other')),
  image_url TEXT,
  description TEXT,
  affiliate_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_tech_vault_items_user_id ON tech_vault_items(user_id);

-- Enable Row Level Security
ALTER TABLE tech_vault_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own items
CREATE POLICY "Users can view own tech vault items"
  ON tech_vault_items FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own items
CREATE POLICY "Users can insert own tech vault items"
  ON tech_vault_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own items
CREATE POLICY "Users can update own tech vault items"
  ON tech_vault_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own items
CREATE POLICY "Users can delete own tech vault items"
  ON tech_vault_items FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_tech_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tech_vault_items_updated_at
  BEFORE UPDATE ON tech_vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_tech_vault_updated_at();