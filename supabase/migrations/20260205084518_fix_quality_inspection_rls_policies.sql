/*
  # Fix Quality Inspection RLS Policies

  This migration fixes the RLS policies for quality inspections to allow
  both authenticated and anonymous users to create and update inspections.

  ## Changes
  - Drop existing restrictive INSERT and UPDATE policies
  - Add new policies that allow anonymous users
  - This matches the pattern used throughout the app for other tables

  ## Security Note
  In a production environment, you may want to restrict these operations
  to authenticated users only. For now, we're following the pattern
  established in the rest of the application.
*/

-- Drop existing INSERT policies for quality_inspections
DROP POLICY IF EXISTS "Authenticated users can create inspections" ON quality_inspections;

-- Drop existing UPDATE policies for quality_inspections
DROP POLICY IF EXISTS "Authenticated users can update inspections" ON quality_inspections;

-- Drop existing INSERT policies for quality_inspection_items
DROP POLICY IF EXISTS "Authenticated users can create inspection items" ON quality_inspection_items;

-- Drop existing UPDATE policies for quality_inspection_items
DROP POLICY IF EXISTS "Authenticated users can update inspection items" ON quality_inspection_items;

-- Create new INSERT policy for quality_inspections (allow anonymous)
CREATE POLICY "Allow anonymous to create inspections"
  ON quality_inspections FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create new INSERT policy for quality_inspections (allow authenticated)
CREATE POLICY "Allow authenticated to create inspections"
  ON quality_inspections FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create new UPDATE policy for quality_inspections (allow anonymous)
CREATE POLICY "Allow anonymous to update inspections"
  ON quality_inspections FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create new UPDATE policy for quality_inspections (allow authenticated)
CREATE POLICY "Allow authenticated to update inspections"
  ON quality_inspections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new INSERT policy for quality_inspection_items (allow anonymous)
CREATE POLICY "Allow anonymous to create inspection items"
  ON quality_inspection_items FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create new INSERT policy for quality_inspection_items (allow authenticated)
CREATE POLICY "Allow authenticated to create inspection items"
  ON quality_inspection_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create new UPDATE policy for quality_inspection_items (allow anonymous)
CREATE POLICY "Allow anonymous to update inspection items"
  ON quality_inspection_items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create new UPDATE policy for quality_inspection_items (allow authenticated)
CREATE POLICY "Allow authenticated to update inspection items"
  ON quality_inspection_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);