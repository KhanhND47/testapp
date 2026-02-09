/*
  # Thêm liên kết giữa inspection_request_items và intake_requests
  
  1. Thay đổi (Changes)
    - Thêm cột `intake_request_id` vào bảng `inspection_request_items`
    - Tạo foreign key constraint liên kết đến bảng `intake_requests`
    - Tạo index cho cột mới để tăng tốc độ truy vấn
  
  2. Mục đích (Purpose)
    - Lưu lại nguồn gốc của hạng mục kiểm tra (từ yêu cầu tiếp nhận nào)
    - Giúp lọc ra các hạng mục đã/chưa được tạo phiếu kiểm tra
    - Tránh trùng lặp khi tạo báo giá
  
  3. Ghi chú (Notes)
    - Cột này có thể NULL vì có thể có hạng mục kiểm tra không phải từ intake_requests
    - Các bản ghi cũ sẽ có giá trị NULL
*/

-- Add intake_request_id column to inspection_request_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspection_request_items' 
    AND column_name = 'intake_request_id'
  ) THEN
    ALTER TABLE inspection_request_items 
    ADD COLUMN intake_request_id uuid REFERENCES intake_requests(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inspection_items_intake_request_id 
  ON inspection_request_items(intake_request_id);
