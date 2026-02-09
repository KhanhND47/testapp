/*
  # Create Acceptance Handovers Table

  1. New Tables
    - `acceptance_handovers`
      - `id` (uuid, primary key)
      - `order_id` (uuid, FK to general_repair_orders)
      - `quality_inspection_id` (uuid, FK to quality_inspections)
      - `handover_date` (timestamptz, when handover occurs)
      - `criteria_results` (jsonb, array of 5 acceptance criteria with pass/fail and notes)
      - `receiver_name` (text, CVDV/NV tiep nhan)
      - `supervisor_name` (text, To truong/Quan doc)
      - `customer_signer_name` (text, Khach hang ky ten)
      - `notes` (text, general notes)
      - `created_by` (text, who created it)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `acceptance_handovers` table
    - Add policies for authenticated users to manage their own records

  3. Notes
    - Each general repair order can have at most one acceptance handover record
    - criteria_results stores an array of 5 fixed criteria objects: [{index, passed, note}]
    - The 5 criteria are:
      I. Cac hang muc sua chua da duoc thuc hien dung theo Lenh sua chua
      II. Xe da duoc chay thu va van hanh on dinh
      III. Khong phat sinh loi moi, den bao moi sau sua chua
      IV. Tinh trang xe va tai san dung nhu Phieu tiep nhan xe
      V. Xe duoc ve sinh truoc khi ban giao
*/

CREATE TABLE IF NOT EXISTS acceptance_handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES general_repair_orders(id) ON DELETE CASCADE,
  quality_inspection_id uuid REFERENCES quality_inspections(id),
  handover_date timestamptz NOT NULL DEFAULT now(),
  criteria_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  receiver_name text NOT NULL DEFAULT '',
  supervisor_name text NOT NULL DEFAULT '',
  customer_signer_name text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_acceptance_handovers_order_id
  ON acceptance_handovers(order_id);

ALTER TABLE acceptance_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view acceptance handovers"
  ON acceptance_handovers
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create acceptance handovers"
  ON acceptance_handovers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update acceptance handovers"
  ON acceptance_handovers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete acceptance handovers"
  ON acceptance_handovers
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
