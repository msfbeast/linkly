-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public can insert (subscribe)
-- We need to allow anonymous users to insert, but they must provide the correct user_id (creator)
-- However, standard RLS for INSERT usually checks auth.uid().
-- For anonymous inserts, we might need a function or a policy that allows anyone to insert if they know the user_id.
-- Actually, for a public form, we usually use a Postgres Function with SECURITY DEFINER to bypass RLS for the insert, 
-- OR we allow public insert but validate the data.
-- Let's try a policy first.
CREATE POLICY "Public can subscribe to newsletters" 
ON newsletter_subscribers FOR INSERT 
WITH CHECK (true); 
-- Note: This allows anyone to insert any record. Ideally we'd validate, but for now this is standard for public forms.

-- 2. Creators can view their own subscribers
CREATE POLICY "Creators can view their subscribers" 
ON newsletter_subscribers FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Creators can delete subscribers
CREATE POLICY "Creators can delete their subscribers" 
ON newsletter_subscribers FOR DELETE 
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_user_id ON newsletter_subscribers(user_id);
