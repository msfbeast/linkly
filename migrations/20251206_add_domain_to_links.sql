-- Add domain column to links table to store the preferred display domain
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS domain text;

-- Comment on column
COMMENT ON COLUMN links.domain IS 'The preferred custom domain for this link (e.g. links.trak.in, trak.in)';

-- Update RLS if needed (usually defaults are fine for new columns if policy is row-based)
