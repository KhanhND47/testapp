/*
  # Create Mechanical Repair System Schema

  1. New Tables
    - `repair_bays` - Cầu sửa chữa
      - `id` (uuid, primary key)
      - `name` (text) - Tên cầu (Cầu số 1, 2, 3)
      - `order_index` (integer) - Thứ tự hiển thị
      - `created_at` (timestamptz)
    
    - `repair_workers` - Thợ sửa chữa
      - `id` (uuid, primary key)
      - `name` (text) - Tên thợ
      - `is_active` (boolean)
      - `created_at` (timestamptz)
    
    - `mechanical_repair_orders` - Lệnh sửa chữa
      - `id` (uuid, primary key)
      - `license_plate` (text) - Biển số xe
      - `bay_id` (uuid, nullable) - Cầu sửa chữa (null = không lên cầu)
      - `no_bay_index` (integer, nullable) - Index cho xe không lên cầu
      - `receive_date` (date) - Ngày nhận xe
      - `receive_time` (time) - Giờ nhận xe
      - `return_date` (date) - Ngày trả xe
      - `return_time` (time) - Giờ trả xe
      - `actual_end_time` (timestamptz, nullable) - Thời gian kết thúc thực tế
      - `status` (text) - Trạng thái
      - `waiting_parts_duration` (integer, nullable) - Thời gian đợi phụ tùng (phút)
      - `waiting_parts_start` (timestamptz, nullable) - Thời điểm bắt đầu đợi
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `mechanical_repair_assignments` - Phân công thợ
      - `id` (uuid, primary key)
      - `repair_order_id` (uuid) - FK to mechanical_repair_orders
      - `worker_id` (uuid) - FK to repair_workers
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anon access
*/

-- Repair Bays Table
CREATE TABLE IF NOT EXISTS repair_bays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE repair_bays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read repair_bays for all"
  ON repair_bays FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert repair_bays for authenticated"
  ON repair_bays FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update repair_bays for authenticated"
  ON repair_bays FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete repair_bays for authenticated"
  ON repair_bays FOR DELETE
  TO authenticated, anon
  USING (true);

-- Repair Workers Table
CREATE TABLE IF NOT EXISTS repair_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE repair_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read repair_workers for all"
  ON repair_workers FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert repair_workers for authenticated"
  ON repair_workers FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update repair_workers for authenticated"
  ON repair_workers FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete repair_workers for authenticated"
  ON repair_workers FOR DELETE
  TO authenticated, anon
  USING (true);

-- Mechanical Repair Orders Table
CREATE TABLE IF NOT EXISTS mechanical_repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL,
  bay_id uuid REFERENCES repair_bays(id) ON DELETE SET NULL,
  no_bay_index integer,
  receive_date date NOT NULL,
  receive_time time NOT NULL,
  return_date date NOT NULL,
  return_time time NOT NULL,
  actual_end_time timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  waiting_parts_duration integer,
  waiting_parts_start timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'not_started', 'in_progress', 'waiting_parts', 'completed'))
);

ALTER TABLE mechanical_repair_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read mechanical_repair_orders for all"
  ON mechanical_repair_orders FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert mechanical_repair_orders for authenticated"
  ON mechanical_repair_orders FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update mechanical_repair_orders for authenticated"
  ON mechanical_repair_orders FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete mechanical_repair_orders for authenticated"
  ON mechanical_repair_orders FOR DELETE
  TO authenticated, anon
  USING (true);

-- Mechanical Repair Assignments Table
CREATE TABLE IF NOT EXISTS mechanical_repair_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid NOT NULL REFERENCES mechanical_repair_orders(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES repair_workers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(repair_order_id, worker_id)
);

ALTER TABLE mechanical_repair_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read mechanical_repair_assignments for all"
  ON mechanical_repair_assignments FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert mechanical_repair_assignments for authenticated"
  ON mechanical_repair_assignments FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update mechanical_repair_assignments for authenticated"
  ON mechanical_repair_assignments FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete mechanical_repair_assignments for authenticated"
  ON mechanical_repair_assignments FOR DELETE
  TO authenticated, anon
  USING (true);

-- Insert default repair bays
INSERT INTO repair_bays (name, order_index) VALUES
  ('Cầu số 1', 1),
  ('Cầu số 2', 2),
  ('Cầu số 3', 3)
ON CONFLICT DO NOTHING;

-- Insert default repair workers
INSERT INTO repair_workers (name) VALUES
  ('Vịnh'),
  ('Kiều'),
  ('Quang'),
  ('Long')
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mechanical_repair_orders_dates ON mechanical_repair_orders(receive_date, return_date);
CREATE INDEX IF NOT EXISTS idx_mechanical_repair_orders_bay ON mechanical_repair_orders(bay_id);
CREATE INDEX IF NOT EXISTS idx_mechanical_repair_orders_status ON mechanical_repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_mechanical_repair_assignments_order ON mechanical_repair_assignments(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_mechanical_repair_assignments_worker ON mechanical_repair_assignments(worker_id);