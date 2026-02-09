/*
  # Create Repair Schedule System

  1. New Tables
    - `repair_lifts` - Stores lift/bay information (Cau 1, 2, 3)
      - `id` (uuid, primary key)
      - `name` (text) - Display name of the lift
      - `position` (int) - Order position
      - `is_active` (boolean) - Whether lift is available
    
    - `lift_assignments` - Tracks vehicle assignments to lifts
      - `id` (uuid, primary key)
      - `repair_order_id` (uuid, FK to repair_orders)
      - `lift_id` (uuid, FK to repair_lifts, nullable for queue)
      - `scheduled_start` (timestamptz) - Scheduled start time on lift
      - `scheduled_end` (timestamptz) - Scheduled end time on lift
      - `queue_position` (int) - Position in queue for this lift
      - `status` (text) - 'queued', 'on_lift', 'completed'
      - `created_at`, `updated_at`
  
  2. Changes to repair_orders
    - Add `waiting_parts_start` (timestamptz) - Parts waiting start time
    - Add `waiting_parts_end` (timestamptz) - Parts waiting end time

  3. Security
    - Enable RLS on all new tables
    - Add policies for admin and worker_lead access
*/

CREATE TABLE IF NOT EXISTS repair_lifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO repair_lifts (name, position) VALUES
  ('Cau So 1', 1),
  ('Cau So 2', 2),
  ('Cau So 3', 3)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS lift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  lift_id uuid REFERENCES repair_lifts(id) ON DELETE SET NULL,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  queue_position int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'on_lift', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(repair_order_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_orders' AND column_name = 'waiting_parts_start'
  ) THEN
    ALTER TABLE repair_orders ADD COLUMN waiting_parts_start timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_orders' AND column_name = 'waiting_parts_end'
  ) THEN
    ALTER TABLE repair_orders ADD COLUMN waiting_parts_end timestamptz;
  END IF;
END $$;

ALTER TABLE repair_lifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and worker_lead can view lifts"
  ON repair_lifts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'worker_lead')
      AND app_users.is_active = true
    )
  );

CREATE POLICY "Admin can manage lifts"
  ON repair_lifts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'admin'
      AND app_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'admin'
      AND app_users.is_active = true
    )
  );

CREATE POLICY "Admin and worker_lead can view lift assignments"
  ON lift_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'worker_lead')
      AND app_users.is_active = true
    )
  );

CREATE POLICY "Admin and worker_lead can insert lift assignments"
  ON lift_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'worker_lead')
      AND app_users.is_active = true
    )
  );

CREATE POLICY "Admin and worker_lead can update lift assignments"
  ON lift_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'worker_lead')
      AND app_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'worker_lead')
      AND app_users.is_active = true
    )
  );

CREATE POLICY "Admin and worker_lead can delete lift assignments"
  ON lift_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'worker_lead')
      AND app_users.is_active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_lift_assignments_repair_order ON lift_assignments(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_lift_assignments_lift ON lift_assignments(lift_id);
CREATE INDEX IF NOT EXISTS idx_lift_assignments_status ON lift_assignments(status);
CREATE INDEX IF NOT EXISTS idx_lift_assignments_scheduled ON lift_assignments(scheduled_start, scheduled_end);