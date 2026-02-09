/*
  # Cho phép anonymous users truy cập tất cả marketing tables
  
  1. Thay đổi
    - Thêm policies cho anonymous users cho marketing_videos
    - Thêm policies cho anonymous users cho marketing_stages
    - Thêm policies cho anonymous users cho marketing_staff
  
  2. Lý do
    - Module Marketing không yêu cầu authentication
    - Đảm bảo tính nhất quán cho toàn bộ module
*/

-- Policies cho marketing_videos
CREATE POLICY "Anonymous users can view marketing videos"
  ON marketing_videos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert marketing videos"
  ON marketing_videos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update marketing videos"
  ON marketing_videos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete marketing videos"
  ON marketing_videos FOR DELETE
  TO anon
  USING (true);

-- Policies cho marketing_stages
CREATE POLICY "Anonymous users can view marketing stages"
  ON marketing_stages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert marketing stages"
  ON marketing_stages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update marketing stages"
  ON marketing_stages FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete marketing stages"
  ON marketing_stages FOR DELETE
  TO anon
  USING (true);

-- Policies cho marketing_staff
CREATE POLICY "Anonymous users can view marketing staff"
  ON marketing_staff FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert marketing staff"
  ON marketing_staff FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update marketing staff"
  ON marketing_staff FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete marketing staff"
  ON marketing_staff FOR DELETE
  TO anon
  USING (true);
