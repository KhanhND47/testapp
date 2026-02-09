/*
  # Cho phép anonymous users truy cập marketing_goals
  
  1. Thay đổi
    - Thêm policies cho anonymous users
    - Đảm bảo cả authenticated và anonymous users đều có thể thực hiện các thao tác
  
  2. Lý do
    - Module Marketing không yêu cầu authentication
    - Cần cho phép anonymous users truy cập và quản lý goals
*/

-- Thêm policies cho anonymous users
CREATE POLICY "Anonymous users can view marketing goals"
  ON marketing_goals FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert marketing goals"
  ON marketing_goals FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update marketing goals"
  ON marketing_goals FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete marketing goals"
  ON marketing_goals FOR DELETE
  TO anon
  USING (true);
