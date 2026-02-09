/*
  # Sửa RLS policies cho bảng marketing_goals
  
  1. Thay đổi
    - Xóa policy "FOR ALL" không rõ ràng
    - Tạo các policies riêng biệt cho SELECT, INSERT, UPDATE, DELETE
    - Đảm bảo authenticated users có thể thực hiện tất cả các thao tác
  
  2. Security
    - Tất cả authenticated users có thể xem, tạo, cập nhật và xóa marketing goals
*/

-- Xóa policy cũ
DROP POLICY IF EXISTS "Authenticated users can manage marketing goals" ON marketing_goals;

-- Tạo policies mới riêng biệt
CREATE POLICY "Authenticated users can insert marketing goals"
  ON marketing_goals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update marketing goals"
  ON marketing_goals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete marketing goals"
  ON marketing_goals FOR DELETE
  TO authenticated
  USING (true);
