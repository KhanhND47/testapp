/*
  # Create Mechanical Repair Revenues Table

  1. New Tables
    - `mechanical_repair_revenues`
      - `id` (uuid, primary key)
      - `repair_order_id` (uuid, foreign key to mechanical_repair_orders)
      - `amount` (decimal) - So tien doanh thu
      - `revenue_type` (text) - Loai doanh thu: 'labor' (cong tho) hoac 'parts_profit' (loi nhuan phu tung)
      - `description` (text, optional) - Mo ta chi tiet
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `mechanical_repair_revenues` table
    - Add policies for authenticated users

  3. Notes
    - revenue_type: 'labor' = Cong tho, 'parts_profit' = Loi nhuan phu tung
    - amount stored as decimal for precision
*/

CREATE TABLE IF NOT EXISTS mechanical_repair_revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid NOT NULL REFERENCES mechanical_repair_orders(id) ON DELETE CASCADE,
  amount decimal(12, 0) NOT NULL DEFAULT 0,
  revenue_type text NOT NULL CHECK (revenue_type IN ('labor', 'parts_profit')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mechanical_repair_revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read mechanical_repair_revenues"
  ON mechanical_repair_revenues
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert mechanical_repair_revenues"
  ON mechanical_repair_revenues
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update mechanical_repair_revenues"
  ON mechanical_repair_revenues
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete mechanical_repair_revenues"
  ON mechanical_repair_revenues
  FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_mechanical_repair_revenues_order ON mechanical_repair_revenues(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_mechanical_repair_revenues_type ON mechanical_repair_revenues(revenue_type);