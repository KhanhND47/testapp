/*
  # Fix Acceptance Handovers RLS Policies

  1. Changes
    - Drop existing restrictive policies that require authenticated users
    - Create new policies allowing anon access to match other tables in the app

  2. Notes
    - The app uses anonymous Supabase access for most operations
    - This matches the pattern used by other tables (vehicle_repair_orders, quality_inspections, etc.)
*/

DROP POLICY IF EXISTS "Authenticated users can view acceptance handovers" ON acceptance_handovers;
DROP POLICY IF EXISTS "Authenticated users can create acceptance handovers" ON acceptance_handovers;
DROP POLICY IF EXISTS "Authenticated users can update acceptance handovers" ON acceptance_handovers;
DROP POLICY IF EXISTS "Authenticated users can delete acceptance handovers" ON acceptance_handovers;

CREATE POLICY "Allow select acceptance handovers"
  ON acceptance_handovers
  FOR SELECT
  TO anon, authenticated
  USING (order_id IS NOT NULL);

CREATE POLICY "Allow insert acceptance handovers"
  ON acceptance_handovers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (order_id IS NOT NULL);

CREATE POLICY "Allow update acceptance handovers"
  ON acceptance_handovers
  FOR UPDATE
  TO anon, authenticated
  USING (order_id IS NOT NULL)
  WITH CHECK (order_id IS NOT NULL);

CREATE POLICY "Allow delete acceptance handovers"
  ON acceptance_handovers
  FOR DELETE
  TO anon, authenticated
  USING (order_id IS NOT NULL);
