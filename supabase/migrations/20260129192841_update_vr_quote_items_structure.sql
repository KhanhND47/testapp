/*
  # Update vr_quote_items table structure

  1. Changes
    - Add missing columns to match the application requirements:
      - diagnosis_item_id (references diagnosis_lines)
      - component_name
      - symptom
      - diagnosis_result
      - repair_method
      - part_name
      - quantity
      - labor_cost
      - total_amount
      - order_index
    - Keep existing columns for backward compatibility

  2. Notes
    - This migration adds columns without removing existing ones
    - Applications can use either old or new column names
    - diagnosis_item_id references diagnosis_lines.id
*/

-- Add new columns to vr_quote_items
ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS diagnosis_item_id uuid REFERENCES diagnosis_lines(id) ON DELETE SET NULL;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS component_name text;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS symptom text;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS diagnosis_result text;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS repair_method text;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS part_name text;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS quantity decimal(10,2) DEFAULT 1;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS labor_cost decimal(15,2) DEFAULT 0;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS total_amount decimal(15,2) DEFAULT 0;

ALTER TABLE vr_quote_items 
ADD COLUMN IF NOT EXISTS order_index int DEFAULT 0;

-- Create index for order_index
CREATE INDEX IF NOT EXISTS idx_vr_quote_items_order_index ON vr_quote_items(quote_id, order_index);
