/*
  # Add Supplementary Quote Workflow

  1. Changes to existing tables
    - `supplementary_repair_slips`: Add `status` column (cho_xac_nhan, da_bao_gia, da_duyet)

  2. New Tables
    - `supplementary_quotes`
      - `id` (uuid, primary key)
      - `slip_id` (uuid, references supplementary_repair_slips)
      - `order_id` (uuid, references general_repair_orders)
      - `customer_name` (text)
      - `vehicle_name` (text)
      - `license_plate` (text)
      - `quote_date` (date)
      - `total_amount` (numeric)
      - `notes` (text)
      - `status` (text: draft, approved, converted)
      - `created_by` (text)
      - `created_at`, `updated_at` (timestamptz)

    - `supplementary_quote_items`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, references supplementary_quotes with cascade delete)
      - `order_index` (integer)
      - `component_name` (text) - item/part name
      - `symptom` (text)
      - `diagnosis_result` (text)
      - `repair_method` (text) - repair solution
      - `part_name` (text) - materials/parts
      - `quantity` (numeric)
      - `unit_price` (numeric)
      - `labor_cost` (numeric)
      - `total_amount` (numeric)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on both new tables
    - Policies for authenticated and anonymous users (matching existing pattern)

  4. Workflow
    - Supplementary slip created with status 'cho_xac_nhan'
    - User creates quote from slip -> slip status becomes 'da_bao_gia'
    - User approves quote and adds items to repair order -> status becomes 'converted'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplementary_repair_slips' AND column_name = 'status'
  ) THEN
    ALTER TABLE supplementary_repair_slips ADD COLUMN status text NOT NULL DEFAULT 'cho_xac_nhan';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS supplementary_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_id uuid NOT NULL REFERENCES supplementary_repair_slips(id),
  order_id uuid NOT NULL REFERENCES general_repair_orders(id),
  customer_name text NOT NULL DEFAULT '',
  vehicle_name text NOT NULL DEFAULT '',
  license_plate text NOT NULL DEFAULT '',
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplementary_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES supplementary_quotes(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  component_name text NOT NULL DEFAULT '',
  symptom text DEFAULT '',
  diagnosis_result text DEFAULT '',
  repair_method text DEFAULT '',
  part_name text DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  labor_cost numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplementary_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplementary_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can select supplementary quotes"
  ON supplementary_quotes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id));

CREATE POLICY "Auth users can insert supplementary quotes"
  ON supplementary_quotes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id));

CREATE POLICY "Auth users can update supplementary quotes"
  ON supplementary_quotes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id))
  WITH CHECK (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id));

CREATE POLICY "Auth users can delete supplementary quotes"
  ON supplementary_quotes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id));

CREATE POLICY "Auth users can select supplementary quote items"
  ON supplementary_quote_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id));

CREATE POLICY "Auth users can insert supplementary quote items"
  ON supplementary_quote_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id));

CREATE POLICY "Auth users can update supplementary quote items"
  ON supplementary_quote_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id))
  WITH CHECK (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id));

CREATE POLICY "Auth users can delete supplementary quote items"
  ON supplementary_quote_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id));

CREATE POLICY "Anon users can select supplementary quotes"
  ON supplementary_quotes FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id));

CREATE POLICY "Anon users can insert supplementary quotes"
  ON supplementary_quotes FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id));

CREATE POLICY "Anon users can update supplementary quotes"
  ON supplementary_quotes FOR UPDATE TO anon
  USING (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id))
  WITH CHECK (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id));

CREATE POLICY "Anon users can delete supplementary quotes"
  ON supplementary_quotes FOR DELETE TO anon
  USING (EXISTS (SELECT 1 FROM general_repair_orders WHERE general_repair_orders.id = supplementary_quotes.order_id));

CREATE POLICY "Anon users can select supplementary quote items"
  ON supplementary_quote_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id));

CREATE POLICY "Anon users can insert supplementary quote items"
  ON supplementary_quote_items FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id));

CREATE POLICY "Anon users can update supplementary quote items"
  ON supplementary_quote_items FOR UPDATE TO anon
  USING (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id))
  WITH CHECK (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id));

CREATE POLICY "Anon users can delete supplementary quote items"
  ON supplementary_quote_items FOR DELETE TO anon
  USING (EXISTS (SELECT 1 FROM supplementary_quotes WHERE supplementary_quotes.id = supplementary_quote_items.quote_id));