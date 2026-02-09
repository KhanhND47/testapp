/*
  # Add description column to repair_items

  1. Changes
    - Add `description` column to `repair_items` table
      - Type: text
      - Stores detailed description of the repair item
      - Includes symptoms, repair methods, and parts information
  
  2. Notes
    - This field stores comprehensive details about what needs to be repaired
    - Optional field (nullable) for backwards compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE repair_items ADD COLUMN description text;
  END IF;
END $$;
