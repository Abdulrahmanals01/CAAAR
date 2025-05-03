-- Add user profile fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS date_of_birth DATE;
