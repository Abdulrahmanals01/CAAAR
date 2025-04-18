-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password
    role VARCHAR(20) NOT NULL CHECK (role IN ('host', 'renter', 'admin')),
    phone VARCHAR(20) NOT NULL,
    id_number VARCHAR(20) UNIQUE NOT NULL,
    license_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Cars Table
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    plate VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(30) NOT NULL,
    mileage INTEGER NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    location VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    availability_start DATE NOT NULL,
    availability_end DATE NOT NULL,
    image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'maintenance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (availability_end >= availability_start)
);

-- Create index on frequently queried fields
CREATE INDEX idx_cars_user_id ON cars(user_id);
CREATE INDEX idx_cars_location ON cars(location);
CREATE INDEX idx_cars_price ON cars(price_per_day);
CREATE INDEX idx_cars_availability ON cars(availability_start, availability_end);
CREATE INDEX idx_cars_status ON cars(status);

-- Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    renter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_booking_dates CHECK (end_date >= start_date)
);

-- Create index on frequently queried fields
CREATE INDEX idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX idx_bookings_car_id ON bookings(car_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Ratings Table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    rating_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating_for INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on frequently queried fields
CREATE INDEX idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX idx_ratings_rating_for ON ratings(rating_for);
CREATE INDEX idx_ratings_car_id ON ratings(car_id);

-- Chat Messages Table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on frequently queried fields
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_booking_id ON messages(booking_id);
CREATE INDEX idx_messages_read ON messages(read);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_cars_timestamp
BEFORE UPDATE ON cars
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_bookings_timestamp
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Function to check if a car is available for booking
CREATE OR REPLACE FUNCTION is_car_available(car_id INT, start_date DATE, end_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    is_available BOOLEAN;
BEGIN
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

-- Trigger to prevent double booking
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_car_available(NEW.car_id, NEW.start_date, NEW.end_date) THEN
        RAISE EXCEPTION 'Car is not available for the selected dates';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_booking_availability
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW EXECUTE PROCEDURE prevent_double_booking();

-- Function to calculate total price when making a booking
CREATE OR REPLACE FUNCTION calculate_booking_price()
RETURNS TRIGGER AS $$
DECLARE
    days_count INTEGER;
    daily_price DECIMAL(10, 2);
BEGIN
    -- Calculate number of days
    days_count := NEW.end_date - NEW.start_date + 1;
    
    -- Get the daily price from cars table
    SELECT price_per_day INTO daily_price FROM cars WHERE id = NEW.car_id;
    
    -- Set the total price
    NEW.total_price := days_count * daily_price;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_price
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE PROCEDURE calculate_booking_price();
