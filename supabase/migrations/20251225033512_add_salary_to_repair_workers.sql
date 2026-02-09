/*
  # Add Salary Column to Repair Workers

  1. Changes
    - Add `salary` column (decimal) to repair_workers table
    - Default salary is 10,000,000 VND

  2. Notes
    - This salary represents the monthly fixed salary for each worker
    - Used to calculate salary ratio vs total revenue in overview dashboard
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_workers' AND column_name = 'salary'
  ) THEN
    ALTER TABLE repair_workers ADD COLUMN salary decimal(12, 0) DEFAULT 10000000;
  END IF;
END $$;

UPDATE repair_workers SET salary = 10000000 WHERE salary IS NULL;