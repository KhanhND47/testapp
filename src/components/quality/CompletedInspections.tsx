import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { Calendar, User, Car, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import InspectionReportModal from './InspectionReportModal';

interface Inspection {
  id: string;
  inspection_date: string;
  overall_result: string;
  notes: string | null;
  repair_order_id: string;
  general_repair_orders: {
    ro_code: string;
    customer_name: string;
    customer_phone: string;
    vehicle_name: string;
    license_plate: string;
  };
  app_users: {
    display_name: string;
  } | null;
}

export default function CompletedInspections() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchCompletedInspections();
  }, []);

  const fetchCompletedInspections = async () => {
    try {
      setLoading(true);
      const data = await api.get<Inspection[]>('api-quality', '/completed');
      setInspections(data || []);
    } catch (error: any) {
      console.error('Error fetching completed inspections:', error);
      alert('Lỗi khi tải danh sách: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowReportModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách...</p>
        </div>
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có biên bản nghiệm thu</h3>
        <p className="text-gray-600">Các biên bản nghiệm thu sẽ xuất hiện ở đây</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Có <span className="font-semibold text-gray-900">{inspections.length}</span> biên bản nghiệm thu
          </p>
        </div>

        <div className="grid gap-4">
          {inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    inspection.overall_result === 'pass'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}>
                    {inspection.overall_result === 'pass' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {inspection.general_repair_orders.ro_code}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        inspection.overall_result === 'pass'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {inspection.overall_result === 'pass' ? 'Đạt chất lượng' : 'Không đạt'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Nghiệm thu: {new Date(inspection.inspection_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                      </div>
                      {inspection.app_users && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Người kiểm tra: {inspection.app_users.display_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleViewReport(inspection)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Xem Biên Bản
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>Khách hàng</span>
                  </div>
                  <p className="font-medium text-gray-900">{inspection.general_repair_orders.customer_name}</p>
                  <p className="text-sm text-gray-600">{inspection.general_repair_orders.customer_phone}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Car className="w-4 h-4" />
                    <span>Thông tin xe</span>
                  </div>
                  <p className="font-medium text-gray-900">{inspection.general_repair_orders.vehicle_name}</p>
                  <p className="text-sm text-gray-600">{inspection.general_repair_orders.license_plate}</p>
                </div>
              </div>

              {inspection.notes && (
                <div className="mt-4 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Ghi chú:</p>
                  <p className="text-sm text-gray-600">{inspection.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showReportModal && selectedInspection && (
        <InspectionReportModal
          inspection={selectedInspection}
          onClose={() => {
            setShowReportModal(false);
            setSelectedInspection(null);
          }}
        />
      )}
    </>
  );
}
