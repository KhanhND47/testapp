/*
  # Add parts waiting status to lift assignments

  1. Changes
    - Add waiting_for_parts boolean column
    - Add parts_wait_start timestamp column
    - Add parts_wait_end timestamp column
  
  2. Purpose
    - Track when vehicles are waiting for parts
    - Store expected wait duration for parts
*/

ALTER TABLE lift_assignments
ADD COLUMN IF NOT EXISTS waiting_for_parts boolean DEFAULT false;

ALTER TABLE lift_assignments
ADD COLUMN IF NOT EXISTS parts_wait_start timestamptz;

ALTER TABLE lift_assignments
ADD COLUMN IF NOT EXISTS parts_wait_end timestamptz;