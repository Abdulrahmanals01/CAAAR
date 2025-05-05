-- Drop the existing trigger
DROP TRIGGER IF EXISTS set_booking_price ON bookings;

-- Replace the function with one that respects existing total_price values
CREATE OR REPLACE FUNCTION calculate_booking_price()
RETURNS TRIGGER AS $$$
DECLARE
    days_count INTEGER;
    daily_price DECIMAL(10, 2);
BEGIN
    -- Booking should always have insurance and platform fee
    -- Just ensure the calculated values are correct
    
    -- Skip calculation if all price fields are already set from frontend
    IF NEW.total_price IS NOT NULL AND NEW.base_price IS NOT NULL 
       AND NEW.insurance_amount IS NOT NULL AND NEW.platform_fee IS NOT NULL THEN
        -- Verify the total_price is the sum of components
        IF NEW.total_price <> (NEW.base_price + NEW.insurance_amount + NEW.platform_fee) THEN
            -- Fix the total_price if it's incorrect
            NEW.total_price := NEW.base_price + NEW.insurance_amount + NEW.platform_fee;
        END IF;
        RETURN NEW;
    END IF;
    
    -- If not all price fields are set, calculate the base components
    -- Calculate number of days
    days_count := NEW.end_date - NEW.start_date + 1;
    
    -- Get the daily price from cars table
    SELECT price_per_day INTO daily_price FROM cars WHERE id = NEW.car_id;
    
    -- Set the base_price
    NEW.base_price := days_count * daily_price;
    
    -- Ensure total includes all fees (this should not typically be reached with the new implementation)
    IF NEW.insurance_amount IS NOT NULL AND NEW.platform_fee IS NOT NULL THEN
        NEW.total_price := NEW.base_price + NEW.insurance_amount + NEW.platform_fee;
    ELSIF NEW.total_price IS NULL THEN
        -- Fallback - but should not be reached if insurance is mandatory
        NEW.total_price := NEW.base_price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger
CREATE TRIGGER set_booking_price
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE PROCEDURE calculate_booking_price();