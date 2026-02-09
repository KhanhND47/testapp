/*
  # Add Telegram Notification System

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique) - Unique identifier for each setting
      - `setting_value` (text) - Value of the setting
      - `description` (text) - Description of what this setting does
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `telegram_chat_id` column to `repair_workers` table
      - Stores the Telegram chat ID for each worker to receive notifications

  3. Security
    - Enable RLS on `app_settings` table
    - Only admin users can view and modify app settings
    - All authenticated users can view their own worker's telegram_chat_id
    - Admin can update any worker's telegram_chat_id

  4. Initial Data
    - Insert default telegram_bot_token setting (empty by default)
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text DEFAULT '',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admin can view all settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' 
    AND policyname = 'Admin can view all settings'
  ) THEN
    CREATE POLICY "Admin can view all settings"
      ON app_settings FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'admin'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Admin can update all settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' 
    AND policyname = 'Admin can update all settings'
  ) THEN
    CREATE POLICY "Admin can update all settings"
      ON app_settings FOR UPDATE
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
  END IF;
END $$;

-- Admin can insert settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' 
    AND policyname = 'Admin can insert settings'
  ) THEN
    CREATE POLICY "Admin can insert settings"
      ON app_settings FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'admin'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Add telegram_chat_id to repair_workers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_workers' AND column_name = 'telegram_chat_id'
  ) THEN
    ALTER TABLE repair_workers ADD COLUMN telegram_chat_id text DEFAULT NULL;
  END IF;
END $$;

-- Insert default telegram bot token setting
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES (
  'telegram_bot_token',
  '',
  'Bot token from Telegram BotFather for sending notifications'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default telegram notification enabled setting
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES (
  'telegram_notifications_enabled',
  'false',
  'Enable or disable Telegram notifications'
)
ON CONFLICT (setting_key) DO NOTHING;