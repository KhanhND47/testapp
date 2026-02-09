/*
  # Cho phép anonymous users quản lý vehicle repair orders

  1. Vấn đề
    - Hệ thống dùng custom auth (app_users) không phải Supabase Auth
    - User được xem là anonymous khi gọi API
    
  2. Giải pháp
    - Thêm policies cho anonymous users trên vehicle_repair_orders
    - Thêm policies cho anonymous users trên intake_requests
*/

-- Add anonymous policies for vehicle_repair_orders
CREATE POLICY "Allow anonymous to read vehicle repair orders"
  ON vehicle_repair_orders
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous to insert vehicle repair orders"
  ON vehicle_repair_orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to update vehicle repair orders"
  ON vehicle_repair_orders
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to delete vehicle repair orders"
  ON vehicle_repair_orders
  FOR DELETE
  TO anon
  USING (true);

-- Add anonymous policies for intake_requests
CREATE POLICY "Allow anonymous to read intake requests"
  ON intake_requests
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous to insert intake requests"
  ON intake_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to update intake requests"
  ON intake_requests
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to delete intake requests"
  ON intake_requests
  FOR DELETE
  TO anon
  USING (true);
