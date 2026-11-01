-- Create the two image buckets the app uploads to but that never existed.
--
-- Product images (Add Product, Product Manager) upload to 'product-images'
-- and Tech Vault item images to 'tech-vault'. Neither bucket exists, so
-- those uploads have always failed with "Bucket not found".
--
-- Both are public image buckets like avatars, app-icons and gallery-images:
-- the images show on storefronts and bio pages through public URLs. They get
-- the same limits (images only, 10 MB) and the same owner-folder policies;
-- the app already uploads to <user id>/... in both.
--
-- Additive, no app change needed. Safe to re-run.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('product-images', 'product-images', true, 10485760,
     ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']),
    ('tech-vault', 'tech-vault', true, 10485760,
     ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The owner-folder policies from 20261101_storage_hardening.sql, now
-- covering the two new buckets as well.
DROP POLICY IF EXISTS "Public images: owners read own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public images: owners upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public images: owners update own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public images: owners delete own folder" ON storage.objects;

CREATE POLICY "Public images: owners read own folder" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id IN ('avatars', 'app-icons', 'gallery-images', 'product-images', 'tech-vault')
           AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public images: owners upload to own folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('avatars', 'app-icons', 'gallery-images', 'product-images', 'tech-vault')
                AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public images: owners update own folder" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id IN ('avatars', 'app-icons', 'gallery-images', 'product-images', 'tech-vault')
           AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id IN ('avatars', 'app-icons', 'gallery-images', 'product-images', 'tech-vault')
                AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public images: owners delete own folder" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id IN ('avatars', 'app-icons', 'gallery-images', 'product-images', 'tech-vault')
           AND (storage.foldername(name))[1] = auth.uid()::text);
