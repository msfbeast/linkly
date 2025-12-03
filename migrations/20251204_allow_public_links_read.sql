-- Allow public read access to links table for redirection
-- This is required for the Redirect page to fetch link details without being logged in

-- Check if policy exists before creating to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'links' 
        AND policyname = 'Public links are viewable by everyone'
    ) THEN
        CREATE POLICY "Public links are viewable by everyone" 
        ON links FOR SELECT 
        USING (true);
    END IF;
END
$$;
