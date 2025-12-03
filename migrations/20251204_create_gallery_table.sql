-- Create gallery_items table
CREATE TABLE IF NOT EXISTS gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    exif_data JSONB DEFAULT '{}'::jsonb,
    width INTEGER,
    height INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public gallery items are viewable by everyone" 
ON gallery_items FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own gallery items" 
ON gallery_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery items" 
ON gallery_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items" 
ON gallery_items FOR DELETE 
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_items_user_id ON gallery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_sort_order ON gallery_items(sort_order);

-- Storage Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gallery-images' );

CREATE POLICY "Users can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'gallery-images' AND
    auth.uid() = owner
);

CREATE POLICY "Users can delete their own gallery images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'gallery-images' AND
    auth.uid() = owner
);
