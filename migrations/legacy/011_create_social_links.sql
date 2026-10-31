-- ============================================
-- LINKLY AI DATABASE FIX - Run in Supabase SQL Editor
-- ============================================

-- 1. CREATE INCREMENT BIO VIEW FUNCTION
CREATE OR REPLACE FUNCTION increment_bio_view(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE bio_profiles
    SET views = COALESCE(views, 0) + 1
    WHERE id = profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_bio_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_bio_view(UUID) TO anon;

-- 2. CREATE PRODUCTS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    link_id UUID REFERENCES public.links(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE RLS ON PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. PRODUCT POLICIES
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow users to manage their own products" ON public.products;

CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow users to manage their own products" ON public.products
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products(user_id);

-- 5. ADD DIGITAL PRODUCT COLUMNS
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_limit INTEGER,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 6. ENSURE VIEWS COLUMN ON BIO_PROFILES
ALTER TABLE public.bio_profiles 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Done! ✅
SELECT 'Database fix applied successfully!' as status;
