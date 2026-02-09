/*
  # Add part_id to supplementary quote items

  1. Modified Tables
    - `supplementary_quote_items`: Add `part_id` column (uuid, nullable)
      - References `parts` table for linking inventory parts to quote items
      - Allows tracking which inventory part was selected for each quote line item

  2. Notes
    - part_id is nullable because users can also type free-text part names
    - No cascade delete to preserve quote history if a part is removed from inventory
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplementary_quote_items' AND column_name = 'part_id'
  ) THEN
    ALTER TABLE supplementary_quote_items ADD COLUMN part_id uuid REFERENCES parts(id);
  END IF;
END $$;