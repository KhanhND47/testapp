/*
  # Thêm trạng thái đợi phụ tùng cho lệnh sửa chữa

  1. Thay đổi
    - Thêm cột `waiting_for_parts` vào bảng `general_repair_orders`
      - Cho phép đánh dấu xe đang đợi phụ tùng ngay cả khi chưa lên cầu
    - Thêm cột `parts_note` để ghi chú phụ tùng cần đợi
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'general_repair_orders' AND column_name = 'waiting_for_parts'
  ) THEN
    ALTER TABLE general_repair_orders ADD COLUMN waiting_for_parts boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'general_repair_orders' AND column_name = 'parts_note'
  ) THEN
    ALTER TABLE general_repair_orders ADD COLUMN parts_note text;
  END IF;
END $$;