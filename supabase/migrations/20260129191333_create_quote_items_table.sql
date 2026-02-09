/*
  # Create Quote Items Table

  1. New Tables
    - `vr_quote_items`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key to vr_quotes)
      - `diagnosis_item_id` (uuid, foreign key) - Link to diagnosis item
      - `component_name` (text) - Hạng mục/Bộ phận
      - `symptom` (text) - Triệu chứng
      - `diagnosis_result` (text) - Kết quả chẩn đoán
      - `repair_method` (text) - Phương án sửa chữa
      - `part_id` (uuid, foreign key) - Link to parts table
      - `part_name` (text) - Tên vật tư/phụ tùng
      - `quantity` (decimal) - Số lượng
      - `unit_price` (decimal) - Đơn giá
      - `labor_cost` (decimal) - Công thợ
      - `total_amount` (decimal) - Thành tiền
      - `order_index` (int) - Thứ tự hiển thị
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on vr_quote_items table
    - Add policies for public access
  
  3. Notes
    - Uses existing parts table with columns: part_code, part_name, supplier_name, sale_price, quality_grade, stock_qty
    - Adds RLS policies to parts table for public access
    - Adds full-text search indexes on parts table
*/

-- Create vr_quote_items table
CREATE TABLE IF NOT EXISTS vr_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES vr_quotes(id) ON DELETE CASCADE,
  diagnosis_item_id uuid REFERENCES diagnosis_items(id) ON DELETE SET NULL,
  component_name text NOT NULL,
  symptom text,
  diagnosis_result text,
  repair_method text,
  part_id uuid REFERENCES parts(id) ON DELETE SET NULL,
  part_name text,
  quantity decimal(10,2) NOT NULL DEFAULT 1,
  unit_price decimal(15,2) NOT NULL DEFAULT 0,
  labor_cost decimal(15,2) NOT NULL DEFAULT 0,
  total_amount decimal(15,2) NOT NULL DEFAULT 0,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on vr_quote_items
ALTER TABLE vr_quote_items ENABLE ROW LEVEL SECURITY;

-- Quote items policies (allow all operations for public)
CREATE POLICY "Allow read vr_quote_items for all"
  ON vr_quote_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert vr_quote_items for all"
  ON vr_quote_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update vr_quote_items for all"
  ON vr_quote_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete vr_quote_items for all"
  ON vr_quote_items FOR DELETE
  TO public
  USING (true);

-- Create indexes on vr_quote_items
CREATE INDEX IF NOT EXISTS idx_vr_quote_items_quote_id ON vr_quote_items(quote_id);

-- Add full-text search index on parts table for live search
CREATE INDEX IF NOT EXISTS idx_parts_name_search ON parts USING gin(to_tsvector('simple', part_name));
CREATE INDEX IF NOT EXISTS idx_parts_supplier_search ON parts USING gin(to_tsvector('simple', supplier_name));

-- Update RLS policies for parts table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'parts' AND policyname = 'Allow read parts for all'
  ) THEN
    CREATE POLICY "Allow read parts for all" ON parts FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'parts' AND policyname = 'Allow insert parts for all'
  ) THEN
    CREATE POLICY "Allow insert parts for all" ON parts FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'parts' AND policyname = 'Allow update parts for all'
  ) THEN
    CREATE POLICY "Allow update parts for all" ON parts FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'parts' AND policyname = 'Allow delete parts for all'
  ) THEN
    CREATE POLICY "Allow delete parts for all" ON parts FOR DELETE TO public USING (true);
  END IF;
END $$;

-- Function to generate unique part code
CREATE OR REPLACE FUNCTION generate_part_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'PT' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM parts WHERE part_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
