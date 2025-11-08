CREATE TABLE public.temperature_data(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP NOT NULL,
    temperature NUMERIC(5,2),
    humidity NUMERIC(5,2)
);