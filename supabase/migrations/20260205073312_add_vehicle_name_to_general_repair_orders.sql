/*
  # Add vehicle_name column to general_repair_orders

  1. Changes
    - Add `vehicle_name` column to `general_repair_orders` table
      - Type: text
      - Stores vehicle model/name
  
  2. Notes
    - This field stores the vehicle model/name for reference
    - Optional field (nullable) for backwards compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'general_repair_orders' AND column_name = 'vehicle_name'
  ) THEN
    ALTER TABLE general_repair_orders ADD COLUMN vehicle_name text;
  END IF;
END $$;
