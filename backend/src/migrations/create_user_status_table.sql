-- Add status and admin fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'banned')),
ADD COLUMN IF NOT EXISTS freeze_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS freeze_reason TEXT;

-- Create warnings table for tracking deleted listings
CREATE TABLE IF NOT EXISTS listing_warnings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  car_id INTEGER,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT FALSE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_listing_warnings_user_id ON listing_warnings(user_id);
