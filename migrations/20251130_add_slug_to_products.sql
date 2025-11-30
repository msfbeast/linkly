-- Add slug column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add unique constraint to slug
ALTER TABLE products ADD CONSTRAINT products_slug_key UNIQUE (slug);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
