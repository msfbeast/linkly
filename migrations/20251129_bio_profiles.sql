-- Create bio_profiles table
CREATE TABLE IF NOT EXISTS bio_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'vibrant',
  links JSONB DEFAULT '[]'::jsonb,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE bio_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own bio profiles" ON bio_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bio profiles" ON bio_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bio profiles" ON bio_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bio profiles" ON bio_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Public access for viewing bio profiles by handle (for the public page)
CREATE POLICY "Public can view bio profiles" ON bio_profiles
  FOR SELECT USING (true);
