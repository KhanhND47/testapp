/*
  # Add Paint Stripping Work Type

  ## Overview
  This migration adds "paint_stripping" (Lột sơn) as a new work type option.

  ## Changes
  1. Modifications to work_assignments table
     - Update the CHECK constraint on `work_type` column to include 'paint_stripping'
     - Existing values: 'body_work', 'painting'
     - New value: 'paint_stripping' (Lột sơn - paint stripping work)

  ## Notes
  - Work types now include:
    - 'body_work' (Gò hàn - body work)
    - 'painting' (Sơn - painting)
    - 'paint_stripping' (Lột sơn - paint stripping)
*/

-- Drop the existing CHECK constraint on work_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'work_assignments' 
    AND constraint_name LIKE '%work_type%'
  ) THEN
    ALTER TABLE work_assignments DROP CONSTRAINT IF EXISTS work_assignments_work_type_check;
  END IF;
END $$;

-- Add new CHECK constraint with paint_stripping included
ALTER TABLE work_assignments 
ADD CONSTRAINT work_assignments_work_type_check 
CHECK (work_type IN ('body_work', 'painting', 'paint_stripping'));