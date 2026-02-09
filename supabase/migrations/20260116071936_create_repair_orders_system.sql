/*
  # Create Repair Orders System

  1. New Tables
    - `general_repair_orders` - Lenh sua chua tong quat
      - `id` (uuid, primary key)
      - `license_plate` (text) - Bien so xe
      - `customer_name` (text) - Ten khach hang
      - `vehicle_name` (text) - Ten xe
      - `receive_date` (date) - Ngay nhan xe
      - `return_date` (date) - Ngay tra xe du kien
      - `status` (text) - Trang thai: pending, in_progress, completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `repair_items` - Cac hang muc sua chua
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `name` (text) - Ten hang muc
      - `status` (text) - pending, in_progress, completed
      - `started_at` (timestamptz) - Thoi gian bat dau
      - `completed_at` (timestamptz) - Thoi gian hoan thanh
      - `worker_id` (uuid) - Tho thuc hien
      - `order_index` (int) - Thu tu hien thi
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous access (for demo purposes)
*/

CREATE TABLE IF NOT EXISTS general_repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL,
  customer_name text NOT NULL,
  vehicle_name text NOT NULL,
  receive_date date NOT NULL,
  return_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repair_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES general_repair_orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  worker_id uuid REFERENCES repair_workers(id),
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE general_repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read general_repair_orders"
  ON general_repair_orders FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert general_repair_orders"
  ON general_repair_orders FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update general_repair_orders"
  ON general_repair_orders FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous delete general_repair_orders"
  ON general_repair_orders FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anonymous read repair_items"
  ON repair_items FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert repair_items"
  ON repair_items FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update repair_items"
  ON repair_items FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous delete repair_items"
  ON repair_items FOR DELETE TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_repair_items_order ON repair_items(order_id);
CREATE INDEX IF NOT EXISTS idx_repair_items_worker ON repair_items(worker_id);
CREATE INDEX IF NOT EXISTS idx_general_repair_orders_status ON general_repair_orders(status);