/*
  # Add Appointment Repair Items Table

  1. New Tables
    - `appointment_repair_items`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, foreign key to appointments)
      - `name` (text) - Ten hang muc sua chua
      - `description` (text, optional) - Mo ta chi tiet
      - `estimated_price` (numeric, optional) - Gia du kien
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `appointment_repair_items` table
    - Add policies for anon and authenticated users
*/

CREATE TABLE IF NOT EXISTS appointment_repair_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  estimated_price numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointment_repair_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read appointment_repair_items"
  ON appointment_repair_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all insert appointment_repair_items"
  ON appointment_repair_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all update appointment_repair_items"
  ON appointment_repair_items
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all delete appointment_repair_items"
  ON appointment_repair_items
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_appointment_repair_items_appointment_id ON appointment_repair_items(appointment_id);