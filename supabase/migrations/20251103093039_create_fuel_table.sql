CREATE TABLE IF NOT EXISTS fuel_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    percentage NUMERIC(5,2) not null
);