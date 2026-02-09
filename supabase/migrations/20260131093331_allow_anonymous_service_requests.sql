/*
  # Cho phép anonymous user truy cập phiếu yêu cầu dịch vụ
  
  1. Thay đổi (Changes)
    - Cho phép anonymous user đọc vr_service_requests
    - Cho phép anonymous user tạo vr_service_requests
    - Cho phép anonymous user cập nhật vr_service_requests
    - Cho phép anonymous user đọc vr_service_request_items
    - Cho phép anonymous user tạo vr_service_request_items
    - Cho phép anonymous user cập nhật vr_service_request_items
*/

-- Allow anonymous users to read service requests
DROP POLICY IF EXISTS "Allow anonymous users to read service requests" ON vr_service_requests;
CREATE POLICY "Allow anonymous users to read service requests"
  ON vr_service_requests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous users to insert service requests
DROP POLICY IF EXISTS "Allow anonymous users to insert service requests" ON vr_service_requests;
CREATE POLICY "Allow anonymous users to insert service requests"
  ON vr_service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to update service requests
DROP POLICY IF EXISTS "Allow anonymous users to update service requests" ON vr_service_requests;
CREATE POLICY "Allow anonymous users to update service requests"
  ON vr_service_requests
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to read service request items
DROP POLICY IF EXISTS "Allow anonymous users to read service request items" ON vr_service_request_items;
CREATE POLICY "Allow anonymous users to read service request items"
  ON vr_service_request_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous users to insert service request items
DROP POLICY IF EXISTS "Allow anonymous users to insert service request items" ON vr_service_request_items;
CREATE POLICY "Allow anonymous users to insert service request items"
  ON vr_service_request_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to update service request items
DROP POLICY IF EXISTS "Allow anonymous users to update service request items" ON vr_service_request_items;
CREATE POLICY "Allow anonymous users to update service request items"
  ON vr_service_request_items
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);