/*
  # Fix lift_assignments foreign key

  1. Changes
    - Drop existing foreign key to repair_orders table
    - Add new foreign key to general_repair_orders table
  
  2. Reason
    - The application uses general_repair_orders table, not repair_orders
*/

ALTER TABLE lift_assignments
DROP CONSTRAINT IF EXISTS lift_assignments_repair_order_id_fkey;

ALTER TABLE lift_assignments
ADD CONSTRAINT lift_assignments_repair_order_id_fkey
FOREIGN KEY (repair_order_id) REFERENCES general_repair_orders(id) ON DELETE CASCADE;