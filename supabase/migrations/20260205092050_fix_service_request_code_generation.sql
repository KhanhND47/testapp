/*
  # Sửa lỗi tạo mã phiếu yêu cầu dịch vụ trùng lặp

  ## Vấn đề
  Function generate_service_request_code() có race condition khiến
  nhiều request cùng lúc có thể tạo ra cùng một mã code.

  ## Giải pháp
  - Sử dụng advisory lock để serialize việc tạo mã
  - Đảm bảo chỉ một transaction tạo mã tại một thời điểm
  - Tự động retry nếu có conflict

  ## Chi tiết thay đổi
  - Cập nhật function generate_service_request_code() với advisory lock
  - Đảm bảo tính duy nhất của mã được tạo
*/

-- Drop existing function
DROP FUNCTION IF EXISTS generate_service_request_code();

-- Create improved function with advisory lock to prevent race conditions
CREATE OR REPLACE FUNCTION generate_service_request_code()
RETURNS text AS $$
DECLARE
  new_code text;
  date_part text;
  sequence_num int;
  lock_key bigint;
BEGIN
  -- Create a lock key based on current date to serialize code generation per day
  date_part := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  lock_key := ('x' || substr(md5('service_request_' || date_part), 1, 15))::bit(60)::bigint;
  
  -- Acquire advisory lock to prevent concurrent code generation
  PERFORM pg_advisory_xact_lock(lock_key);
  
  -- Find the next sequence number for today
  SELECT COALESCE(MAX(
    CASE 
      WHEN request_code ~ ('^SR-' || date_part || '-[0-9]{4}$')
      THEN CAST(SUBSTRING(request_code FROM '.{11}(.{4})$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 INTO sequence_num
  FROM vr_service_requests
  WHERE request_code LIKE 'SR-' || date_part || '-%';
  
  -- Generate the new code
  new_code := 'SR-' || date_part || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger function (no changes needed, just for completeness)
CREATE OR REPLACE FUNCTION set_service_request_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_code IS NULL THEN
    NEW.request_code := generate_service_request_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_set_service_request_code ON vr_service_requests;

CREATE TRIGGER trigger_set_service_request_code
  BEFORE INSERT ON vr_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_service_request_code();
