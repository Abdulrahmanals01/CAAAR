-- Add car_type and features columns to cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS car_type VARCHAR(50);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Create index on features for faster searches
CREATE INDEX IF NOT EXISTS idx_cars_features ON cars USING GIN(features);
CREATE INDEX IF NOT EXISTS idx_cars_car_type ON cars(car_type);
