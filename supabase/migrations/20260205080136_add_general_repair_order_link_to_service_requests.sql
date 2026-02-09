/*
  # Add General Repair Order Link to Service Requests

  This migration adds a link between service requests and general repair orders
  to track which repair order was created from each service request.

  1. Changes
    - Add `general_repair_order_id` column to `vr_service_requests` table
    - Add foreign key constraint to ensure data integrity
    - Add index for better query performance

  2. Purpose
    - Track which repair order (general_repair_orders) was created from each service request
    - Enable display of created repair order information in vehicle record progress
*/

-- Add general_repair_order_id column to vr_service_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vr_service_requests' AND column_name = 'general_repair_order_id'
  ) THEN
    ALTER TABLE vr_service_requests 
    ADD COLUMN general_repair_order_id uuid REFERENCES general_repair_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_vr_service_requests_general_repair_order_id 
ON vr_service_requests(general_repair_order_id);