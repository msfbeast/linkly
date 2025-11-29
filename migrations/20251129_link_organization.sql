-- Migration: Link Organization System
-- Date: 2025-11-29
-- Description: Adds tags and folders tables for better link organization.

-- 1. Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 2. Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, parent_id)
);

-- 3. Add folder_id to links table
-- Note: We assume the 'links' table exists. If it's named differently (e.g., 'short_links'), adjust accordingly.
ALTER TABLE links ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- 4. Create link_tags junction table (Optional, if moving away from array column)
-- For now, we might keep using the array column for simplicity or migrate.
-- Let's create it to support the new normalized approach.
CREATE TABLE IF NOT EXISTS link_tags (
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;

-- 6. Create policies
-- Tags
CREATE POLICY "Users can view their own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

-- Folders
CREATE POLICY "Users can view their own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- Link Tags
CREATE POLICY "Users can view their own link tags" ON link_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM links WHERE links.id = link_tags.link_id AND links.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own link tags" ON link_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM links WHERE links.id = link_tags.link_id AND links.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own link tags" ON link_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM links WHERE links.id = link_tags.link_id AND links.user_id = auth.uid())
);
