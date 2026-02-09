/*
  # Customer Reception Schema

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text) - Customer name
      - `phone` (text) - Phone number
      - `company_name` (text, nullable) - Company name
      - `tax_id` (text, nullable) - Tax ID (MST)
      - `address` (text, nullable) - Address
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `vehicles`
      - `id` (uuid, primary key)
      - `name` (text) - Vehicle name/model
      - `model_year` (text, nullable) - Model year
      - `license_plate` (text) - License plate number
      - `vin` (text, nullable) - VIN number
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `customer_vehicles`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `vehicle_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - Junction table: one customer can have many vehicles, one vehicle can belong to many customers

    - `service_requests`
      - `id` (uuid, primary key)
      - `request_number` (text) - Request number for display
      - `customer_id` (uuid, foreign key)
      - `vehicle_id` (uuid, foreign key)
      - `odometer` (integer, nullable) - Odo reading
      - `fuel_level` (integer, nullable) - Fuel level percentage
      - `reception_date` (date) - Reception date
      - `status` (text) - pending, in_progress, completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `request_conditions`
      - `id` (uuid, primary key)
      - `service_request_id` (uuid, foreign key)
      - `description` (text) - Condition/request description
      - `order_index` (integer) - Order for display
      - `created_at` (timestamptz)

    - `request_suggested_services`
      - `id` (uuid, primary key)
      - `service_request_id` (uuid, foreign key)
      - `description` (text) - Suggested service description
      - `order_index` (integer) - Order for display
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  company_name text,
  tax_id text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model_year text,
  license_plate text NOT NULL,
  vin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_vehicles junction table
CREATE TABLE IF NOT EXISTS customer_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, vehicle_id)
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  odometer integer,
  fuel_level integer CHECK (fuel_level >= 0 AND fuel_level <= 100),
  reception_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create request_conditions table
CREATE TABLE IF NOT EXISTS request_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  description text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create request_suggested_services table
CREATE TABLE IF NOT EXISTS request_suggested_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  description text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_vehicles_customer ON customer_vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_vehicles_vehicle ON customer_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_vehicle ON service_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_conditions_request ON request_conditions(service_request_id);
CREATE INDEX IF NOT EXISTS idx_request_suggested_services_request ON request_suggested_services(service_request_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_suggested_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Allow anonymous select on customers"
  ON customers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on customers"
  ON customers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on customers"
  ON customers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on customers"
  ON customers FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for vehicles
CREATE POLICY "Allow anonymous select on vehicles"
  ON vehicles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on vehicles"
  ON vehicles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on vehicles"
  ON vehicles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on vehicles"
  ON vehicles FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for customer_vehicles
CREATE POLICY "Allow anonymous select on customer_vehicles"
  ON customer_vehicles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on customer_vehicles"
  ON customer_vehicles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on customer_vehicles"
  ON customer_vehicles FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for service_requests
CREATE POLICY "Allow anonymous select on service_requests"
  ON service_requests FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on service_requests"
  ON service_requests FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on service_requests"
  ON service_requests FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on service_requests"
  ON service_requests FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for request_conditions
CREATE POLICY "Allow anonymous select on request_conditions"
  ON request_conditions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on request_conditions"
  ON request_conditions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on request_conditions"
  ON request_conditions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on request_conditions"
  ON request_conditions FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for request_suggested_services
CREATE POLICY "Allow anonymous select on request_suggested_services"
  ON request_suggested_services FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on request_suggested_services"
  ON request_suggested_services FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on request_suggested_services"
  ON request_suggested_services FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on request_suggested_services"
  ON request_suggested_services FOR DELETE
  TO anon
  USING (true);

-- Function to generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS text AS $$
DECLARE
  today_count integer;
  new_number text;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM service_requests
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_number := 'YC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
