-- Table for tracking deleted listings
CREATE TABLE IF NOT EXISTS deleted_listings (
    id SERIAL PRIMARY KEY,
    original_id INTEGER NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    plate VARCHAR(20) NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    owner_id INTEGER NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    owner_email VARCHAR(100) NOT NULL,
    deleted_by INTEGER NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- Table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    admin_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('freeze', 'unfreeze', 'ban', 'unban', 'delete_listing')),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'listing')),
    target_id INTEGER NOT NULL,
    target_name VARCHAR(100) NOT NULL,
    reason TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_deleted_listings_owner_id ON deleted_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_deleted_listings_deleted_by ON deleted_listings(deleted_by);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
