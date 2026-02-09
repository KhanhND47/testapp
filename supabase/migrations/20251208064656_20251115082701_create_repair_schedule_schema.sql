/*
  # Create Repair Schedule Management Schema

  ## Overview
  This migration creates the database structure for managing vehicle repair orders and worker schedules.

  ## New Tables
  
  ### 1. `repair_orders`
  Stores information about vehicle repair orders
  - `id` (uuid, primary key) - Unique identifier
  - `license_plate` (text) - Vehicle license plate number
  - `service_type` (text) - Type of service: "full_paint", "color_change", "spot_paint"
  - `receive_date` (date) - Date when vehicle is received
  - `receive_period` (text) - Period: "morning" or "afternoon"
  - `return_date` (date) - Date when vehicle should be returned
  - `return_period` (text) - Period: "morning" or "afternoon"
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `workers`
  Stores worker information
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Worker name
  - `specialization` (text) - Worker specialization: "body_work" or "painting"
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `work_assignments`
  Stores work assignments linking repair orders to workers with time periods
  - `id` (uuid, primary key) - Unique identifier
  - `repair_order_id` (uuid, foreign key) - References repair_orders
  - `worker_id` (uuid, foreign key) - References workers
  - `work_type` (text) - Type of work: "body_work" or "painting"
  - `start_date` (date) - Work start date
  - `start_period` (text) - Start period: "morning" or "afternoon"
  - `end_date` (date) - Work end date
  - `end_period` (text) - End period: "morning" or "afternoon"
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies allowing public access (authenticated users can read/write)
  
  ## Notes
  - Service types: "full_paint" (Sơn nguyên xe), "color_change" (Sơn đổi màu), "spot_paint" (Sơn món)
  - Work types: "body_work" (Gò hàn - Yellow color), "painting" (Sơn - Blue color)
  - Periods: "morning" (Sáng), "afternoon" (Chiều)
*/

-- Create repair_orders table
CREATE TABLE IF NOT EXISTS repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('full_paint', 'color_change', 'spot_paint')),
  receive_date date NOT NULL,
  receive_period text NOT NULL CHECK (receive_period IN ('morning', 'afternoon')),
  return_date date NOT NULL,
  return_period text NOT NULL CHECK (return_period IN ('morning', 'afternoon')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialization text NOT NULL CHECK (specialization IN ('body_work', 'painting')),
  created_at timestamptz DEFAULT now()
);

-- Create work_assignments table
CREATE TABLE IF NOT EXISTS work_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  work_type text NOT NULL CHECK (work_type IN ('body_work', 'painting')),
  start_date date NOT NULL,
  start_period text NOT NULL CHECK (start_period IN ('morning', 'afternoon')),
  end_date date NOT NULL,
  end_period text NOT NULL CHECK (end_period IN ('morning', 'afternoon')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for repair_orders
CREATE POLICY "Allow public read access to repair orders"
  ON repair_orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to repair orders"
  ON repair_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to repair orders"
  ON repair_orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to repair orders"
  ON repair_orders FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create policies for workers
CREATE POLICY "Allow public read access to workers"
  ON workers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to workers"
  ON workers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to workers"
  ON workers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to workers"
  ON workers FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create policies for work_assignments
CREATE POLICY "Allow public read access to work assignments"
  ON work_assignments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to work assignments"
  ON work_assignments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to work assignments"
  ON work_assignments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to work assignments"
  ON work_assignments FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_repair_orders_dates ON repair_orders(receive_date, return_date);
CREATE INDEX IF NOT EXISTS idx_work_assignments_repair_order ON work_assignments(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_worker ON work_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_dates ON work_assignments(start_date, end_date);

-- Insert sample workers
INSERT INTO workers (name, specialization) VALUES
  ('Thợ A - Gò hàn', 'body_work'),
  ('Thợ B - Sơn', 'painting'),
  ('Thợ C - Gò hàn', 'body_work'),
  ('Thợ D - Sơn', 'painting')
ON CONFLICT DO NOTHING;