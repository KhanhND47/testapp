import { useState } from 'react';
import { X, Wrench, PaintBucket, CheckCircle2, Calendar } from 'lucide-react';
import { api } from '../../lib/api/client';

interface QuoteItem {
  id: string;
  component_name: string;
  symptom: string | null;
  repair_method: string | null;
  part_name: string | null;
  quantity: number;
}

interface ServiceRequest {
  id: string;
  request_code: string;
  repair_order_id: string;
  vehicle_repair_orders: {
    ro_code: string;
    customers: {
      name: string;
      phone: string;
    };
    vehicles: {
      license_plate: string;
      name: string;
    };
  };
}

interface Props {
  serviceRequest: ServiceRequest;
  items: QuoteItem[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemWithType extends QuoteItem {
  repairType: 'sua_chua' | 'dong_son' | null;
}

export default function CreateRepairOrderModal({ serviceRequest, items, onClose, onSuccess }: Props) {
  const [itemsWithTypes, setItemsWithTypes] = useState<ItemWithType[]>(
    items.map(item => ({ ...item, repairType: null }))
  );
  const [receiveDate, setReceiveDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [returnDate, setReturnDate] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [submitting, setSubmitting] = useState(false);

  const setRepairType = (index: number, type: 'sua_chua' | 'dong_son') => {
    const newItems = [...itemsWithTypes];
    newItems[index].repairType = type;
    setItemsWithTypes(newItems);
  };

  const handleSubmit = async () => {
    const selectedItems = itemsWithTypes.filter(item => item.repairType !== null);
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn loại dịch vụ cho ít nhất một hạng mục');
      return;
    }

    if (!receiveDate || !returnDate) {
      alert('Vui lòng nhập ngày nhận và ngày trả xe');
      return;
    }

    if (new Date(returnDate) < new Date(receiveDate)) {
      alert('Ngày trả xe phải sau ngày nhận xe');
      return;
    }

    try {
      setSubmitting(true);

      const result = await api.post<{ roCode: string }>('api-service-requests', `/${serviceRequest.id}/create-repair-order`, {
        items: selectedItems.map((item, index) => ({
          component_name: item.component_name,
          symptom: item.symptom,
          repair_method: item.repair_method,
          part_name: item.part_name,
          repairType: item.repairType,
          order_index: index,
        })),
        receiveDate,
        returnDate,
        repairOrderId: serviceRequest.repair_order_id,
        vehicleInfo: {
          license_plate: serviceRequest.vehicle_repair_orders.vehicles.license_plate,
          vehicle_name: serviceRequest.vehicle_repair_orders.vehicles.name,
          customer_name: serviceRequest.vehicle_repair_orders.customers.name,
          customer_phone: serviceRequest.vehicle_repair_orders.customers.phone,
        },
      });

      alert('Đã tạo lệnh sửa chữa thành công: ' + (result?.roCode || ''));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating repair order:', error);
      alert('Lỗi khi tạo lệnh sửa chữa: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tạo lệnh sửa chữa</h2>
              <p className="text-rose-100 text-sm">{serviceRequest.vehicle_repair_orders.vehicles.license_plate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Thông tin lệnh sửa chữa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày nhận xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày trả xe dự kiến <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Chọn loại dịch vụ cho từng hạng mục
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Chọn "Sửa chữa" hoặc "Đồng sơn" cho mỗi hạng mục. Các hạng mục không được chọn sẽ không được thêm vào lệnh sửa chữa.
            </p>

            <div className="space-y-3">
              {itemsWithTypes.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-rose-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-semibold text-gray-600">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-2">{item.component_name}</h4>
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        {item.symptom && <p>Triệu chứng: {item.symptom}</p>}
                        {item.repair_method && <p>Phương án: {item.repair_method}</p>}
                        {item.part_name && <p>Phụ tùng: {item.part_name}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRepairType(index, 'sua_chua')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            item.repairType === 'sua_chua'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Sửa chữa
                          </div>
                        </button>
                        <button
                          onClick={() => setRepairType(index, 'dong_son')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            item.repairType === 'dong_son'
                              ? 'bg-orange-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <PaintBucket className="w-4 h-4" />
                            Đồng sơn
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Lưu ý:</strong> Sau khi tạo lệnh sửa chữa, phiếu yêu cầu dịch vụ sẽ được đánh dấu là "Đã xác nhận" và lệnh sửa chữa mới sẽ xuất hiện trong danh sách lệnh sửa chữa.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Đã chọn: <span className="font-semibold text-gray-900">{itemsWithTypes.filter(i => i.repairType !== null).length}/{itemsWithTypes.length}</span> hạng mục
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || itemsWithTypes.filter(i => i.repairType !== null).length === 0}
              className="px-6 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Tạo lệnh sửa chữa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
