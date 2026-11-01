-- Storage: own-folder writes only, images only on public buckets, no
-- public listing.
--
-- Before:
-- * avatars accepted uploads from any signed-in user at any path, so
--   anyone could write into other users' folders;
-- * the public buckets had no type or size limit, so any account could
--   host arbitrary files (HTML, SVG with script, executables) under the
--   project's public storage URLs;
-- * public SELECT policies let anyone list every file in avatars,
--   app-icons and gallery-images (public URLs don't need them);
-- * UPDATE policies had no WITH CHECK, so a file could be moved into
--   another user's folder.
--
-- The app uploads every file to <user id>/..., and every stored object is
-- already in its owner's folder and an image, so nothing existing breaks.
-- Public URLs keep working: public buckets serve objects without RLS.
-- Safe to re-run.

-- 1. Bucket limits ----------------------------------------------------------
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    file_size_limit = 10485760          -- 10 MB; largest file today is ~5 MB
WHERE id IN ('avatars', 'app-icons', 'gallery-images');

UPDATE storage.buckets
SET file_size_limit = 52428800          -- 50 MB per digital product file
WHERE id = 'digital-products';

-- 2. Policies ---------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "App icons are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload app icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their app icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their app icons" ON storage.objects;
DROP POLICY IF EXISTS "Gallery images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update access" ON storage.objects;

DROP POLICY IF EXISTS "Public images: owners read own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public images: owners upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public images: owners update own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public images: owners delete own folder" ON storage.objects;
DROP POLICY IF EXISTS "Digital products: owners update own folder" ON storage.objects;

-- Owners can read (needed for upsert) and manage files in their own folder.
CREATE POLICY "Public images: owners read own folder" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id IN ('avatars', 'app-icons', 'gallery-images')
           AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public images: owners upload to own folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('avatars', 'app-icons', 'gallery-images')
                AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public images: owners update own folder" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id IN ('avatars', 'app-icons', 'gallery-images')
           AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id IN ('avatars', 'app-icons', 'gallery-images')
                AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public images: owners delete own folder" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id IN ('avatars', 'app-icons', 'gallery-images')
           AND (storage.foldername(name))[1] = auth.uid()::text);

-- digital-products keeps its owner-folder read/insert/delete policies; its
-- update policy gains the missing WITH CHECK.
CREATE POLICY "Digital products: owners update own folder" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'digital-products' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'digital-products' AND (storage.foldername(name))[1] = auth.uid()::text);
