/*
  # Thêm các trường cho bảng phiếu yêu cầu dịch vụ
  
  1. Thay đổi (Changes)
    - Thêm cột `request_code` - Mã phiếu dịch vụ (tự động tạo)
    - Thêm cột `status` - Trạng thái phiếu (draft, sent, confirmed, cancelled)
    - Thêm cột `total_amount` - Tổng tiền
    - Thêm cột `created_by` - Người tạo phiếu (foreign key đến app_users)
    
  2. Ghi chú (Notes)
    - Mã phiếu tự động tạo theo format SR-YYMMDD-XXXX
    - Status mặc định là 'draft'
    - Total amount mặc định là 0
*/

-- Add missing columns to vr_service_requests table
DO $$ 
BEGIN
  -- Add request_code column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vr_service_requests' AND column_name = 'request_code'
  ) THEN
    ALTER TABLE vr_service_requests ADD COLUMN request_code text;
  END IF;

  -- Add status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vr_service_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE vr_service_requests ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'cancelled'));
  END IF;

  -- Add total_amount column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vr_service_requests' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE vr_service_requests ADD COLUMN total_amount decimal(15,2) DEFAULT 0;
  END IF;

  -- Add created_by column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vr_service_requests' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE vr_service_requests ADD COLUMN created_by uuid REFERENCES app_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create unique constraint on request_code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vr_service_requests_request_code_unique'
  ) THEN
    ALTER TABLE vr_service_requests ADD CONSTRAINT vr_service_requests_request_code_unique UNIQUE (request_code);
  END IF;
END $$;

-- Create function to generate service request code
CREATE OR REPLACE FUNCTION generate_service_request_code()
RETURNS text AS $$
DECLARE
  new_code text;
  date_part text;
  sequence_num int;
BEGIN
  date_part := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN request_code ~ ('^SR-' || date_part || '-[0-9]{4}$')
      THEN CAST(SUBSTRING(request_code FROM '.{11}(.{4})$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 INTO sequence_num
  FROM vr_service_requests
  WHERE request_code LIKE 'SR-' || date_part || '-%';
  
  new_code := 'SR-' || date_part || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate request_code on insert
CREATE OR REPLACE FUNCTION set_service_request_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_code IS NULL THEN
    NEW.request_code := generate_service_request_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_service_request_code ON vr_service_requests;

CREATE TRIGGER trigger_set_service_request_code
  BEFORE INSERT ON vr_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_service_request_code();

-- Create index on created_by
CREATE INDEX IF NOT EXISTS idx_vr_service_requests_created_by ON vr_service_requests(created_by);