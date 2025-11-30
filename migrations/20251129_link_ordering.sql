-- Add order_index to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
