import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { X, FileText, ClipboardCheck, AlertTriangle, DollarSign, Wrench, CheckCircle, Check, FilePlus, Receipt, ChevronRight } from 'lucide-react';
import { InspectionRequestModal } from './InspectionRequestModal';
import ServiceRequestFormModal from '../quotes/ServiceRequestFormModal';
import SupplementarySlipDetailModal from '../repairs/SupplementarySlipDetailModal';
import SupplementaryQuoteDetailModal from '../repairs/SupplementaryQuoteDetailModal';

interface VehicleRecordDetailModalProps {
  orderId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface RepairOrderDetail {
  id: string;
  ro_code: string;
  status: string;
  received_at: string;
  odo: number | null;
  fuel_level: string | null;
  quote_intent: boolean;
  need_inspection: boolean;
  customers: {
    name: string;
    phone: string;
    company_name: string | null;
    tax_id: string | null;
    address: string | null;
  } | null;
  vehicles: {
    name: string;
    model_year: string | null;
    license_plate: string;
    vin: string | null;
  } | null;
}

interface IntakeRequest {
  id: string;
  request_content: string;
  suggested_service: string | null;
  sort_order: number;
}

interface InspectionRequest {
  id: string;
  check_start_time: string | null;
  expected_result_time: string | null;
  created_at: string;
  inspection_request_items: {
    check_content: string;
    estimated_hours: number;
    note: string | null;
    technician_id: string | null;
    app_users: {
      display_name: string;
    } | null;
  }[];
}

interface DiagnosisReport {
  id: string;
  diagnosis_date: string;
  created_at: string;
  app_users: {
    display_name: string;
  } | null;
  diagnosis_lines: {
    part_system: string | null;
    symptom: string | null;
    diagnosis: string | null;
    repair_plan: string | null;
    parts_materials: string | null;
    qty: number | null;
    sort_order: number;
  }[];
}

interface Quote {
  id: string;
  quote_code: string;
  quote_date: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  created_at: string;
  app_users: {
    display_name: string;
  } | null;
}

interface QuoteItem {
  id: string;
  component_name: string | null;
  symptom: string | null;
  diagnosis_result: string | null;
  repair_method: string | null;
  part_name: string | null;
  quantity: number;
  unit_price: number;
  labor_cost: number;
  total_amount: number;
  order_index: number;
}

interface ServiceRequest {
  id: string;
  request_code: string;
  request_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  general_repair_order_id: string | null;
  general_repair_orders: {
    ro_code: string;
    status: string;
    receive_date: string;
    return_date: string;
  } | null;
  app_users: {
    display_name: string;
  } | null;
}

interface SupplementarySlipSummary {
  id: string;
  diagnosis_date: string;
  status: string;
  created_by: string;
  created_at: string;
  item_count: number;
}

interface SupplementaryQuoteSummary {
  id: string;
  quote_date: string;
  total_amount: number;
  status: string;
  created_by: string;
  created_at: string;
  item_count: number;
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: any }> = {
  received: { label: 'Đã tiếp nhận', color: 'bg-blue-100 text-blue-800', icon: FileText },
  inspecting: { label: 'Đang kiểm tra', color: 'bg-yellow-100 text-yellow-800', icon: ClipboardCheck },
  diagnosed: { label: 'Đã chẩn đoán - Chờ báo giá', color: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
  quoted: { label: 'Đã báo giá', color: 'bg-orange-100 text-orange-800', icon: DollarSign },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  in_progress: { label: 'Đang sửa chữa', color: 'bg-indigo-100 text-indigo-800', icon: Wrench },
  completed: { label: 'Hoàn thành', color: 'bg-teal-100 text-teal-800', icon: CheckCircle },
  delivered: { label: 'Đã giao xe', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

export function VehicleRecordDetailModal({ orderId, onClose, onUpdate }: VehicleRecordDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState<RepairOrderDetail | null>(null);
  const [intakeRequests, setIntakeRequests] = useState<IntakeRequest[]>([]);
  const [inspectionRequests, setInspectionRequests] = useState<InspectionRequest[]>([]);
  const [diagnosisReports, setDiagnosisReports] = useState<DiagnosisReport[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteItems, setQuoteItems] = useState<{ [quoteId: string]: QuoteItem[] }>({});
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [selectedQuoteForService, setSelectedQuoteForService] = useState<Quote | null>(null);
  const [supplementarySlips, setSupplementarySlips] = useState<SupplementarySlipSummary[]>([]);
  const [supplementaryQuotes, setSupplementaryQuotes] = useState<SupplementaryQuoteSummary[]>([]);
  const [generalRepairOrderId, setGeneralRepairOrderId] = useState<string | null>(null);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);
  const [selectedSupQuoteId, setSelectedSupQuoteId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const detail = await api.get<{
        order: RepairOrderDetail;
        intakeRequests: IntakeRequest[];
        inspectionRequests: InspectionRequest[];
        diagnosisReports: DiagnosisReport[];
        quotes: Quote[];
        quoteItems: { [quoteId: string]: QuoteItem[] };
        serviceRequests: ServiceRequest[];
        generalRepairOrderId: string | null;
        supplementarySlips: SupplementarySlipSummary[];
        supplementaryQuotes: SupplementaryQuoteSummary[];
      }>('api-vehicles', `/${orderId}/detail`);

      setOrderDetail(detail.order);
      setIntakeRequests(detail.intakeRequests || []);
      setInspectionRequests(detail.inspectionRequests || []);
      setDiagnosisReports(detail.diagnosisReports || []);
      setQuotes(detail.quotes || []);
      setQuoteItems(detail.quoteItems || {});
      setServiceRequests(detail.serviceRequests || []);
      setGeneralRepairOrderId(detail.generalRepairOrderId);
      setSupplementarySlips(detail.supplementarySlips || []);
      setSupplementaryQuotes(detail.supplementaryQuotes || []);
    } catch (error: any) {
      console.error('Error fetching order detail:', error);
      alert('Lỗi khi tải chi tiết hồ sơ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspectionRequest = () => {
    setShowInspectionModal(true);
  };

  const handleApproveQuote = async (quote: Quote) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt báo giá này?')) {
      return;
    }

    try {
      await api.put('api-vehicles', `/${orderId}/approve-quote`, { quoteId: quote.id });

      alert('Đã duyệt báo giá thành công!');
      fetchOrderDetail();
      onUpdate();
    } catch (error: any) {
      console.error('Error approving quote:', error);
      alert('Lỗi khi duyệt báo giá: ' + error.message);
    }
  };

  const handleCreateServiceRequest = (quote: Quote) => {
    setSelectedQuoteForService(quote);
    setShowServiceRequestModal(true);
  };

  if (loading || !orderDetail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <p className="text-gray-600">Đang tải chi tiết...</p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_INFO[orderDetail.status] || { label: orderDetail.status, color: 'bg-gray-100 text-gray-800', icon: FileText };

  return (
    <>
      <div className="fullscreen-modal">
        <div className="w-full h-full flex flex-col bg-white">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
            <button onClick={onClose} className="w-14 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="font-bold text-white truncate">{orderDetail.ro_code}</h2>
            </div>
            <div className="w-14 flex items-center justify-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="p-4 pb-safe-bottom overflow-y-auto flex-1">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên khách:</span>
                      <span className="font-medium text-gray-900">{orderDetail.customers?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số điện thoại:</span>
                      <span className="font-medium text-gray-900">{orderDetail.customers?.phone}</span>
                    </div>
                    {orderDetail.customers?.company_name && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Công ty:</span>
                          <span className="font-medium text-gray-900">{orderDetail.customers.company_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">MST:</span>
                          <span className="font-medium text-gray-900">{orderDetail.customers.tax_id}</span>
                        </div>
                      </>
                    )}
                    {orderDetail.customers?.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Địa chỉ:</span>
                        <span className="font-medium text-gray-900 text-right">{orderDetail.customers.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-gray-600">Ngày tiếp nhận:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(orderDetail.received_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin xe</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên xe:</span>
                      <span className="font-medium text-gray-900">{orderDetail.vehicles?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đời xe:</span>
                      <span className="font-medium text-gray-900">{orderDetail.vehicles?.model_year || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biển số:</span>
                      <span className="font-medium text-gray-900">{orderDetail.vehicles?.license_plate}</span>
                    </div>
                    {orderDetail.vehicles?.vin && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số VIN:</span>
                        <span className="font-medium text-gray-900">{orderDetail.vehicles.vin}</span>
                      </div>
                    )}
                    {orderDetail.odo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">ODO:</span>
                        <span className="font-medium text-gray-900">{orderDetail.odo.toLocaleString()} km</span>
                      </div>
                    )}
                    {orderDetail.fuel_level && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mức nhiên liệu:</span>
                        <span className="font-medium text-gray-900">{orderDetail.fuel_level}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">BM-01: Phiếu Tiếp Nhận Yêu Cầu</h3>
                </div>
                {intakeRequests.length === 0 ? (
                  <p className="text-sm text-gray-600">Chưa có yêu cầu nào</p>
                ) : (
                  <div className="space-y-2">
                    {intakeRequests.map((request, idx) => (
                      <div key={request.id} className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="flex gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{request.request_content}</p>
                            {request.suggested_service && (
                              <p className="text-xs text-gray-600 mt-1">Đề xuất: {request.suggested_service}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">BM-02: Phiếu Yêu Cầu Kiểm Tra</h3>
                  {orderDetail.status === 'received' && inspectionRequests.length === 0 && (
                    <button
                      onClick={handleCreateInspectionRequest}
                      className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Tạo Phiếu Kiểm Tra
                    </button>
                  )}
                </div>

                {inspectionRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Chưa tạo phiếu yêu cầu kiểm tra</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inspectionRequests.map((inspection) => (
                      <div key={inspection.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                        <div className="space-y-2 mb-3 text-sm">
                          <div>
                            <span className="text-gray-600">Thời gian bắt đầu KT:</span>
                            <p className="font-medium text-gray-900">
                              {inspection.check_start_time ? new Date(inspection.check_start_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chua phan cong'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Dự kiến phản hồi KQ:</span>
                            <p className="font-medium text-gray-900">
                              {inspection.expected_result_time ? new Date(inspection.expected_result_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chua phan cong'}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-yellow-200 pt-3">
                          <p className="text-sm font-medium text-gray-900 mb-2">Nội dung yêu cầu kiểm tra:</p>
                          <div className="space-y-2">
                            {inspection.inspection_request_items.map((item, idx) => (
                              <div key={idx} className="bg-yellow-50 rounded p-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="flex-shrink-0 w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-gray-900">{item.check_content}</p>
                                    <div className="flex gap-4 mt-1 text-xs text-gray-600">
                                      <span>Thời gian: {item.estimated_hours}h</span>
                                      <span>KTV: {item.app_users?.display_name || '-'}</span>
                                    </div>
                                    {item.note && (
                                      <p className="text-xs text-gray-600 mt-1">Ghi chú: {item.note}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">BM-05: Phiếu Chẩn Đoán</h3>
                </div>

                {diagnosisReports.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Chưa có phiếu chẩn đoán</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnosisReports.map((report) => (
                      <div key={report.id} className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-sm">
                            <span className="text-gray-600">Kỹ thuật viên:</span>
                            <p className="font-medium text-gray-900">{report.app_users?.display_name || '-'}</p>
                          </div>
                          <div className="text-sm text-right">
                            <span className="text-gray-600">Ngày chẩn đoán:</span>
                            <p className="font-medium text-gray-900">
                              {new Date(report.diagnosis_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-purple-200 pt-3">
                          <p className="text-sm font-medium text-gray-900 mb-2">Kết quả chẩn đoán:</p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-purple-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">STT</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Hạng Mục</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Triệu Chứng</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Chẩn Đoán</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Phương Án</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Vật Tư</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">SL</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {report.diagnosis_lines
                                  .sort((a, b) => a.sort_order - b.sort_order)
                                  .map((line, idx) => (
                                    <tr key={idx} className="hover:bg-purple-50">
                                      <td className="px-3 py-2 text-gray-900">{idx + 1}</td>
                                      <td className="px-3 py-2 text-gray-900">{line.part_system || '-'}</td>
                                      <td className="px-3 py-2 text-gray-900">{line.symptom || '-'}</td>
                                      <td className="px-3 py-2 text-gray-900">{line.diagnosis || '-'}</td>
                                      <td className="px-3 py-2 text-gray-900">{line.repair_plan || '-'}</td>
                                      <td className="px-3 py-2 text-gray-900">{line.parts_materials || '-'}</td>
                                      <td className="px-3 py-2 text-center text-gray-900">{line.qty || '-'}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">BM-06: Phiếu Báo Giá</h3>
                </div>

                {quotes.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Chưa có phiếu báo giá</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((quote) => {
                      const statusLabels: Record<string, { label: string; color: string }> = {
                        draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
                        sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800' },
                        approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
                        rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
                      };
                      const statusInfo = statusLabels[quote.status] || { label: quote.status, color: 'bg-gray-100 text-gray-800' };
                      const items = quoteItems[quote.id] || [];

                      return (
                        <div key={quote.id} className="bg-white rounded-lg p-4 border border-orange-200">
                          <div className="flex justify-between items-start mb-3">
                            <div className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">Mã báo giá: {quote.quote_code}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              {quote.app_users && (
                                <p className="text-gray-600">Người tạo: {quote.app_users.display_name}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm text-right">
                                <span className="text-gray-600">Ngày báo giá:</span>
                                <p className="font-medium text-gray-900">
                                  {new Date(quote.quote_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                </p>
                              </div>
                              {quote.status !== 'approved' && (
                                <button
                                  onClick={() => handleApproveQuote(quote)}
                                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-1"
                                >
                                  <Check className="w-4 h-4" />
                                  Duyệt Báo Giá
                                </button>
                              )}
                            </div>
                          </div>

                          {items.length > 0 && (
                            <div className="border-t border-orange-200 pt-3">
                              <p className="text-sm font-medium text-gray-900 mb-2">Chi tiết báo giá:</p>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                  <thead className="bg-orange-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">STT</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Hạng Mục</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Triệu Chứng</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Chẩn Đoán</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Phương Án</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Vật Tư</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">SL</th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Đơn Giá</th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Công Thợ</th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Thành Tiền</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item, idx) => (
                                      <tr key={item.id} className="hover:bg-orange-50">
                                        <td className="px-3 py-2 text-gray-900">{idx + 1}</td>
                                        <td className="px-3 py-2 text-gray-900">{item.component_name || '-'}</td>
                                        <td className="px-3 py-2 text-gray-900">{item.symptom || '-'}</td>
                                        <td className="px-3 py-2 text-gray-900">{item.diagnosis_result || '-'}</td>
                                        <td className="px-3 py-2 text-gray-900">{item.repair_method || '-'}</td>
                                        <td className="px-3 py-2 text-gray-900">{item.part_name || '-'}</td>
                                        <td className="px-3 py-2 text-center text-gray-900">{item.quantity}</td>
                                        <td className="px-3 py-2 text-right text-gray-900">
                                          {item.unit_price.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-900">
                                          {item.labor_cost.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                                          {item.total_amount.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-orange-50">
                                    <tr>
                                      <td colSpan={9} className="px-3 py-2 text-right font-bold text-gray-900">
                                        Tổng cộng:
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-orange-600">
                                        {quote.total_amount.toLocaleString()} VNĐ
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {quotes.some(q => q.status === 'approved') && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">BM-07: Phiếu Yêu Cầu Dịch Vụ Của Khách Hàng</h3>
                    {serviceRequests.length === 0 && (
                      <button
                        onClick={() => {
                          const approvedQuote = quotes.find(q => q.status === 'approved');
                          if (approvedQuote) {
                            handleCreateServiceRequest(approvedQuote);
                          }
                        }}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Tạo Phiếu Yêu Cầu Dịch Vụ
                      </button>
                    )}
                  </div>

                  {serviceRequests.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">Chưa tạo phiếu yêu cầu dịch vụ</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {serviceRequests.map((request) => {
                        const statusLabels: Record<string, { label: string; color: string }> = {
                          draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
                          sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800' },
                          confirmed: { label: 'Đã xác nhận', color: 'bg-green-100 text-green-800' },
                          cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
                        };
                        const statusInfo = statusLabels[request.status] || { label: request.status, color: 'bg-gray-100 text-gray-800' };

                        return (
                          <div key={request.id} className="bg-white rounded-lg p-4 border border-green-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">Mã phiếu: {request.request_code}</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                                {request.app_users && (
                                  <p className="text-gray-600">Người tạo: {request.app_users.display_name}</p>
                                )}
                              </div>
                              <div className="text-sm text-right">
                                <span className="text-gray-600">Ngày tạo:</span>
                                <p className="font-medium text-gray-900">
                                  {new Date(request.request_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                </p>
                                <p className="font-bold text-green-600 mt-1">
                                  {request.total_amount.toLocaleString()} VNĐ
                                </p>
                              </div>
                            </div>

                            {request.general_repair_orders && (
                              <div className="border-t border-green-200 pt-3">
                                <div className="bg-green-50 rounded-lg p-3">
                                  <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Đã tạo lệnh sửa chữa
                                  </p>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">Mã lệnh:</span>
                                      <p className="font-medium text-gray-900">{request.general_repair_orders.ro_code}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Trạng thái:</span>
                                      <p className="font-medium text-gray-900">
                                        {request.general_repair_orders.status === 'pending' ? 'Chờ xử lý' :
                                         request.general_repair_orders.status === 'in_progress' ? 'Đang sửa' :
                                         request.general_repair_orders.status === 'completed' ? 'Hoàn thành' :
                                         request.general_repair_orders.status}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Ngày nhận:</span>
                                      <p className="font-medium text-gray-900">
                                        {new Date(request.general_repair_orders.receive_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Ngày trả dự kiến:</span>
                                      <p className="font-medium text-gray-900">
                                        {new Date(request.general_repair_orders.return_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {generalRepairOrderId && (supplementarySlips.length > 0 || supplementaryQuotes.length > 0) && (
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FilePlus className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-gray-900">Phát Sinh Sửa Chữa</h3>
                    {supplementarySlips.length > 0 && (
                      <span className="ml-auto bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {supplementarySlips.length}
                      </span>
                    )}
                  </div>

                  {supplementarySlips.length === 0 ? (
                    <p className="text-sm text-gray-600">Chưa có phiếu phát sinh</p>
                  ) : (
                    <div className="space-y-2">
                      {supplementarySlips.map((slip) => {
                        const slipStatusMap: Record<string, { label: string; color: string }> = {
                          cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800' },
                          da_bao_gia: { label: 'Đã báo giá', color: 'bg-blue-100 text-blue-800' },
                          da_duyet: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
                        };
                        const slipStatus = slipStatusMap[slip.status] || { label: slip.status, color: 'bg-gray-100 text-gray-800' };

                        return (
                          <button
                            key={slip.id}
                            onClick={() => setSelectedSlipId(slip.id)}
                            className="w-full text-left bg-white rounded-lg p-3 border border-red-200 active:bg-red-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {new Date(slip.diagnosis_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${slipStatus.color}`}>
                                    {slipStatus.label}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {slip.item_count} hạng mục - Tạo bởi: {slip.created_by}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {generalRepairOrderId && supplementaryQuotes.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-gray-900">Báo Giá Bổ Sung</h3>
                    <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {supplementaryQuotes.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {supplementaryQuotes.map((sq) => {
                      const sqStatusMap: Record<string, { label: string; color: string }> = {
                        draft: { label: 'Mới tạo', color: 'bg-gray-100 text-gray-800' },
                        approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
                        converted: { label: 'Đã lên lệnh', color: 'bg-blue-100 text-blue-800' },
                      };
                      const sqStatus = sqStatusMap[sq.status] || { label: sq.status, color: 'bg-gray-100 text-gray-800' };

                      return (
                        <button
                          key={sq.id}
                          onClick={() => setSelectedSupQuoteId(sq.id)}
                          className="w-full text-left bg-white rounded-lg p-3 border border-amber-200 active:bg-amber-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {new Date(sq.quote_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sqStatus.color}`}>
                                  {sqStatus.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                  {sq.item_count} hạng mục - Tạo bởi: {sq.created_by}
                                </p>
                                <p className="text-sm font-bold text-red-600">
                                  {sq.total_amount.toLocaleString('vi-VN')} VNĐ
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Tiến Trình Hiện Tại</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {orderDetail.status === 'received' && (
                    <p>✓ Xe đã được tiếp nhận. Tiếp theo: Tạo phiếu yêu cầu kiểm tra (nếu cần)</p>
                  )}
                  {orderDetail.status === 'inspecting' && (
                    <p>✓ Đang tiến hành kiểm tra. Tiếp theo: Kỹ thuật viên tạo phiếu chẩn đoán</p>
                  )}
                  {orderDetail.status === 'diagnosed' && (
                    <p>✓ Đã chẩn đoán xong. Tiếp theo: Tạo phiếu báo giá từ trang "Danh Sách Báo Giá"</p>
                  )}
                  {orderDetail.status === 'quoted' && (
                    <p>✓ Đã tạo báo giá. Tiếp theo: Chờ khách hàng xét duyệt</p>
                  )}
                  {orderDetail.status === 'approved' && serviceRequests.length > 0 && (
                    <>
                      <p>✓ Đã được duyệt và tạo phiếu yêu cầu dịch vụ.</p>
                      {serviceRequests.some(r => r.general_repair_order_id) ? (
                        <p className="text-green-600 font-medium">✓ Đã tạo lệnh sửa chữa. Tiếp theo: Theo dõi tiến độ tại trang "Lệnh Sửa Chữa"</p>
                      ) : (
                        <p>Tiếp theo: Tạo lệnh sửa chữa từ trang "Yêu Cầu Dịch Vụ"</p>
                      )}
                    </>
                  )}
                  {orderDetail.status === 'approved' && serviceRequests.length === 0 && (
                    <p>✓ Đã được duyệt. Tiếp theo: Tạo phiếu yêu cầu dịch vụ hoặc bắt đầu sửa chữa</p>
                  )}
                  {orderDetail.status === 'in_progress' && (
                    <p>✓ Đang sửa chữa. Tiếp theo: Hoàn thành công việc</p>
                  )}
                  {orderDetail.status === 'completed' && (
                    <p>✓ Đã hoàn thành. Tiếp theo: Giao xe cho khách hàng</p>
                  )}
                  {orderDetail.status === 'delivered' && (
                    <p>✓ Đã giao xe. Hồ sơ hoàn tất.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showInspectionModal && (
        <InspectionRequestModal
          repairOrderId={orderId}
          onClose={() => setShowInspectionModal(false)}
          onSuccess={() => {
            setShowInspectionModal(false);
            fetchOrderDetail();
            onUpdate();
          }}
        />
      )}

      {showServiceRequestModal && selectedQuoteForService && (
        <ServiceRequestFormModal
          quote={selectedQuoteForService}
          onClose={() => {
            setShowServiceRequestModal(false);
            setSelectedQuoteForService(null);
          }}
          onSuccess={() => {
            setShowServiceRequestModal(false);
            setSelectedQuoteForService(null);
            fetchOrderDetail();
            onUpdate();
          }}
        />
      )}

      {selectedSlipId && generalRepairOrderId && (
        <SupplementarySlipDetailModal
          slipId={selectedSlipId}
          orderId={generalRepairOrderId}
          onClose={() => setSelectedSlipId(null)}
          onDelete={() => {
            setSelectedSlipId(null);
            fetchOrderDetail();
          }}
        />
      )}

      {selectedSupQuoteId && generalRepairOrderId && (
        <SupplementaryQuoteDetailModal
          quoteId={selectedSupQuoteId}
          orderId={generalRepairOrderId}
          onClose={() => setSelectedSupQuoteId(null)}
          onUpdate={() => {
            setSelectedSupQuoteId(null);
            fetchOrderDetail();
            onUpdate();
          }}
        />
      )}
    </>
  );
}

