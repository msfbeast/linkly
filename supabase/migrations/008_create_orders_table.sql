-- Create orders table for store purchases
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    customer_email TEXT,
    customer_name TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Sellers can view orders for their products
CREATE POLICY "Sellers can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

-- Anon users (customers) can insert orders (handled via API usually, but needed for public checkout flow initiation if direct)
-- Actually, strict checking usually happens via edge functions using Service Role.
-- But for client-side inserts (if any), we'd need this. 
-- However, we'll likely use the API to create the order to ensure price integrity. 
-- Let's just allow authenticated users (sellers) to read. Writes should probably go through the API/Service Role to prevent tampering.
