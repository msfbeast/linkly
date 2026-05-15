-- Migration: 018_add_store_description_button.sql
-- Description: Adds store_description and store_button_text to the profiles table to allow fully custom storefronts.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS store_description TEXT,
ADD COLUMN IF NOT EXISTS store_button_text TEXT;

-- Update the Realtime publication if necessary (usually not needed if table is already published, but good to note)
