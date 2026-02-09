/*
  # Add Gemini API key setting

  1. Changes
    - Insert a new row in `app_settings` for `gemini_api_key`
    - Used for license plate recognition via Google Gemini API
  
  2. Notes
    - Replaces the previous OpenAI-based plate recognition
    - Users need to add their Gemini API key in Settings
*/

INSERT INTO app_settings (setting_key, setting_value, description)
VALUES ('gemini_api_key', '', 'Google Gemini API key for license plate recognition')
ON CONFLICT (setting_key) DO NOTHING;
