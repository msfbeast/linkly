-- Create products table
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

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for Storefront)
CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT USING (true);

-- Policy: Allow users to manage their own products
CREATE POLICY "Allow users to manage their own products" ON public.products
    FOR ALL USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products(user_id);
