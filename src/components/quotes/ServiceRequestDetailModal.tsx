import { useEffect, useState } from 'react';
import { X, Printer, User, Car, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api/client';
import ServiceRequestPrintTemplate from './ServiceRequestPrintTemplate';
import CreateRepairOrderModal from './CreateRepairOrderModal';

interface ServiceRequestDetailModalProps {
  serviceRequestId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

interface QuoteItem {
  id: string;
  component_name: string;
  symptom: string | null;
  repair_method: string | null;
  part_name: string | null;
  quantity: number;
  unit_price: number;
  labor_cost: number;
  total_amount: number;
}

interface ServiceRequest {
  id: string;
  request_code: string;
  request_date: string;
  start_time: string | null;
  expected_finish_time: string | null;
  total_amount: number;
  status: string;
  customer_signature: string | null;
  created_at: string;
  repair_order_id: string;
  app_users: {
    display_name: string;
  } | null;
  vehicle_repair_orders: {
    ro_code: string;
    odo: number | null;
    fuel_level: number | null;
    customers: {
      name: string;
      phone: string;
    };
    vehicles: {
      license_plate: string;
      name: string;
    };
  };
  vr_quotes: {
    quote_code: string;
    total_amount: number;
  } | null;
}

export default function ServiceRequestDetailModal({ serviceRequestId, onClose, onUpdate }: ServiceRequestDetailModalProps) {
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRepairOrder, setShowCreateRepairOrder] = useState(false);

  useEffect(() => {
    loadServiceRequest();
  }, [serviceRequestId]);

  const loadServiceRequest = async () => {
    try {
      setLoading(true);

      const data = await api.get<{
        serviceRequest: ServiceRequest;
        quoteItems: QuoteItem[];
      }>('api-service-requests', `/${serviceRequestId}`);

      setServiceRequest(data.serviceRequest);
      setItems(data.quoteItems || []);
    } catch (error: any) {
      console.error('Error loading service request:', error);
      alert('Lỗi khi tải chi tiết phiếu yêu cầu dịch vụ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800' },
      confirmed: { label: 'Đã xác nhận', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!serviceRequest) {
    return null;
  }

  const statusInfo = getStatusInfo(serviceRequest.status);

  return (
    <>
      {/* Modal View */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{serviceRequest.request_code}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} mt-1`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(serviceRequest.status === 'sent' || serviceRequest.status === 'draft') && items.length > 0 && (
                <button
                  onClick={() => setShowCreateRepairOrder(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In phiếu
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer and Vehicle Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Thông tin khách hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên khách:</span>
                    <span className="font-medium">{serviceRequest.vehicle_repair_orders.customers.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số điện thoại:</span>
                    <span className="font-medium">{serviceRequest.vehicle_repair_orders.customers.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã hồ sơ:</span>
                    <span className="font-medium">{serviceRequest.vehicle_repair_orders.ro_code}</span>
                  </div>
                  {serviceRequest.vr_quotes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã báo giá:</span>
                      <span className="font-medium">{serviceRequest.vr_quotes.quote_code}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Thông tin xe
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biển số:</span>
                    <span className="font-medium">{serviceRequest.vehicle_repair_orders.vehicles.license_plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên xe:</span>
                    <span className="font-medium">{serviceRequest.vehicle_repair_orders.vehicles.name}</span>
                  </div>
                  {serviceRequest.vehicle_repair_orders.odo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Odo:</span>
                      <span className="font-medium">{serviceRequest.vehicle_repair_orders.odo.toLocaleString()} km</span>
                    </div>
                  )}
                  {serviceRequest.vehicle_repair_orders.fuel_level !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mức nhiên liệu:</span>
                      <span className="font-medium">{serviceRequest.vehicle_repair_orders.fuel_level}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Thời gian thực hiện
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 block mb-1">Ngày làm phiếu:</span>
                  <span className="font-medium">{new Date(serviceRequest.request_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                </div>
                {serviceRequest.start_time && (
                  <div>
                    <span className="text-gray-600 block mb-1">Bắt đầu:</span>
                    <span className="font-medium">{new Date(serviceRequest.start_time).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                  </div>
                )}
                {serviceRequest.expected_finish_time && (
                  <div>
                    <span className="text-gray-600 block mb-1">Dự kiến hoàn thành:</span>
                    <span className="font-medium">{new Date(serviceRequest.expected_finish_time).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Service Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Chi tiết yêu cầu dịch vụ</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">STT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Hạng mục</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Triệu chứng</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phương án sửa chữa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phụ tùng</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">SL</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Không có chi tiết nào
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.component_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.symptom || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.repair_method || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.part_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Tổng tiền:</span>
                <span className="text-2xl font-bold text-green-600">
                  {serviceRequest.total_amount.toLocaleString()} VNĐ
                </span>
              </div>
            </div>

            {/* Footer Info */}
            {serviceRequest.app_users && (
              <div className="text-sm text-gray-600 flex items-center justify-between border-t pt-4">
                <span>Người tạo phiếu: <span className="font-medium text-gray-900">{serviceRequest.app_users.display_name}</span></span>
                <span>Ngày tạo: {new Date(serviceRequest.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Template */}
      <ServiceRequestPrintTemplate
        serviceRequest={serviceRequest}
        items={items}
      />

      {/* Create Repair Order Modal */}
      {showCreateRepairOrder && (
        <CreateRepairOrderModal
          serviceRequest={serviceRequest}
          items={items}
          onClose={() => setShowCreateRepairOrder(false)}
          onSuccess={() => {
            if (onUpdate) onUpdate();
            loadServiceRequest();
          }}
        />
      )}
    </>
  );
}
