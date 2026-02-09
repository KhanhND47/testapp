/*
  # Add username field to workers table

  1. Changes
    - Add `username` column to `workers` table for login
    - Make username unique to prevent duplicates
    - Keep email field optional for contact purposes
    
  2. Purpose
    - Allow workers to login with username instead of email
    - Simplify login process with memorable usernames
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'username'
  ) THEN
    ALTER TABLE workers ADD COLUMN username text UNIQUE;
  END IF;
END $$;