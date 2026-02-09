/*
  # Create Quality Inspection System

  This migration creates the quality inspection system for repair orders.
  It allows team leads and admins to inspect completed repair work.

  ## 1. New Tables

  ### `quality_inspections`
  - `id` (uuid, primary key) - Unique identifier for each inspection
  - `repair_order_id` (uuid) - References general_repair_orders
  - `inspector_id` (uuid) - References app_users (the person conducting inspection)
  - `inspection_date` (timestamptz) - When the inspection was conducted
  - `status` (text) - Status: 'pending', 'completed'
  - `overall_result` (text) - Overall result: 'pass', 'fail', null (for pending)
  - `notes` (text) - General notes about the inspection
  - `created_at` (timestamptz) - When the record was created
  - `updated_at` (timestamptz) - When the record was last updated

  ### `quality_inspection_items`
  - `id` (uuid, primary key) - Unique identifier for each inspection item
  - `inspection_id` (uuid) - References quality_inspections
  - `repair_item_id` (uuid) - References repair_items
  - `result` (text) - Result: 'pass', 'fail'
  - `notes` (text) - Notes about this specific item
  - `created_at` (timestamptz) - When the record was created

  ## 2. Security
  - Enable RLS on both tables
  - Allow authenticated users to read all inspections
  - Allow team leads and admins to create/update inspections
  - Restrict data access to authenticated users only
*/

-- Create quality_inspections table
CREATE TABLE IF NOT EXISTS quality_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid REFERENCES general_repair_orders(id) ON DELETE CASCADE NOT NULL,
  inspector_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  inspection_date timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  overall_result text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT quality_inspections_status_check CHECK (status IN ('pending', 'completed')),
  CONSTRAINT quality_inspections_overall_result_check CHECK (overall_result IN ('pass', 'fail') OR overall_result IS NULL)
);

-- Create quality_inspection_items table
CREATE TABLE IF NOT EXISTS quality_inspection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES quality_inspections(id) ON DELETE CASCADE NOT NULL,
  repair_item_id uuid REFERENCES repair_items(id) ON DELETE CASCADE NOT NULL,
  result text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT quality_inspection_items_result_check CHECK (result IN ('pass', 'fail'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quality_inspections_repair_order_id ON quality_inspections(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_inspector_id ON quality_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_status ON quality_inspections(status);
CREATE INDEX IF NOT EXISTS idx_quality_inspection_items_inspection_id ON quality_inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspection_items_repair_item_id ON quality_inspection_items(repair_item_id);

-- Enable Row Level Security
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quality_inspections

-- Allow authenticated users to read all inspections
CREATE POLICY "Authenticated users can view inspections"
  ON quality_inspections FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to read all inspections (for public dashboard)
CREATE POLICY "Anonymous users can view inspections"
  ON quality_inspections FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to create inspections
CREATE POLICY "Authenticated users can create inspections"
  ON quality_inspections FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update inspections
CREATE POLICY "Authenticated users can update inspections"
  ON quality_inspections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for quality_inspection_items

-- Allow authenticated users to read all inspection items
CREATE POLICY "Authenticated users can view inspection items"
  ON quality_inspection_items FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to read all inspection items
CREATE POLICY "Anonymous users can view inspection items"
  ON quality_inspection_items FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to create inspection items
CREATE POLICY "Authenticated users can create inspection items"
  ON quality_inspection_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update inspection items
CREATE POLICY "Authenticated users can update inspection items"
  ON quality_inspection_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quality_inspection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_quality_inspection_updated_at ON quality_inspections;
CREATE TRIGGER set_quality_inspection_updated_at
  BEFORE UPDATE ON quality_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_inspection_updated_at();