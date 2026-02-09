/*
  # Thêm thời gian đặt phụ tùng

  1. Thay đổi
    - Thêm cột `parts_order_start_time` vào `general_repair_orders`
      - Thời gian bắt đầu đặt phụ tùng
    - Thêm cột `parts_expected_end_time` vào `general_repair_orders`
      - Thời gian dự kiến nhận được phụ tùng
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'general_repair_orders' AND column_name = 'parts_order_start_time'
  ) THEN
    ALTER TABLE general_repair_orders ADD COLUMN parts_order_start_time timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'general_repair_orders' AND column_name = 'parts_expected_end_time'
  ) THEN
    ALTER TABLE general_repair_orders ADD COLUMN parts_expected_end_time timestamptz;
  END IF;
END $$;