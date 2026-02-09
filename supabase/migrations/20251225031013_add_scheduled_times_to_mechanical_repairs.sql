/*
  # Add Scheduled Times to Mechanical Repair Orders

  1. Changes
    - Add `scheduled_start_date` (date) - Ngay bat dau sua chua tai cau
    - Add `scheduled_start_time` (time) - Gio bat dau sua chua tai cau
    - Add `scheduled_end_date` (date) - Ngay ket thuc sua chua tai cau
    - Add `scheduled_end_time` (time) - Gio ket thuc sua chua tai cau

  2. Notes
    - These fields are separate from receive/return dates which track when customer drops off/picks up vehicle
    - Scheduled times track when the actual repair work happens at the bay
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mechanical_repair_orders' AND column_name = 'scheduled_start_date'
  ) THEN
    ALTER TABLE mechanical_repair_orders ADD COLUMN scheduled_start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mechanical_repair_orders' AND column_name = 'scheduled_start_time'
  ) THEN
    ALTER TABLE mechanical_repair_orders ADD COLUMN scheduled_start_time time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mechanical_repair_orders' AND column_name = 'scheduled_end_date'
  ) THEN
    ALTER TABLE mechanical_repair_orders ADD COLUMN scheduled_end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mechanical_repair_orders' AND column_name = 'scheduled_end_time'
  ) THEN
    ALTER TABLE mechanical_repair_orders ADD COLUMN scheduled_end_time time;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mechanical_repair_orders_scheduled ON mechanical_repair_orders(scheduled_start_date, scheduled_end_date);