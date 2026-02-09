/*
  # Create App Users Authentication System

  1. New Tables
    - `app_users` - Tai khoan dang nhap ung dung
      - `id` (uuid, primary key)
      - `username` (text, unique) - Ten dang nhap
      - `password` (text) - Mat khau (hash)
      - `display_name` (text) - Ten hien thi
      - `role` (text) - Vai tro: admin, worker
      - `worker_id` (uuid, nullable) - Lien ket voi repair_workers neu la tho
      - `is_active` (boolean) - Trang thai hoat dong
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on app_users table
    - Add policies for anonymous access (for login check)

  3. Sample Data
    - Admin account: admin/123
    - Worker account: tho/123
*/

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  worker_id uuid REFERENCES repair_workers(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read app_users for login"
  ON app_users FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous update app_users"
  ON app_users FOR UPDATE TO anon USING (true) WITH CHECK (true);

DO $$
DECLARE
  worker_id_var uuid;
BEGIN
  INSERT INTO repair_workers (name, is_active, salary)
  VALUES ('Tho Sua Chua', true, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO worker_id_var;

  IF worker_id_var IS NULL THEN
    SELECT id INTO worker_id_var FROM repair_workers WHERE name = 'Tho Sua Chua' LIMIT 1;
  END IF;

  INSERT INTO app_users (username, password, display_name, role, worker_id)
  VALUES ('admin', '123', 'Quan Tri Vien', 'admin', NULL)
  ON CONFLICT (username) DO NOTHING;

  INSERT INTO app_users (username, password, display_name, role, worker_id)
  VALUES ('tho', '123', 'Tho Sua Chua', 'worker', worker_id_var)
  ON CONFLICT (username) DO NOTHING;
END $$;

CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);