/*
  # Tạo bảng kiểm tra, chẩn đoán và báo giá (Inspection, Diagnosis, Quote Tables)

  1. Bảng mới (New Tables)
    - `inspection_requests` - BM-02: Phiếu yêu cầu kiểm tra
      - `id`, `repair_order_id`, `check_start_time`, `expected_result_time`
      
    - `inspection_request_items` - Chi tiết kiểm tra
      - `id`, `inspection_request_id`, `check_content`, `estimated_hours`, `technician_id`, `note`, `sort_order`
      
    - `diagnosis_reports` - BM-05: Phiếu chẩn đoán
      - `id`, `repair_order_id`, `inspection_request_id`, `diagnosis_date`, `technician_id`
      
    - `diagnosis_lines` - Chi tiết chẩn đoán
      - `id`, `diagnosis_report_id`, `part_system`, `symptom`, `diagnosis`, `repair_plan`, 
        `parts_materials`, `qty`, `labor_cost`, `note`, `sort_order`
        
    - `vr_quotes` - BM-06: Phiếu báo giá (prefix vr_ để tránh xung đột)
      - `id`, `repair_order_id`, `diagnosis_report_id`, `quote_code`, `quote_date`, `version`,
        `status`, `discount_amount`, `total_amount`, `terms_note`, `approved_at`, `created_by`
        
    - `vr_quote_items` - Chi tiết báo giá
      - `id`, `quote_id`, `item_type`, `part_id`, `description`, `qty`, `unit_price`, 
        `amount`, `note`, `sort_order`

  2. Bảo mật (Security)
    - Bật RLS cho tất cả bảng
    - Cho phép authenticated users truy cập

  3. Ghi chú
    - Quote status: draft, sent, approved, rejected
    - Item type: PART, LABOR, SERVICE
    - Hàm generate_quote_code() tự động tạo mã báo giá
*/

-- Create inspection_requests table (BM-02)
CREATE TABLE IF NOT EXISTS inspection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid REFERENCES vehicle_repair_orders(id) ON DELETE CASCADE,
  check_start_time timestamptz,
  expected_result_time timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inspection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage inspection requests"
  ON inspection_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create inspection_request_items table
CREATE TABLE IF NOT EXISTS inspection_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_request_id uuid REFERENCES inspection_requests(id) ON DELETE CASCADE,
  check_content text NOT NULL,
  estimated_hours decimal(10,2),
  technician_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  note text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inspection_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage inspection items"
  ON inspection_request_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create diagnosis_reports table (BM-05)
CREATE TABLE IF NOT EXISTS diagnosis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid REFERENCES vehicle_repair_orders(id) ON DELETE CASCADE,
  inspection_request_id uuid REFERENCES inspection_requests(id) ON DELETE SET NULL,
  diagnosis_date timestamptz DEFAULT now(),
  technician_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnosis_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage diagnosis reports"
  ON diagnosis_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create diagnosis_lines table
CREATE TABLE IF NOT EXISTS diagnosis_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_report_id uuid REFERENCES diagnosis_reports(id) ON DELETE CASCADE,
  part_system text,
  symptom text,
  diagnosis text,
  repair_plan text,
  parts_materials text,
  qty decimal(10,2),
  labor_cost decimal(15,2),
  note text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnosis_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage diagnosis lines"
  ON diagnosis_lines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create vr_quotes table (BM-06) - prefix vr_ to avoid conflict
CREATE TABLE IF NOT EXISTS vr_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid REFERENCES vehicle_repair_orders(id) ON DELETE CASCADE,
  diagnosis_report_id uuid REFERENCES diagnosis_reports(id) ON DELETE SET NULL,
  quote_code text UNIQUE NOT NULL,
  quote_date timestamptz DEFAULT now(),
  version int DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  discount_amount decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  terms_note text,
  approved_at timestamptz,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vr_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage quotes"
  ON vr_quotes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to auto-generate quote_code
CREATE OR REPLACE FUNCTION generate_vr_quote_code()
RETURNS text AS $$
DECLARE
  new_code text;
  year_month text;
  sequence_num int;
BEGIN
  year_month := to_char(now(), 'YYMM');

  SELECT COALESCE(MAX(CAST(substring(quote_code FROM 'QT-[0-9]{4}-([0-9]+)') AS int)), 0) + 1
  INTO sequence_num
  FROM vr_quotes
  WHERE quote_code LIKE 'QT-' || year_month || '-%';

  new_code := 'QT-' || year_month || '-' || lpad(sequence_num::text, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create vr_quote_items table
CREATE TABLE IF NOT EXISTS vr_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES vr_quotes(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('PART', 'LABOR', 'SERVICE')),
  part_id uuid REFERENCES parts(id) ON DELETE SET NULL,
  description text NOT NULL,
  qty decimal(10,2) NOT NULL DEFAULT 1,
  unit_price decimal(15,2) NOT NULL DEFAULT 0,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  note text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vr_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage quote items"
  ON vr_quote_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inspection_requests_repair_order_id ON inspection_requests(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_request_id ON inspection_request_items(inspection_request_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_reports_repair_order_id ON diagnosis_reports(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_lines_report_id ON diagnosis_lines(diagnosis_report_id);
CREATE INDEX IF NOT EXISTS idx_vr_quotes_repair_order_id ON vr_quotes(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_vr_quote_items_quote_id ON vr_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_vr_quotes_quote_code ON vr_quotes(quote_code);
