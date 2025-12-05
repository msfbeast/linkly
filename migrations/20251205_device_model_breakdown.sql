-- Device Model Breakdown SQL Function
-- Run this in Supabase SQL Editor

-- Add device_model column if it doesn't exist
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS device_model TEXT;

-- Create function to get device model breakdown
CREATE OR REPLACE FUNCTION get_user_device_model_breakdown(p_user_id UUID)
RETURNS TABLE (
    device_model TEXT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            CASE 
                -- iPhone detection
                WHEN ce.raw_user_agent ILIKE '%iPhone%' THEN
                    CASE
                        WHEN ce.raw_user_agent ~ 'iPhone17,[1-4]' THEN 'iPhone 15 Series'
                        WHEN ce.raw_user_agent ~ 'iPhone16,[1-2]' OR ce.raw_user_agent ~ 'iPhone15,[2-5]' THEN 'iPhone 14 Series'
                        WHEN ce.raw_user_agent ~ 'iPhone14,[2-5]' THEN 'iPhone 13 Series'
                        WHEN ce.raw_user_agent ~ 'iPhone13,[1-4]' THEN 'iPhone 12 Series'
                        WHEN ce.raw_user_agent ~ 'iPhone12,[1-8]' THEN 'iPhone 11 Series'
                        ELSE 'iPhone (Other)'
                    END
                -- iPad
                WHEN ce.raw_user_agent ILIKE '%iPad%' THEN 'iPad'
                -- Samsung S series
                WHEN ce.raw_user_agent ~ 'SM-S9[12][0-9]' THEN 'Galaxy S24 Series'
                WHEN ce.raw_user_agent ~ 'SM-S91[0-9]' THEN 'Galaxy S23 Series'
                WHEN ce.raw_user_agent ~ 'SM-S90[0-9]' THEN 'Galaxy S22 Series'
                -- Samsung A series
                WHEN ce.raw_user_agent ~ 'SM-A5[0-9]' THEN 'Galaxy A50/A55 Series'
                WHEN ce.raw_user_agent ~ 'SM-A3[0-9]' THEN 'Galaxy A30 Series'
                WHEN ce.raw_user_agent ~ 'SM-A1[0-9]' THEN 'Galaxy A10 Series'
                WHEN ce.raw_user_agent ILIKE '%SM-%' THEN 'Samsung (Other)'
                -- OnePlus
                WHEN ce.raw_user_agent ILIKE '%OnePlus%' THEN 'OnePlus'
                -- Xiaomi/Redmi
                WHEN ce.raw_user_agent ILIKE '%Redmi%' THEN 'Redmi'
                WHEN ce.raw_user_agent ILIKE '%Xiaomi%' THEN 'Xiaomi'
                -- Pixel
                WHEN ce.raw_user_agent ILIKE '%Pixel%' THEN 'Google Pixel'
                -- Desktop
                WHEN ce.raw_user_agent ILIKE '%Windows NT%' THEN 'Windows PC'
                WHEN ce.raw_user_agent ILIKE '%Macintosh%' THEN 'Mac'
                WHEN ce.raw_user_agent ILIKE '%Linux%' AND ce.raw_user_agent NOT ILIKE '%Android%' THEN 'Linux PC'
                -- Generic Android
                WHEN ce.raw_user_agent ILIKE '%Android%' THEN 'Android (Other)'
                ELSE 'Unknown'
            END,
            'Unknown'
        ) as device_model,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY 
        CASE 
            WHEN ce.raw_user_agent ILIKE '%iPhone%' THEN
                CASE
                    WHEN ce.raw_user_agent ~ 'iPhone17,[1-4]' THEN 'iPhone 15 Series'
                    WHEN ce.raw_user_agent ~ 'iPhone16,[1-2]' OR ce.raw_user_agent ~ 'iPhone15,[2-5]' THEN 'iPhone 14 Series'
                    WHEN ce.raw_user_agent ~ 'iPhone14,[2-5]' THEN 'iPhone 13 Series'
                    WHEN ce.raw_user_agent ~ 'iPhone13,[1-4]' THEN 'iPhone 12 Series'
                    WHEN ce.raw_user_agent ~ 'iPhone12,[1-8]' THEN 'iPhone 11 Series'
                    ELSE 'iPhone (Other)'
                END
            WHEN ce.raw_user_agent ILIKE '%iPad%' THEN 'iPad'
            WHEN ce.raw_user_agent ~ 'SM-S9[12][0-9]' THEN 'Galaxy S24 Series'
            WHEN ce.raw_user_agent ~ 'SM-S91[0-9]' THEN 'Galaxy S23 Series'
            WHEN ce.raw_user_agent ~ 'SM-S90[0-9]' THEN 'Galaxy S22 Series'
            WHEN ce.raw_user_agent ~ 'SM-A5[0-9]' THEN 'Galaxy A50/A55 Series'
            WHEN ce.raw_user_agent ~ 'SM-A3[0-9]' THEN 'Galaxy A30 Series'
            WHEN ce.raw_user_agent ~ 'SM-A1[0-9]' THEN 'Galaxy A10 Series'
            WHEN ce.raw_user_agent ILIKE '%SM-%' THEN 'Samsung (Other)'
            WHEN ce.raw_user_agent ILIKE '%OnePlus%' THEN 'OnePlus'
            WHEN ce.raw_user_agent ILIKE '%Redmi%' THEN 'Redmi'
            WHEN ce.raw_user_agent ILIKE '%Xiaomi%' THEN 'Xiaomi'
            WHEN ce.raw_user_agent ILIKE '%Pixel%' THEN 'Google Pixel'
            WHEN ce.raw_user_agent ILIKE '%Windows NT%' THEN 'Windows PC'
            WHEN ce.raw_user_agent ILIKE '%Macintosh%' THEN 'Mac'
            WHEN ce.raw_user_agent ILIKE '%Linux%' AND ce.raw_user_agent NOT ILIKE '%Android%' THEN 'Linux PC'
            WHEN ce.raw_user_agent ILIKE '%Android%' THEN 'Android (Other)'
            ELSE 'Unknown'
        END
    ORDER BY click_count DESC
    LIMIT 15;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_device_model_breakdown(UUID) TO authenticated;
