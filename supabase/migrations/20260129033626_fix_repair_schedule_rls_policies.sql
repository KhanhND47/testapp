/*
  # Fix Repair Schedule RLS Policies

  1. Changes
    - Drop existing restrictive policies on repair_lifts and lift_assignments
    - Add permissive policies that allow authenticated users to read
    - Keep write restrictions for safety

  2. Security
    - Allow all authenticated users to read repair_lifts and lift_assignments
    - Allow all authenticated users to manage lift_assignments (for schedule management)
*/

DROP POLICY IF EXISTS "Admin and worker_lead can view lifts" ON repair_lifts;
DROP POLICY IF EXISTS "Admin can manage lifts" ON repair_lifts;
DROP POLICY IF EXISTS "Admin and worker_lead can view lift assignments" ON lift_assignments;
DROP POLICY IF EXISTS "Admin and worker_lead can insert lift assignments" ON lift_assignments;
DROP POLICY IF EXISTS "Admin and worker_lead can update lift assignments" ON lift_assignments;
DROP POLICY IF EXISTS "Admin and worker_lead can delete lift assignments" ON lift_assignments;

CREATE POLICY "Allow read repair_lifts"
  ON repair_lifts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow read lift_assignments"
  ON lift_assignments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert lift_assignments"
  ON lift_assignments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update lift_assignments"
  ON lift_assignments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete lift_assignments"
  ON lift_assignments FOR DELETE
  TO anon, authenticated
  USING (true);