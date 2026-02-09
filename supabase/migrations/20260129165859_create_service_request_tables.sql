/*
  # Tạo bảng phiếu yêu cầu dịch vụ (Service Request Tables)

  1. Bảng mới (New Tables)
    - `vr_service_requests` - BM-??: Phiếu yêu cầu dịch vụ KH
      - `id` (uuid, primary key)
      - `repair_order_id` (uuid) - ID hồ sơ
      - `quote_id` (uuid) - ID báo giá (nếu có)
      - `request_date` (timestamptz) - Ngày làm phiếu
      - `start_time` (timestamptz) - Thời gian bắt đầu
      - `expected_finish_time` (timestamptz) - Dự kiến hoàn thành
      - `customer_signature` (text) - Chữ ký khách
      - `created_at` (timestamptz)

    - `vr_service_request_items` - Chi tiết yêu cầu dịch vụ
      - `id` (uuid, primary key)
      - `service_request_id` (uuid) - ID phiếu dịch vụ
      - `item_type` (text) - Loại: PART/LABOR/SERVICE
      - `description` (text) - Mô tả
      - `qty` (decimal) - Số lượng
      - `technician_id` (uuid) - Thợ phụ trách
      - `note` (text) - Ghi chú
      - `sort_order` (int) - Thứ tự

  2. Bảo mật (Security)
    - Bật RLS cho tất cả bảng
    - Cho phép authenticated users truy cập

  3. Ghi chú
    - Phiếu này được tạo khi:
      + Khách đồng ý báo giá (có quote_id)
      + Hoặc không yêu cầu báo giá (quote_id = NULL)
*/

-- Create vr_service_requests table (BM-??)
CREATE TABLE IF NOT EXISTS vr_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid REFERENCES vehicle_repair_orders(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES vr_quotes(id) ON DELETE SET NULL,
  request_date timestamptz DEFAULT now(),
  start_time timestamptz,
  expected_finish_time timestamptz,
  customer_signature text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vr_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read service requests"
  ON vr_service_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert service requests"
  ON vr_service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update service requests"
  ON vr_service_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete service requests"
  ON vr_service_requests
  FOR DELETE
  TO authenticated
  USING (true);

-- Create vr_service_request_items table
CREATE TABLE IF NOT EXISTS vr_service_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid REFERENCES vr_service_requests(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('PART', 'LABOR', 'SERVICE')),
  description text NOT NULL,
  qty decimal(10,2) NOT NULL DEFAULT 1,
  technician_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  note text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vr_service_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read service request items"
  ON vr_service_request_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert service request items"
  ON vr_service_request_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update service request items"
  ON vr_service_request_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete service request items"
  ON vr_service_request_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vr_service_requests_repair_order_id ON vr_service_requests(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_vr_service_requests_quote_id ON vr_service_requests(quote_id);
CREATE INDEX IF NOT EXISTS idx_vr_service_request_items_service_request_id ON vr_service_request_items(service_request_id);
