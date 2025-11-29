-- Add start_date column to links table
ALTER TABLE links 
ADD COLUMN start_date BIGINT;

-- Add comment explaining usage
COMMENT ON COLUMN links.start_date IS 'Timestamp (ms) when the link becomes active. If null, active immediately.';
