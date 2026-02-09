import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { X, CheckCircle, XCircle, User, Car, Calendar, FileText } from 'lucide-react';

interface Inspection {
  id: string;
  inspection_date: string;
  overall_result: string;
  notes: string | null;
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

interface InspectionItem {
  id: string;
  result: string;
  notes: string | null;
  repair_items: {
    name: string;
    description: string | null;
    repair_type: string;
  };
}

interface Props {
  inspection: Inspection;
  onClose: () => void;
}

export default function InspectionReportModal({ inspection, onClose }: Props) {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspectionItems();
  }, [inspection.id]);

  const fetchInspectionItems = async () => {
    try {
      const data = await api.get<InspectionItem[]>('api-quality', `/${inspection.id}/items`);
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching inspection items:', error);
      alert('Lỗi khi tải chi tiết biên bản: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const passCount = items.filter(item => item.result === 'pass').length;
  const failCount = items.filter(item => item.result === 'fail').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className={`px-6 py-4 ${
          inspection.overall_result === 'pass'
            ? 'bg-gradient-to-r from-green-600 to-green-700'
            : 'bg-gradient-to-r from-red-600 to-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Biên Bản Nghiệm Thu Chất Lượng</h2>
              <p className="text-white/90 text-sm mt-1">{inspection.general_repair_orders.ro_code}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`rounded-lg p-4 ${
                inspection.overall_result === 'pass'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {inspection.overall_result === 'pass' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <p className={`text-lg font-semibold ${
                      inspection.overall_result === 'pass' ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {inspection.overall_result === 'pass' ? 'ĐẠT CHẤT LƯỢNG' : 'KHÔNG ĐẠT CHẤT LƯỢNG'}
                    </p>
                    <p className={`text-sm ${
                      inspection.overall_result === 'pass' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {passCount} hạng mục đạt, {failCount} hạng mục không đạt
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>Khách hàng</span>
                  </div>
                  <p className="font-semibold text-gray-900">{inspection.general_repair_orders.customer_name}</p>
                  <p className="text-sm text-gray-600">{inspection.general_repair_orders.customer_phone}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Car className="w-4 h-4" />
                    <span>Thông tin xe</span>
                  </div>
                  <p className="font-semibold text-gray-900">{inspection.general_repair_orders.vehicle_name}</p>
                  <p className="text-sm text-gray-600">{inspection.general_repair_orders.license_plate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Ngày nghiệm thu</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(inspection.inspection_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {inspection.app_users && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>Người kiểm tra</span>
                    </div>
                    <p className="font-semibold text-gray-900">{inspection.app_users.display_name}</p>
                  </div>
                )}
              </div>

              {inspection.notes && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Ghi chú chung</span>
                  </div>
                  <p className="text-gray-900">{inspection.notes}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Chi tiết kết quả kiểm tra</h3>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`rounded-lg p-4 border ${
                        item.result === 'pass'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center font-semibold text-gray-700">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">{item.repair_items.name}</h4>
                              {item.repair_items.description && (
                                <p className="text-sm text-gray-600 mb-2">{item.repair_items.description}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  item.repair_items.repair_type === 'sua_chua'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {item.repair_items.repair_type === 'sua_chua' ? 'Sửa chữa' : 'Đồng sơn'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.result === 'pass' ? (
                                <>
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <span className="font-semibold text-green-700">Đạt</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-5 h-5 text-red-600" />
                                  <span className="font-semibold text-red-700">Không đạt</span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.notes && (
                            <div className="bg-white rounded p-3 mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Ghi chú:</p>
                              <p className="text-sm text-gray-900">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
