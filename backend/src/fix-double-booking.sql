-- Drop the old trigger function and recreate with improved logic
DROP TRIGGER IF EXISTS check_booking_availability ON bookings;
DROP FUNCTION IF EXISTS prevent_double_booking();

-- Create improved function to check if a car is available for booking
CREATE OR REPLACE FUNCTION is_car_available(car_id INT, start_date DATE, end_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    car_exists BOOLEAN;
    car_status TEXT;
    car_avail_start DATE;
    car_avail_end DATE;
    is_available BOOLEAN;
BEGIN
    -- Check if car exists and get its availability period
    SELECT EXISTS(
        SELECT 1 FROM cars WHERE id = car_id
    ) INTO car_exists;
    
    IF NOT car_exists THEN
        RAISE EXCEPTION 'Car with ID % does not exist', car_id;
    END IF;
    
    -- Get car status and availability period
    SELECT status, availability_start, availability_end 
    INTO car_status, car_avail_start, car_avail_end 
    FROM cars 
    WHERE id = car_id;
    
    -- Check if car is available
    IF car_status != 'available' THEN
        RAISE EXCEPTION 'Car is currently %', car_status;
    END IF;
    
    -- Check if requested dates are within car's availability window
    IF start_date < car_avail_start OR end_date > car_avail_end THEN
        RAISE EXCEPTION 'Booking dates must be within car availability period (% to %)', 
            car_avail_start, car_avail_end;
    END IF;
    
    -- Check for overlapping bookings
    SELECT NOT EXISTS(
        SELECT 1 FROM bookings
        WHERE bookings.car_id = $1
        AND bookings.status IN ('accepted', 'pending')
        AND (
            (bookings.start_date <= $3 AND bookings.end_date >= $2) -- Overlap check
        )
    ) INTO is_available;

    RETURN is_available;
END;
$$ LANGUAGE plpgsql;

-- Improved trigger function to prevent double booking
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip check for bookings being updated to rejected, canceled, or completed status
    IF TG_OP = 'UPDATE' AND NEW.status IN ('rejected', 'canceled', 'completed') THEN
        RETURN NEW;
    END IF;
    
    -- For new bookings or bookings with date changes, check availability
    IF NOT is_car_available(NEW.car_id, NEW.start_date, NEW.end_date) THEN
        RAISE EXCEPTION 'Car is not available for the selected dates';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER check_booking_availability
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW EXECUTE PROCEDURE prevent_double_booking();
