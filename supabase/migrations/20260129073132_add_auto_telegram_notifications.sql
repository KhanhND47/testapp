/*
  # Add Automatic Telegram Notifications

  1. New Tables
    - `telegram_notification_recipients`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the recipient
      - `chat_id` (text) - Telegram chat ID
      - `notification_types` (text[]) - Array of notification types they should receive
        - 'new_repair_order': When a new repair order is created
        - 'new_appointment': When a new appointment is created
      - `is_active` (boolean) - Whether notifications are active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Extensions
    - Enable `http` extension for making HTTP requests from triggers

  3. Functions
    - `send_telegram_notification_via_http`: Function to send notifications via edge function
    - `notify_new_repair_order`: Trigger function for new repair orders
    - `notify_new_appointment`: Trigger function for new appointments

  4. Triggers
    - Trigger on `repair_orders` for INSERT
    - Trigger on `appointments` for INSERT

  5. Security
    - Enable RLS on `telegram_notification_recipients`
    - Admin can view and manage recipients
    - All users can view recipients (read-only)

  6. Initial Data
    - Add Tổ Trưởng Hà Vịnh with chat ID 2088689322
*/

-- Enable http extension
CREATE EXTENSION IF NOT EXISTS http;

-- Create telegram_notification_recipients table
CREATE TABLE IF NOT EXISTS telegram_notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  chat_id text NOT NULL,
  notification_types text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE telegram_notification_recipients ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'telegram_notification_recipients' 
    AND policyname = 'Allow read recipients for authenticated'
  ) THEN
    CREATE POLICY "Allow read recipients for authenticated"
      ON telegram_notification_recipients FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Admin can manage all recipients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'telegram_notification_recipients' 
    AND policyname = 'Admin can manage recipients'
  ) THEN
    CREATE POLICY "Admin can manage recipients"
      ON telegram_notification_recipients FOR ALL
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

-- Insert Tổ Trưởng Hà Vịnh
INSERT INTO telegram_notification_recipients (name, chat_id, notification_types, is_active)
VALUES (
  'Hà Vịnh - Tổ Trưởng',
  '2088689322',
  ARRAY['new_repair_order', 'new_appointment'],
  true
)
ON CONFLICT DO NOTHING;

-- Function to send telegram notification via HTTP to edge function
CREATE OR REPLACE FUNCTION send_telegram_notification_via_http(
  p_chat_ids text[],
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text;
  v_anon_key text;
  v_function_url text;
  v_request_body jsonb;
  v_response http_response;
BEGIN
  -- Get Supabase URL from environment
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  -- If not set, try to get from custom settings or use default
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://your-project.supabase.co'; -- Will be replaced by actual URL
  END IF;
  
  IF v_anon_key IS NULL THEN
    v_anon_key := ''; -- Will use service role key in edge function
  END IF;
  
  -- Build edge function URL
  v_function_url := v_supabase_url || '/functions/v1/send-telegram-notification';
  
  -- Build request body
  v_request_body := jsonb_build_object(
    'chatIds', to_jsonb(p_chat_ids),
    'message', p_message
  );
  
  -- Make HTTP POST request (async, we don't wait for response)
  -- Using perform to ignore the result
  PERFORM http_post(
    v_function_url,
    v_request_body::text,
    'application/json'::text
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send Telegram notification: %', SQLERRM;
END;
$$;

-- Trigger function for new repair orders
CREATE OR REPLACE FUNCTION notify_new_repair_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_ids text[];
  v_message text;
BEGIN
  -- Get all active recipients who want new_repair_order notifications
  SELECT array_agg(chat_id) INTO v_chat_ids
  FROM telegram_notification_recipients
  WHERE is_active = true
  AND 'new_repair_order' = ANY(notification_types);
  
  -- If there are recipients, send notification
  IF array_length(v_chat_ids, 1) > 0 THEN
    v_message := format(
      '🔧 <b>LỆNH SỬA CHỮA MỚI</b>

📋 Mã: <b>%s</b>
🚗 Biển số: <b>%s</b>
👤 Khách hàng: <b>%s</b>
🏷️ Tên xe: <b>%s</b>
📅 Ngày: <b>%s</b>

Vui lòng kiểm tra hệ thống để xem chi tiết.',
      NEW.order_number,
      COALESCE(NEW.license_plate, 'N/A'),
      COALESCE(NEW.customer_name, 'N/A'),
      COALESCE(NEW.vehicle_name, 'N/A'),
      to_char(NEW.created_at, 'DD/MM/YYYY HH24:MI')
    );
    
    -- Send notification
    PERFORM send_telegram_notification_via_http(v_chat_ids, v_message);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for new appointments
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_ids text[];
  v_message text;
  v_service_type_label text;
  v_time_label text;
BEGIN
  -- Get all active recipients who want new_appointment notifications
  SELECT array_agg(chat_id) INTO v_chat_ids
  FROM telegram_notification_recipients
  WHERE is_active = true
  AND 'new_appointment' = ANY(notification_types);
  
  -- If there are recipients, send notification
  IF array_length(v_chat_ids, 1) > 0 THEN
    -- Map service type to Vietnamese label
    v_service_type_label := CASE NEW.service_type
      WHEN 'kiem_tra' THEN 'Kiểm Tra'
      WHEN 'sua_chua' THEN 'Sửa Chữa'
      WHEN 'bao_duong_dong_co' THEN 'Bảo Dưỡng Động Cơ'
      WHEN 'bao_duong_3_buoc' THEN 'Bảo Dưỡng 3 Bước'
      WHEN 'bao_duong' THEN 'Bảo Dưỡng'
      ELSE 'N/A'
    END;
    
    -- Map time to Vietnamese label
    v_time_label := CASE NEW.appointment_time
      WHEN 'morning' THEN 'Sáng'
      WHEN 'afternoon' THEN 'Chiều'
      ELSE 'N/A'
    END;
    
    v_message := format(
      '📅 <b>LỊCH HẸN MỚI</b>

🚗 Biển số: <b>%s</b>
👤 Khách hàng: <b>%s</b>
🏷️ Tên xe: <b>%s</b>
🔧 Loại dịch vụ: <b>%s</b>
📆 Ngày hẹn: <b>%s - %s</b>
📞 SĐT: <b>%s</b>

Vui lòng kiểm tra hệ thống để xem chi tiết.',
      COALESCE(NEW.license_plate, 'N/A'),
      COALESCE(NEW.customer_name, 'N/A'),
      COALESCE(NEW.vehicle_name, 'N/A'),
      v_service_type_label,
      to_char(NEW.appointment_date::date, 'DD/MM/YYYY'),
      v_time_label,
      COALESCE(NEW.phone, 'N/A')
    );
    
    -- Send notification
    PERFORM send_telegram_notification_via_http(v_chat_ids, v_message);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for repair_orders
DROP TRIGGER IF EXISTS trigger_notify_new_repair_order ON repair_orders;
CREATE TRIGGER trigger_notify_new_repair_order
  AFTER INSERT ON repair_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_repair_order();

-- Create trigger for appointments
DROP TRIGGER IF EXISTS trigger_notify_new_appointment ON appointments;
CREATE TRIGGER trigger_notify_new_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment();
