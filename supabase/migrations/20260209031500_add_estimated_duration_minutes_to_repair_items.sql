/*
  # Add estimated duration to repair items

  1. Changes
    - Add `estimated_duration_minutes` column to `repair_items`
    - Add check constraint to ensure value is positive when provided

  2. Purpose
    - Store expected workload when assigning worker to a repair item
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_items' AND column_name = 'estimated_duration_minutes'
  ) THEN
    ALTER TABLE repair_items ADD COLUMN estimated_duration_minutes integer;
  END IF;
END $$;

ALTER TABLE repair_items
DROP CONSTRAINT IF EXISTS repair_items_estimated_duration_minutes_check;

ALTER TABLE repair_items
ADD CONSTRAINT repair_items_estimated_duration_minutes_check
CHECK (
  estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0
);
