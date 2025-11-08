CREATE TABLE IF NOT EXISTS rainfall_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    mm NUMERIC(6,2) not null
);