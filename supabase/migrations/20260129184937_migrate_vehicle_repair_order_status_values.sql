/*
  # Migrate vehicle_repair_orders status values
  
  1. Changes
    - Update existing records to use new status values
    - Drop old status check constraint
    - Add new status check constraint with updated values
    - Update default value for status column
  
  2. Status Mapping
    - NEW_INTAKE -> received
    - INSPECTION_REQUESTED -> inspecting
    - DIAGNOSIS_DONE -> diagnosed
    - QUOTE_CREATED -> quoted
    - WAIT_CUSTOMER_APPROVAL_QUOTE -> quoted
    - SERVICE_REQUEST_SIGNED -> approved
    - IN_PROGRESS -> in_progress
    - COMPLETED -> completed
  
  3. Notes
    - Migrates all existing data first before applying constraint
    - Status values standardized to lowercase snake_case
*/

-- Drop existing check constraint first
ALTER TABLE vehicle_repair_orders 
DROP CONSTRAINT IF EXISTS vehicle_repair_orders_status_check;

-- Update existing records to new status values
UPDATE vehicle_repair_orders 
SET status = CASE status
  WHEN 'NEW_INTAKE' THEN 'received'
  WHEN 'INSPECTION_REQUESTED' THEN 'inspecting'
  WHEN 'DIAGNOSIS_DONE' THEN 'diagnosed'
  WHEN 'QUOTE_CREATED' THEN 'quoted'
  WHEN 'WAIT_CUSTOMER_APPROVAL_QUOTE' THEN 'quoted'
  WHEN 'SERVICE_REQUEST_SIGNED' THEN 'approved'
  WHEN 'IN_PROGRESS' THEN 'in_progress'
  WHEN 'COMPLETED' THEN 'completed'
  ELSE status
END
WHERE status IN (
  'NEW_INTAKE',
  'INSPECTION_REQUESTED',
  'DIAGNOSIS_DONE',
  'QUOTE_CREATED',
  'WAIT_CUSTOMER_APPROVAL_QUOTE',
  'SERVICE_REQUEST_SIGNED',
  'IN_PROGRESS',
  'COMPLETED'
);

-- Add new check constraint with updated status values
ALTER TABLE vehicle_repair_orders 
ADD CONSTRAINT vehicle_repair_orders_status_check 
CHECK (status IN (
  'received',
  'inspecting',
  'diagnosed',
  'quoted',
  'approved',
  'in_progress',
  'completed',
  'delivered'
));

-- Update default value for status column
ALTER TABLE vehicle_repair_orders 
ALTER COLUMN status SET DEFAULT 'received';
