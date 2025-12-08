
-- Migration: Add Bento Grid columns to links table
-- Date: 2025-12-08

-- 1. Add 'type' column with default 'link' (Enum equivalent but keeping it text for flexibility)
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'link';

-- 2. Add 'layout_config' for Grid Size (JSONB)
-- Default is 1x1: {"w": 1, "h": 1}
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT '{"w": 1, "h": 1}';

-- 3. Add 'metadata' for Widget-specific data (JSONB)
-- e.g. Spotify URI, Map Coordinates, YouTube ID
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Add index on type for faster filtering if needed
CREATE INDEX IF NOT EXISTS idx_links_type ON public.links(type);

-- Comment
COMMENT ON COLUMN public.links.type IS 'Type of block: link, music, map, video, social_feed';
COMMENT ON COLUMN public.links.layout_config IS 'Grid dimensions (w, h) for Bento layout';
COMMENT ON COLUMN public.links.metadata IS 'Widget-specific configuration data';
