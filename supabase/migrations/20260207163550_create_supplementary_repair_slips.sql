/*
  # Create Supplementary Repair Slips System

  1. New Tables
    - `supplementary_repair_slips`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references general_repair_orders)
      - `customer_name` (text) - customer name from the repair order
      - `vehicle_name` (text) - vehicle name
      - `license_plate` (text) - license plate number
      - `diagnosis_date` (date) - date of supplementary diagnosis
      - `notes` (text) - general notes/conditions
      - `created_by` (text) - who created the slip
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `supplementary_repair_items`
      - `id` (uuid, primary key)
      - `slip_id` (uuid, references supplementary_repair_slips with cascade delete)
      - `order_index` (integer) - display order
      - `item_name` (text) - repair item/part name
      - `symptoms` (text) - symptom description
      - `diagnosis_result` (text) - diagnosis findings
      - `repair_solution` (text) - proposed repair method
      - `materials` (text) - materials/parts needed
      - `quantity` (text) - quantity of materials
      - `item_notes` (text) - additional notes per item
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Allow authenticated users to manage slips for orders they can access
    - Allow anonymous access (matching existing app pattern for repair orders)

  3. Notes
    - Each repair order can have multiple supplementary slips
    - Each slip can have multiple line items
    - Cascade delete ensures items are removed when a slip is deleted
*/

CREATE TABLE IF NOT EXISTS supplementary_repair_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES general_repair_orders(id),
  customer_name text NOT NULL DEFAULT '',
  vehicle_name text NOT NULL DEFAULT '',
  license_plate text NOT NULL DEFAULT '',
  diagnosis_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplementary_repair_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_id uuid NOT NULL REFERENCES supplementary_repair_slips(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  item_name text NOT NULL DEFAULT '',
  symptoms text DEFAULT '',
  diagnosis_result text DEFAULT '',
  repair_solution text DEFAULT '',
  materials text DEFAULT '',
  quantity text DEFAULT '',
  item_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplementary_repair_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplementary_repair_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supplementary slips"
  ON supplementary_repair_slips
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  );

CREATE POLICY "Authenticated users can insert supplementary slips"
  ON supplementary_repair_slips
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  );

CREATE POLICY "Authenticated users can update supplementary slips"
  ON supplementary_repair_slips
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  );

CREATE POLICY "Authenticated users can delete supplementary slips"
  ON supplementary_repair_slips
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  );

CREATE POLICY "Authenticated users can view supplementary items"
  ON supplementary_repair_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  );

CREATE POLICY "Authenticated users can insert supplementary items"
  ON supplementary_repair_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  );

CREATE POLICY "Authenticated users can update supplementary items"
  ON supplementary_repair_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  );

CREATE POLICY "Authenticated users can delete supplementary items"
  ON supplementary_repair_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  );

CREATE POLICY "Anonymous users can view supplementary slips"
  ON supplementary_repair_slips
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  );

CREATE POLICY "Anonymous users can insert supplementary slips"
  ON supplementary_repair_slips
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  );

CREATE POLICY "Anonymous users can update supplementary slips"
  ON supplementary_repair_slips
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  );

CREATE POLICY "Anonymous users can delete supplementary slips"
  ON supplementary_repair_slips
  FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM general_repair_orders
      WHERE general_repair_orders.id = supplementary_repair_slips.order_id
    )
  );

CREATE POLICY "Anonymous users can view supplementary items"
  ON supplementary_repair_items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  );

CREATE POLICY "Anonymous users can insert supplementary items"
  ON supplementary_repair_items
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  );

CREATE POLICY "Anonymous users can update supplementary items"
  ON supplementary_repair_items
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  );

CREATE POLICY "Anonymous users can delete supplementary items"
  ON supplementary_repair_items
  FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM supplementary_repair_slips
      WHERE supplementary_repair_slips.id = supplementary_repair_items.slip_id
    )
  );