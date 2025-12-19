-- Add digital product fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_limit INTEGER;

-- Create storage bucket for digital products if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-products', 'digital-products', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for digital products
-- Allow users to upload to their own folder (user_id/*)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'digital-products' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Allow owner read access"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'digital-products' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Allow owner update access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'digital-products' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Allow owner delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'digital-products' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
