-- Add insurance and fee fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS insurance_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2);

-- Temporarily disable trigger to avoid conflicts
ALTER TABLE bookings DISABLE TRIGGER ALL;

-- Update existing records to set base_price equal to total_price
UPDATE bookings 
SET base_price = total_price 
WHERE base_price IS NULL;

-- Re-enable triggers
ALTER TABLE bookings ENABLE TRIGGER ALL;

-- Comment for database reference
COMMENT ON COLUMN bookings.base_price IS 'The base price the host receives, without insurance/platform fees';
COMMENT ON COLUMN bookings.insurance_type IS 'The type of insurance selected (full or third-party)';
COMMENT ON COLUMN bookings.insurance_amount IS 'The insurance fee amount added to the booking';
COMMENT ON COLUMN bookings.platform_fee IS 'The platform fee amount added to the booking';