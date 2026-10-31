-- Migration: Enable Row Level Security policies
-- Requirements: 5.2, 5.3, 5.4 - Data isolation for user ownership

-- ============================================
-- Links Table RLS Policies
-- ============================================

-- Enable RLS on links table
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own links
-- Validates: Requirements 5.2 - Return only links owned by that user
CREATE POLICY "Users can view own links" ON links
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own links
-- Validates: Requirements 5.1 - Associate link with user's ID
CREATE POLICY "Users can insert own links" ON links
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own links
-- Validates: Requirements 5.4 - Reject modification of another user's link
CREATE POLICY "Users can update own links" ON links
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Users can only delete their own links
-- Validates: Requirements 5.4 - Reject modification of another user's link
CREATE POLICY "Users can delete own links" ON links
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Click Events Table RLS Policies
-- ============================================

-- Enable RLS on click_events table
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view click events for their own links only
-- This uses a subquery to check link ownership
CREATE POLICY "Users can view own click events" ON click_events
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM links 
      WHERE links.id = click_events.link_id 
      AND links.user_id = auth.uid()
    )
  );

-- Policy: Anyone can insert click events (for public link tracking)
-- Click events are recorded when anyone clicks a shortened link
CREATE POLICY "Anyone can insert click events" ON click_events
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Users can delete click events for their own links
-- Allows users to clear analytics data for their links
CREATE POLICY "Users can delete own click events" ON click_events
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM links 
      WHERE links.id = click_events.link_id 
      AND links.user_id = auth.uid()
    )
  );
