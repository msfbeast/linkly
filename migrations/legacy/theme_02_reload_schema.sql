-- Reload Supabase Schema Cache
-- Run this if you see "Could not find column in schema cache" errors
NOTIFY pgrst, 'reload config';
