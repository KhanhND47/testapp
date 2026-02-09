/*
  # Create Appointments System

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `license_plate` (text) - Biển số xe
      - `customer_name` (text) - Tên khách hàng
      - `vehicle_name` (text) - Tên xe
      - `phone` (text, optional) - Số điện thoại
      - `appointment_date` (date) - Ngày hẹn
      - `appointment_time` (text, optional) - Giờ hẹn (Sáng/Chiều)
      - `expected_return_date` (date) - Ngày trả xe dự kiến
      - `service_type` (text) - Loại sửa chữa (kiem_tra, sua_chua, bao_duong_dong_co, bao_duong_3_buoc, bao_duong)
      - `status` (text) - Trạng thái (pending, cancelled, converted)
      - `notes` (text, optional) - Ghi chú
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `appointments` table
    - Add policies for authenticated users to manage appointments
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL,
  customer_name text NOT NULL,
  vehicle_name text NOT NULL,
  phone text,
  appointment_date date NOT NULL,
  appointment_time text DEFAULT 'morning',
  expected_return_date date NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('kiem_tra', 'sua_chua', 'bao_duong_dong_co', 'bao_duong_3_buoc', 'bao_duong')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'converted')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_license_plate ON appointments(license_plate);