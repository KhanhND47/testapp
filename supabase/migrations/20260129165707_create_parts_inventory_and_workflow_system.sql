/*
  # Tạo kho phụ tùng và hệ thống quy trình (Parts Inventory & Workflow System)

  1. Bảng mới (New Tables)
    - `parts` - Kho phụ tùng
      - `id` (uuid, primary key)
      - `part_code` (text, unique) - Mã phụ tùng (auto-generate)
      - `part_name` (text) - Tên phụ tùng  
      - `category` (text) - Loại phụ tùng
      - `group` (text) - Nhóm phụ tùng
      - `supplier_name` (text) - Nhà cung cấp
      - `cost_price` (decimal) - Giá nhập
      - `sale_price` (decimal) - Giá bán
      - `quality_grade` (text) - Chất lượng A/B/C
      - `stock_qty` (int) - Số lượng tồn

  2. Cập nhật bảng hiện tại (Updates to Existing Tables)
    - `customers` - Thêm cột customer_type
    - `vehicles` - Thêm cột customer_id để liên kết trực tiếp

  3. Bảo mật (Security)
    - Bật RLS cho bảng parts
    - Cho phép authenticated users quản lý

  4. Ghi chú
    - Hàm generate_part_code() tự động tạo mã phụ tùng theo format PT-YYMM-0001
*/

-- Add customer_type column to customers table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'customer_type'
  ) THEN
    ALTER TABLE customers ADD COLUMN customer_type text NOT NULL DEFAULT 'individual'
      CHECK (customer_type IN ('individual', 'company'));
  END IF;
END $$;

-- Add customer_id column to vehicles table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create parts table (Kho phụ tùng)
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_code text UNIQUE NOT NULL,
  part_name text NOT NULL,
  category text,
  "group" text,
  supplier_name text,
  cost_price decimal(15,2) DEFAULT 0,
  sale_price decimal(15,2) DEFAULT 0,
  quality_grade text CHECK (quality_grade IN ('A', 'B', 'C')),
  stock_qty int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read parts"
  ON parts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert parts"
  ON parts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update parts"
  ON parts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete parts"
  ON parts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to auto-generate part_code
CREATE OR REPLACE FUNCTION generate_part_code()
RETURNS text AS $$
DECLARE
  new_code text;
  year_month text;
  sequence_num int;
BEGIN
  year_month := to_char(now(), 'YYMM');

  SELECT COALESCE(MAX(CAST(substring(part_code FROM 'PT-[0-9]{4}-([0-9]+)') AS int)), 0) + 1
  INTO sequence_num
  FROM parts
  WHERE part_code LIKE 'PT-' || year_month || '-%';

  new_code := 'PT-' || year_month || '-' || lpad(sequence_num::text, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_parts_part_code ON parts(part_code);
CREATE INDEX IF NOT EXISTS idx_parts_part_name ON parts(part_name);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id_new ON vehicles(customer_id);
