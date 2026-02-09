/*
  # Add Worker Type and Lead Roles

  1. Changes to `repair_workers` table
    - Add `worker_type` column with values 'repair' or 'paint'
    - Default existing workers to 'repair' type
    - Add 3 new sample workers (1 paint, 1 paint_lead's worker, 1 worker_lead's worker)

  2. New Roles
    - Add 'paint' role for paint workers
    - Add 'paint_lead' role for paint team leader
    - Add 'worker_lead' role for repair team leader

  3. New User Accounts
    - Create accounts for paint worker, paint lead, and worker lead
    - Link accounts to their respective workers

  4. Security
    - Maintain existing RLS policies
    - New roles inherit appropriate permissions
*/

-- Add worker_type column to repair_workers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_workers' AND column_name = 'worker_type'
  ) THEN
    ALTER TABLE repair_workers ADD COLUMN worker_type text NOT NULL DEFAULT 'repair';
    
    -- Add check constraint
    ALTER TABLE repair_workers ADD CONSTRAINT repair_workers_worker_type_check 
      CHECK (worker_type IN ('repair', 'paint'));
  END IF;
END $$;

-- Update existing workers to 'repair' type
UPDATE repair_workers SET worker_type = 'repair' WHERE worker_type IS NULL OR worker_type = 'repair';

-- Update app_users role check constraint FIRST before inserting new data
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
  CHECK (role IN ('admin', 'worker', 'paint', 'paint_lead', 'worker_lead'));

-- Insert 3 new sample workers
DO $$
DECLARE
  paint_worker_id uuid;
  paint_lead_worker_id uuid;
  repair_lead_worker_id uuid;
BEGIN
  -- Insert paint worker
  INSERT INTO repair_workers (name, salary, is_active, worker_type)
  VALUES ('Nguyen Van Son', 8000000, true, 'paint')
  RETURNING id INTO paint_worker_id;

  -- Insert paint lead's worker profile
  INSERT INTO repair_workers (name, salary, is_active, worker_type)
  VALUES ('Tran Thi Hong', 12000000, true, 'paint')
  RETURNING id INTO paint_lead_worker_id;

  -- Insert repair lead's worker profile
  INSERT INTO repair_workers (name, salary, is_active, worker_type)
  VALUES ('Le Van Cuong', 12000000, true, 'repair')
  RETURNING id INTO repair_lead_worker_id;

  -- Create user account for paint worker (password: 123456)
  INSERT INTO app_users (username, password, display_name, role, worker_id)
  VALUES (
    'thoson1',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Nguyen Van Son',
    'paint',
    paint_worker_id
  );

  -- Create user account for paint lead (password: 123456)
  INSERT INTO app_users (username, password, display_name, role, worker_id)
  VALUES (
    'totrson',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Tran Thi Hong',
    'paint_lead',
    paint_lead_worker_id
  );

  -- Create user account for repair lead (password: 123456)
  INSERT INTO app_users (username, password, display_name, role, worker_id)
  VALUES (
    'totrsuachua',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Le Van Cuong',
    'worker_lead',
    repair_lead_worker_id
  );
END $$;
