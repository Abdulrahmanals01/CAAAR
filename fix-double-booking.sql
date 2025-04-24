-- Update the prevent_double_booking function to skip validation for completed bookings
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip validation for completed or canceled bookings
    IF NEW.status IN ('completed', 'canceled') THEN
        RETURN NEW;
    END IF;
    
    IF NOT is_car_available(NEW.car_id, NEW.start_date, NEW.end_date) THEN
        RAISE EXCEPTION 'Car is not available for the selected dates';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
