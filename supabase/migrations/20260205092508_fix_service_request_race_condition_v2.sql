/*
  # Sửa lỗi race condition khi tạo mã phiếu yêu cầu dịch vụ (v2)

  ## Vấn đề
  Phiên bản trước dùng advisory lock nhưng lock key có thể không
  được tạo đúng cách, gây ra race condition.

  ## Giải pháp cải tiến
  1. Sử dụng advisory lock với key đơn giản và cố định
  2. Thêm retry logic trong function
  3. Đảm bảo serialization hoàn toàn cho việc tạo mã

  ## Chi tiết thay đổi
  - Sử dụng lock key cố định cho tất cả service request
  - Đơn giản hóa logic tạo mã
  - Thêm xử lý lỗi tốt hơn
*/

-- Drop existing function
DROP FUNCTION IF EXISTS generate_service_request_code();

-- Create improved function with simpler advisory lock
CREATE OR REPLACE FUNCTION generate_service_request_code()
RETURNS text AS $$
DECLARE
  new_code text;
  date_part text;
  sequence_num int;
  lock_key bigint := 7890123456789; -- Fixed lock key for service requests
BEGIN
  -- Acquire advisory lock - this will wait if another transaction has the lock
  -- The lock is automatically released at the end of the transaction
  PERFORM pg_advisory_xact_lock(lock_key);
  
  -- Get current date part
  date_part := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  -- Find the highest sequence number for today and increment
  SELECT COALESCE(MAX(
    CASE 
      WHEN request_code ~ ('^SR-' || date_part || '-[0-9]{4}$')
      THEN CAST(SUBSTRING(request_code FROM 12) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 INTO sequence_num
  FROM vr_service_requests
  WHERE request_code LIKE 'SR-' || date_part || '-%';
  
  -- Generate the new code
  new_code := 'SR-' || date_part || '-' || LPAD(sequence_num::text, 4, '0');
  
  -- Verify uniqueness (extra safety check)
  WHILE EXISTS (SELECT 1 FROM vr_service_requests WHERE request_code = new_code) LOOP
    sequence_num := sequence_num + 1;
    new_code := 'SR-' || date_part || '-' || LPAD(sequence_num::text, 4, '0');
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger function
CREATE OR REPLACE FUNCTION set_service_request_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate code if not provided
  IF NEW.request_code IS NULL OR NEW.request_code = '' THEN
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
