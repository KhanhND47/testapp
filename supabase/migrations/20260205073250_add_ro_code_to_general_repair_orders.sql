/*
  # Add ro_code column to general_repair_orders

  1. Changes
    - Add `ro_code` column to `general_repair_orders` table
      - Type: text
      - Stores repair order code
      - Unique identifier for each repair order
  
  2. Notes
    - This field stores the repair order reference code
    - Optional field (nullable) for backwards compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'general_repair_orders' AND column_name = 'ro_code'
  ) THEN
    ALTER TABLE general_repair_orders ADD COLUMN ro_code text;
  END IF;
END $$;
