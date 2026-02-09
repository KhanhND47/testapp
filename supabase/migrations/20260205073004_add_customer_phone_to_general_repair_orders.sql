/*
  # Add customer_phone column to general_repair_orders

  1. Changes
    - Add `customer_phone` column to `general_repair_orders` table
      - Type: text
      - Stores customer phone number for contact purposes
  
  2. Notes
    - This field allows staff to contact customers about repair status
    - Optional field (nullable) as some old records may not have phone numbers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'general_repair_orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE general_repair_orders ADD COLUMN customer_phone text;
  END IF;
END $$;
