/*
  # Tạo các bảng quy trình sửa chữa xe (Vehicle Repair Workflow Tables)

  1. Bảng mới (New Tables)
    - `vehicle_repair_orders` - Hồ sơ sửa chữa xe (Master data)
      - `id` (uuid, primary key)
      - `ro_code` (text, unique) - Mã hồ sơ
      - `customer_id` (uuid) - Khách hàng
      - `vehicle_id` (uuid) - Xe
      - `advisor_id` (uuid) - Nhân viên tư vấn
      - `received_at` (timestamptz) - Thời gian tiếp nhận
      - `odo` (int) - Số km
      - `fuel_level` (text) - Mức nhiên liệu
      - `quote_intent` (boolean) - Có yêu cầu báo giá không
      - `need_inspection` (boolean) - Có cần kiểm tra không
      - `expected_result_at` (timestamptz) - Dự kiến phản hồi KQ
      - `status` (text) - Trạng thái workflow
      - `attachments` (jsonb) - Ảnh/ghi chú
      - `created_at`, `updated_at`

    - `intake_requests` - BM-01: Yêu cầu tiếp nhận
      - `id` (uuid, primary key)
      - `repair_order_id` (uuid) - ID hồ sơ
      - `request_content` (text) - Nội dung yêu cầu
      - `suggested_service` (text) - Dịch vụ đề xuất
      - `sort_order` (int) - Thứ tự

  2. Workflow States
    - NEW_INTAKE: Tiếp nhận mới
    - INSPECTION_REQUESTED: Đã yêu cầu kiểm tra
    - DIAGNOSIS_DONE: Đã chẩn đoán
    - QUOTE_CREATED: Đã tạo báo giá
    - WAIT_CUSTOMER_APPROVAL_QUOTE: Chờ duyệt báo giá
    - SERVICE_REQUEST_SIGNED: Đã ký phiếu dịch vụ
    - IN_PROGRESS: Đang sửa
    - COMPLETED: Hoàn thành

  3. Bảo mật (Security)
    - Bật RLS cho tất cả bảng
    - Cho phép authenticated users truy cập
*/

-- Create vehicle_repair_orders table
CREATE TABLE IF NOT EXISTS vehicle_repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ro_code text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  advisor_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  received_at timestamptz DEFAULT now(),
  odo int,
  fuel_level text,
  quote_intent boolean DEFAULT false,
  need_inspection boolean DEFAULT false,
  expected_result_at timestamptz,
  status text NOT NULL DEFAULT 'NEW_INTAKE' CHECK (status IN (
    'NEW_INTAKE',
    'INSPECTION_REQUESTED',
    'DIAGNOSIS_DONE',
    'QUOTE_CREATED',
    'WAIT_CUSTOMER_APPROVAL_QUOTE',
    'SERVICE_REQUEST_SIGNED',
    'IN_PROGRESS',
    'COMPLETED'
  )),
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_repair_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read vehicle repair orders"
  ON vehicle_repair_orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert vehicle repair orders"
  ON vehicle_repair_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update vehicle repair orders"
  ON vehicle_repair_orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete vehicle repair orders"
  ON vehicle_repair_orders
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to auto-generate ro_code
CREATE OR REPLACE FUNCTION generate_ro_code()
RETURNS text AS $$
DECLARE
  new_code text;
  year_month text;
  sequence_num int;
BEGIN
  year_month := to_char(now(), 'YYMM');

  SELECT COALESCE(MAX(CAST(substring(ro_code FROM 'RO-[0-9]{4}-([0-9]+)') AS int)), 0) + 1
  INTO sequence_num
  FROM vehicle_repair_orders
  WHERE ro_code LIKE 'RO-' || year_month || '-%';

  new_code := 'RO-' || year_month || '-' || lpad(sequence_num::text, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create intake_requests table (BM-01)
CREATE TABLE IF NOT EXISTS intake_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid REFERENCES vehicle_repair_orders(id) ON DELETE CASCADE,
  request_content text NOT NULL,
  suggested_service text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE intake_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read intake requests"
  ON intake_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert intake requests"
  ON intake_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update intake requests"
  ON intake_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete intake requests"
  ON intake_requests
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_repair_orders_customer_id ON vehicle_repair_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_repair_orders_vehicle_id ON vehicle_repair_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_repair_orders_status ON vehicle_repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_repair_orders_ro_code ON vehicle_repair_orders(ro_code);
CREATE INDEX IF NOT EXISTS idx_intake_requests_repair_order_id ON intake_requests(repair_order_id);
