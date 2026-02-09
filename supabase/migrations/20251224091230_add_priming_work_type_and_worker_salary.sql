/*
  # Add Priming Work Type and Worker Salary

  1. Changes
    - Add 'priming' (Làm nền) to work_type check constraint
    - Add salary column to workers table with default value 10,000,000 VND
    - Update existing workers to have salary of 10,000,000 VND
  
  2. Security
    - No changes to existing RLS policies
*/

-- Add salary column to workers table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'salary'
  ) THEN
    ALTER TABLE workers ADD COLUMN salary DECIMAL(12,2) DEFAULT 10000000;
  END IF;
END $$;

-- Update existing workers to have salary
UPDATE workers SET salary = 10000000 WHERE salary IS NULL;

-- Drop the old check constraint on work_assignments.work_type
ALTER TABLE work_assignments DROP CONSTRAINT IF EXISTS work_assignments_work_type_check;

-- Add new check constraint that includes 'priming'
ALTER TABLE work_assignments ADD CONSTRAINT work_assignments_work_type_check 
  CHECK (work_type = ANY (ARRAY['body_work'::text, 'painting'::text, 'paint_stripping'::text, 'priming'::text, 'disassembly'::text, 'polishing'::text, 'assembly'::text]));
