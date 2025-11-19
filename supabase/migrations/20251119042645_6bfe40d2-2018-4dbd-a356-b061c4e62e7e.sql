-- Drop smtp_settings table as it's no longer needed (using global Amazon SES instead)
DROP TABLE IF EXISTS smtp_settings CASCADE;