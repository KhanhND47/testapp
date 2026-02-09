import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { Calendar, User, Car, ClipboardCheck, AlertCircle } from 'lucide-react';
import InspectionModal from './InspectionModal';

interface RepairOrder {
  id: string;
  ro_code: string;
  customer_name: string;
  customer_phone: string;
  vehicle_name: string;
  license_plate: string;
  receive_date: string;
  return_date: string;
  status: string;
  updated_at: string;
}

export default function PendingInspections() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const data = await api.get<RepairOrder[]>('api-quality', '/pending');
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching pending orders:', error);
      alert('Lỗi khi tải danh sách: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = (order: RepairOrder) => {
    setSelectedOrder(order);
    setShowInspectionModal(true);
  };

  const handleInspectionComplete = () => {
    setShowInspectionModal(false);
    setSelectedOrder(null);
    fetchPendingOrders();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có lệnh nào đợi kiểm tra</h3>
        <p className="text-gray-600">Không có lệnh sửa chữa nào hoàn thành và cần nghiệm thu</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Có <span className="font-semibold text-gray-900">{orders.length}</span> lệnh sửa chữa đợi kiểm tra
          </p>
        </div>

        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{order.ro_code}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Cập nhật: {new Date(order.updated_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleInspect(order)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Kiểm Tra
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>Khách hàng</span>
                  </div>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-600">{order.customer_phone}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Car className="w-4 h-4" />
                    <span>Thông tin xe</span>
                  </div>
                  <p className="font-medium text-gray-900">{order.vehicle_name}</p>
                  <p className="text-sm text-gray-600">{order.license_plate}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Tất cả hạng mục sửa chữa đã hoàn thành, cần nghiệm thu chất lượng</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInspectionModal && selectedOrder && (
        <InspectionModal
          order={selectedOrder}
          onClose={() => {
            setShowInspectionModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleInspectionComplete}
        />
      )}
    </>
  );
}
