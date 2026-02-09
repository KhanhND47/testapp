/*
  # Add server time function for synchronization

  1. New Functions
    - `get_server_time()` - Returns current server timestamp in UTC
      - Used to synchronize time between different client devices
      - Ensures work timers display the same duration regardless of device clock settings

  2. Security
    - Function is accessible to all users (anon, authenticated)
    - Only returns current timestamp, no sensitive data exposed
*/

CREATE OR REPLACE FUNCTION get_server_time()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT now();
$$;

GRANT EXECUTE ON FUNCTION get_server_time() TO anon;
GRANT EXECUTE ON FUNCTION get_server_time() TO authenticated;
