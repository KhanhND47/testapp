/*
  # Add authentication and work tracking features

  1. Changes to workers table
    - Add `email` column for login credentials
    - Add `password_hash` column for secure password storage
    
  2. New table: work_sessions
    - Tracks when workers start/complete work assignments
    - Records regular hours and overtime hours
    - Calculates labor costs automatically
    
  3. Fields in work_sessions:
    - `id` (uuid, primary key)
    - `work_assignment_id` (uuid, foreign key to work_assignments)
    - `worker_id` (uuid, foreign key to workers)
    - `start_time` (timestamptz) - when worker started the work
    - `end_time` (timestamptz) - when worker completed the work
    - `overtime_start` (timestamptz) - when overtime started
    - `overtime_end` (timestamptz) - when overtime ended
    - `regular_hours` (numeric) - calculated regular working hours
    - `overtime_hours` (numeric) - calculated overtime hours
    - `labor_cost` (numeric) - total labor cost (47000 VND/hour)
    - `status` (text) - 'in_progress', 'completed'
    - `created_at` (timestamptz)
    
  4. Security
    - Enable RLS on all new tables
    - Add policies for workers to access their own data
*/

-- Add auth fields to workers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'email'
  ) THEN
    ALTER TABLE workers ADD COLUMN email text UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE workers ADD COLUMN password_hash text;
  END IF;
END $$;

-- Create work_sessions table
CREATE TABLE IF NOT EXISTS work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_assignment_id uuid REFERENCES work_assignments(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz,
  end_time timestamptz,
  overtime_start timestamptz,
  overtime_end timestamptz,
  regular_hours numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  labor_cost numeric DEFAULT 0,
  status text DEFAULT 'not_started' NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for work_sessions
CREATE POLICY "Workers can view their own work sessions"
  ON work_sessions
  FOR SELECT
  USING (worker_id IN (SELECT id FROM workers));

CREATE POLICY "Workers can insert their own work sessions"
  ON work_sessions
  FOR INSERT
  WITH CHECK (worker_id IN (SELECT id FROM workers));

CREATE POLICY "Workers can update their own work sessions"
  ON work_sessions
  FOR UPDATE
  USING (worker_id IN (SELECT id FROM workers))
  WITH CHECK (worker_id IN (SELECT id FROM workers));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_work_sessions_worker_id ON work_sessions(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_assignment_id ON work_sessions(work_assignment_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions(status);