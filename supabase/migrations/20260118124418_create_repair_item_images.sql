/*
  # Create Repair Item Images Table

  1. New Tables
    - `repair_item_images`
      - `id` (uuid, primary key)
      - `repair_item_id` (uuid, references repair_items)
      - `image_url` (text, base64 encoded image data)
      - `image_type` (text, 'start' or 'complete')
      - `captured_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `repair_item_images` table
    - Add policies for authenticated users to manage their images
*/

CREATE TABLE IF NOT EXISTS repair_item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_item_id uuid NOT NULL REFERENCES repair_items(id) ON DELETE CASCADE,
  image_data text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('start', 'complete')),
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repair_item_images_repair_item_id ON repair_item_images(repair_item_id);
CREATE INDEX IF NOT EXISTS idx_repair_item_images_type ON repair_item_images(image_type);

ALTER TABLE repair_item_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view repair item images"
  ON repair_item_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert repair item images"
  ON repair_item_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete repair item images"
  ON repair_item_images
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anonymous users can view repair item images"
  ON repair_item_images
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert repair item images"
  ON repair_item_images
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete repair item images"
  ON repair_item_images
  FOR DELETE
  TO anon
  USING (true);