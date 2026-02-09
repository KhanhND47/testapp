/*
  # Sửa RLS policies cho hệ thống hồ sơ xe

  1. Cập nhật policies
    - Cho phép authenticated users insert/update/delete trên tất cả bảng liên quan
    - Đơn giản hóa policies để dễ quản lý

  2. Các bảng cập nhật
    - vehicle_repair_orders
    - intake_requests
    - customers (cập nhật)
    - vehicles (cập nhật)
*/

-- Drop existing restrictive policies and create simpler ones for vehicle_repair_orders
DROP POLICY IF EXISTS "Allow authenticated users to read vehicle repair orders" ON vehicle_repair_orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert vehicle repair orders" ON vehicle_repair_orders;
DROP POLICY IF EXISTS "Allow authenticated users to update vehicle repair orders" ON vehicle_repair_orders;
DROP POLICY IF EXISTS "Allow authenticated users to delete vehicle repair orders" ON vehicle_repair_orders;

CREATE POLICY "Authenticated users can manage vehicle repair orders"
  ON vehicle_repair_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix intake_requests policies
DROP POLICY IF EXISTS "Allow authenticated users to read intake requests" ON intake_requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert intake requests" ON intake_requests;
DROP POLICY IF EXISTS "Allow authenticated users to update intake requests" ON intake_requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete intake requests" ON intake_requests;

CREATE POLICY "Authenticated users can manage intake requests"
  ON intake_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update customers policies to be simpler
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON customers;

CREATE POLICY "Authenticated users can read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Update vehicles policies to be simpler
DROP POLICY IF EXISTS "Allow authenticated users to manage vehicles" ON vehicles;

CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (true);
