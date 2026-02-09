/*
  # Add Multiple Workers Assignment Support

  1. New Tables
    - `repair_item_assigned_workers` - Junction table for many-to-many relationship
      - `id` (uuid, primary key)
      - `repair_item_id` (uuid, foreign key to repair_items)
      - `worker_id` (uuid, foreign key to repair_workers)
      - `assigned_at` (timestamptz) - When worker was assigned
      - `created_at` (timestamptz)

  2. Changes
    - The existing `worker_id` in `repair_items` table will remain for tracking who is currently working or completed the task
    - `repair_item_assigned_workers` will store all workers assigned to the task

  3. Security
    - Enable RLS on new table
    - Add policies for anonymous access

  4. Notes
    - This allows multiple workers to be assigned to a single repair item
    - When a worker starts work, their ID is set in repair_items.worker_id
    - When completed, the completing worker's ID remains in repair_items.worker_id
*/

CREATE TABLE IF NOT EXISTS repair_item_assigned_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_item_id uuid NOT NULL REFERENCES repair_items(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES repair_workers(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(repair_item_id, worker_id)
);

ALTER TABLE repair_item_assigned_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read repair_item_assigned_workers"
  ON repair_item_assigned_workers FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert repair_item_assigned_workers"
  ON repair_item_assigned_workers FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update repair_item_assigned_workers"
  ON repair_item_assigned_workers FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous delete repair_item_assigned_workers"
  ON repair_item_assigned_workers FOR DELETE TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_repair_item_assigned_workers_item ON repair_item_assigned_workers(repair_item_id);
CREATE INDEX IF NOT EXISTS idx_repair_item_assigned_workers_worker ON repair_item_assigned_workers(worker_id);