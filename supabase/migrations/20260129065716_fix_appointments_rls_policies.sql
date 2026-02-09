/*
  # Fix Appointments RLS Policies

  1. Changes
    - Drop existing policies that may be too restrictive
    - Create new policies that allow all operations for authenticated users
    - Also allow anonymous users to read/write for development purposes

  2. Security
    - Enables public access for appointments table during development
*/

DROP POLICY IF EXISTS "Authenticated users can read appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON appointments;

CREATE POLICY "Allow all read appointments"
  ON appointments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all insert appointments"
  ON appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all update appointments"
  ON appointments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all delete appointments"
  ON appointments
  FOR DELETE
  TO anon, authenticated
  USING (true);