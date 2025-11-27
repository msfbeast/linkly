-- Migration: Enable Realtime for click_events and links tables
-- Run this in your Supabase SQL Editor

-- Enable realtime for click_events table
ALTER PUBLICATION supabase_realtime ADD TABLE click_events;

-- Enable realtime for links table  
ALTER PUBLICATION supabase_realtime ADD TABLE links;

-- Note: If you get an error that the table is already in the publication,
-- that's fine - it means realtime is already enabled for that table.
