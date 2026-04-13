-- Create the Fordham SwipeShare database
CREATE DATABASE fordham_swipeshare;

-- Create a dedicated user (optional)
CREATE USER swipeshare_admin WITH PASSWORD 'swipeshare123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fordham_swipeshare TO swipeshare_admin;

-- Connect to the database
\c fordham_swipeshare

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO swipeshare_admin;

-- Display success message
SELECT 'Database fordham_swipeshare created successfully!' AS status;
