/*
  # Add Work Transfer Tracking

  1. New Tables
    - `repair_item_transfers` - Track work transfers between workers
      - `id` (uuid, primary key)
      - `repair_item_id` (uuid, foreign key to repair_items)
      - `from_worker_id` (uuid, foreign key to repair_workers) - Worker who transferred the work
      - `to_worker_id` (uuid, foreign key to repair_workers) - Worker who received the work
      - `transferred_at` (timestamptz) - When the transfer happened
      - `notes` (text, nullable) - Optional transfer notes
      - `created_at` (timestamptz)

  2. Purpose
    - Track complete history of work transfers
    - Show "Đã chuyển giao" status for workers who transferred their work
    - Allow viewing transfer history for each repair item

  3. Security
    - Enable RLS on new table
    - Add policies for anonymous access

  4. Notes
    - When work is transferred, from_worker's status becomes "transferred"
    - The to_worker becomes the new active worker (worker_id in repair_items)
    - Transfer can only happen when work status is 'in_progress'
*/

CREATE TABLE IF NOT EXISTS repair_item_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_item_id uuid NOT NULL REFERENCES repair_items(id) ON DELETE CASCADE,
  from_worker_id uuid NOT NULL REFERENCES repair_workers(id) ON DELETE CASCADE,
  to_worker_id uuid NOT NULL REFERENCES repair_workers(id) ON DELETE CASCADE,
  transferred_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE repair_item_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read repair_item_transfers"
  ON repair_item_transfers FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert repair_item_transfers"
  ON repair_item_transfers FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update repair_item_transfers"
  ON repair_item_transfers FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous delete repair_item_transfers"
  ON repair_item_transfers FOR DELETE TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_repair_item_transfers_item ON repair_item_transfers(repair_item_id);
CREATE INDEX IF NOT EXISTS idx_repair_item_transfers_from_worker ON repair_item_transfers(from_worker_id);
CREATE INDEX IF NOT EXISTS idx_repair_item_transfers_to_worker ON repair_item_transfers(to_worker_id);