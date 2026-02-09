/*
  # Add Repair Item Hierarchy and Types

  1. Changes to `repair_items` table
    - `parent_id` (uuid, nullable) - references parent repair item for sub-items
    - `repair_type` (text, nullable) - type tag like 'sua_chua', 'dong_son'

  2. Notes
    - Parent items can have child items (sub-items)
    - When all sub-items are completed, parent should be marked complete
    - Progress calculation includes sub-items
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_items' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE repair_items ADD COLUMN parent_id uuid REFERENCES repair_items(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_items' AND column_name = 'repair_type'
  ) THEN
    ALTER TABLE repair_items ADD COLUMN repair_type text CHECK (repair_type IN ('sua_chua', 'dong_son'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_repair_items_parent_id ON repair_items(parent_id);