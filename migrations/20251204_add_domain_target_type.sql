-- Add target_type column to domains table
ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS target_type TEXT CHECK (target_type IN ('bio', 'store')) DEFAULT 'bio';

-- Comment on column
COMMENT ON COLUMN domains.target_type IS 'Determines whether the domain points to the Bio Page or Storefront';
