/*
  # Tự động cập nhật trạng thái hồ sơ xe sau nghiệm thu

  ## Mô tả
  Sau khi nghiệm thu chất lượng (quality inspection) hoàn thành,
  trạng thái của hồ sơ xe (general_repair_orders) sẽ tự động được
  cập nhật sang "completed" (hoàn thành).

  ## Chi tiết thay đổi
  1. Tạo function để cập nhật trạng thái repair order
  2. Tạo trigger chạy khi quality inspection được tạo/cập nhật với status='completed'
  3. Chỉ cập nhật nếu inspection có overall_result='pass'
  
  ## Luồng hoạt động
  - Khi quality_inspections.status = 'completed' và overall_result = 'pass'
  - Tự động cập nhật general_repair_orders.status = 'completed'
  - Ghi lại thời điểm cập nhật vào updated_at

  ## Ghi chú
  - Chỉ cập nhật khi inspection hoàn tất và đạt chất lượng
  - Không cập nhật nếu inspection fail (cần sửa lại)
*/

-- Create function to update repair order status after inspection
CREATE OR REPLACE FUNCTION update_repair_order_after_inspection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if inspection is completed and passed
  IF NEW.status = 'completed' AND NEW.overall_result = 'pass' THEN
    UPDATE general_repair_orders
    SET 
      status = 'completed',
      updated_at = now()
    WHERE id = NEW.repair_order_id
    AND status != 'completed'; -- Only update if not already completed
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after quality inspection insert or update
DROP TRIGGER IF EXISTS trigger_update_repair_order_after_inspection ON quality_inspections;

CREATE TRIGGER trigger_update_repair_order_after_inspection
  AFTER INSERT OR UPDATE ON quality_inspections
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.overall_result = 'pass')
  EXECUTE FUNCTION update_repair_order_after_inspection();
