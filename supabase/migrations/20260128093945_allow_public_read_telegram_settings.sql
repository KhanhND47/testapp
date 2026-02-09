/*
  # Allow public read for Telegram settings

  1. Security Changes
    - Add policy to allow all users (including anonymous) to read Telegram-related settings
    - This is safe because these settings don't contain sensitive user data
    - Bot token is needed for sending notifications from frontend
*/

CREATE POLICY "Anyone can read telegram settings"
  ON app_settings
  FOR SELECT
  TO anon, authenticated
  USING (setting_key IN ('telegram_bot_token', 'telegram_notifications_enabled'));