/*
  # Cho phép anonymous users tạo và quản lý phiếu yêu cầu kiểm tra

  1. Thay đổi (Changes)
    - Thêm policies cho anonymous users trên bảng `inspection_requests`
    - Thêm policies cho anonymous users trên bảng `inspection_request_items`
    - Thêm policies cho anonymous users trên bảng `diagnosis_reports`
    - Thêm policies cho anonymous users trên bảng `diagnosis_lines`
    - Thêm policies cho anonymous users trên bảng `vr_quotes`
    - Thêm policies cho anonymous users trên bảng `vr_quote_items`

  2. Bảo mật (Security)
    - Cho phép anonymous users đọc và ghi tất cả các bảng
    - Điều này cần thiết cho workflow tạo hồ sơ xe

  3. Ghi chú
    - Các policies này cần cho quy trình hồ sơ xe hoạt động đúng
*/

-- Allow anonymous users to manage inspection_requests
CREATE POLICY "Allow anonymous users to read inspection requests"
  ON inspection_requests
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert inspection requests"
  ON inspection_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update inspection requests"
  ON inspection_requests
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete inspection requests"
  ON inspection_requests
  FOR DELETE
  TO anon
  USING (true);

-- Allow anonymous users to manage inspection_request_items
CREATE POLICY "Allow anonymous users to read inspection items"
  ON inspection_request_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert inspection items"
  ON inspection_request_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update inspection items"
  ON inspection_request_items
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete inspection items"
  ON inspection_request_items
  FOR DELETE
  TO anon
  USING (true);

-- Allow anonymous users to manage diagnosis_reports
CREATE POLICY "Allow anonymous users to read diagnosis reports"
  ON diagnosis_reports
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert diagnosis reports"
  ON diagnosis_reports
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update diagnosis reports"
  ON diagnosis_reports
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete diagnosis reports"
  ON diagnosis_reports
  FOR DELETE
  TO anon
  USING (true);

-- Allow anonymous users to manage diagnosis_lines
CREATE POLICY "Allow anonymous users to read diagnosis lines"
  ON diagnosis_lines
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert diagnosis lines"
  ON diagnosis_lines
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update diagnosis lines"
  ON diagnosis_lines
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete diagnosis lines"
  ON diagnosis_lines
  FOR DELETE
  TO anon
  USING (true);

-- Allow anonymous users to manage vr_quotes
CREATE POLICY "Allow anonymous users to read quotes"
  ON vr_quotes
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert quotes"
  ON vr_quotes
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update quotes"
  ON vr_quotes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete quotes"
  ON vr_quotes
  FOR DELETE
  TO anon
  USING (true);

-- Allow anonymous users to manage vr_quote_items
CREATE POLICY "Allow anonymous users to read quote items"
  ON vr_quote_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert quote items"
  ON vr_quote_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update quote items"
  ON vr_quote_items
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete quote items"
  ON vr_quote_items
  FOR DELETE
  TO anon
  USING (true);
