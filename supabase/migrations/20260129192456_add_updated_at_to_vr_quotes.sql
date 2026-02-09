/*
  # Add updated_at column to vr_quotes table

  1. Changes
    - Add `updated_at` column to `vr_quotes` table
    - Set default value to now()
    - Create trigger to auto-update the column on updates

  2. Notes
    - This column is needed for tracking when quotes are modified
*/

-- Add updated_at column
ALTER TABLE vr_quotes 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_vr_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS vr_quotes_updated_at ON vr_quotes;
CREATE TRIGGER vr_quotes_updated_at
  BEFORE UPDATE ON vr_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_vr_quotes_updated_at();
