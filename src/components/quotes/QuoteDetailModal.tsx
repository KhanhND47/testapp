import { useState, useEffect } from 'react';
import { X, FileText, Plus, Save, Edit, Printer, ClipboardCheck } from 'lucide-react';
import { api } from '../../lib/api/client';
import QuoteFormModal from './QuoteFormModal';
import QuotePrintTemplate from './QuotePrintTemplate';
import ServiceRequestFormModal from './ServiceRequestFormModal';

interface DiagnosisLine {
  id: string;
  part_system: string | null;
  symptom: string | null;
  diagnosis: string | null;
  repair_plan: string | null;
  parts_materials: string | null;
  qty: number | null;
  labor_cost: number | null;
  note: string | null;
  sort_order: number;
}

interface IntakeRequest {
  id: string;
  request_content: string;
  suggested_service: string | null;
  sort_order: number;
}

interface QuoteItem {
  id: string;
  component_name: string;
  symptom: string;
  diagnosis_result: string;
  repair_method: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  labor_cost: number;
  total_amount: number;
  order_index: number;
}

interface Props {
  report: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuoteDetailModal({ report, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [diagnosisLines, setDiagnosisLines] = useState<DiagnosisLine[]>([]);
  const [intakeRequests, setIntakeRequests] = useState<IntakeRequest[]>([]);
  const [existingQuote, setExistingQuote] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showServiceRequestForm, setShowServiceRequestForm] = useState(false);

  useEffect(() => {
    loadDiagnosisDetails();
  }, [report.id]);

  const loadDiagnosisDetails = async () => {
    try {
      setLoading(true);

      const detail = await api.get<{
        diagnosisLines: DiagnosisLine[];
        intakeRequests: IntakeRequest[];
        inspectedIntakeIds: string[];
        existingQuote: any;
        quoteItems: QuoteItem[];
      }>('api-quotes', `/${report.id}/detail`);

      setDiagnosisLines(detail.diagnosisLines || []);

      // Filter out intake requests that were already inspected
      const inspectedSet = new Set(detail.inspectedIntakeIds || []);
      const filteredIntakes = (detail.intakeRequests || []).filter(
        intake => !inspectedSet.has(intake.id)
      );
      setIntakeRequests(filteredIntakes);

      setExistingQuote(detail.existingQuote || null);
      setQuoteItems(detail.quoteItems || []);

    } catch (error: any) {
      console.error('Error loading diagnosis details:', error);
      alert('Lỗi khi tải chi tiết chẩn đoán: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuoteForm = () => {
    setShowQuoteForm(true);
  };

  const handlePrintQuote = () => {
    window.print();
  };

  const handleApproveQuote = async () => {
    if (!confirm('Xác nhận duyệt báo giá này?')) {
      return;
    }

    try {
      setLoading(true);

      await api.put('api-quotes', `/${existingQuote.id}/approve`);

      alert('Duyệt báo giá thành công!');
      loadDiagnosisDetails();
      onSuccess();
    } catch (error: any) {
      console.error('Error approving quote:', error);
      alert('Lỗi khi duyệt báo giá: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': 'Nháp',
      'sent': 'Đã gửi',
      'approved': 'Đã duyệt',
      'rejected': 'Từ chối',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Chi Tiết Phiếu Chẩn Đoán</h2>
              <p className="text-sm text-gray-600 mt-1">
                Mã phiếu: <span className="font-semibold">{report.vehicle_repair_orders.ro_code}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-600">Đang tải...</div>
            </div>
          ) : (
            <div className="p-6">
              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông Tin Khách Hàng</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Tên:</span>{' '}
                      <span className="font-medium">{report.vehicle_repair_orders.customers.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">SĐT:</span>{' '}
                      <span className="font-medium">{report.vehicle_repair_orders.customers.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông Tin Xe</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Biển số:</span>{' '}
                      <span className="font-medium">{report.vehicle_repair_orders.vehicles.license_plate}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tên xe:</span>{' '}
                      <span className="font-medium">{report.vehicle_repair_orders.vehicles.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis Lines */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kết Quả Chẩn Đoán</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng Mục</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triệu Chứng</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chẩn Đoán</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương Án</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vật Tư</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SL</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {diagnosisLines.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            Không có dữ liệu chẩn đoán
                          </td>
                        </tr>
                      ) : (
                        diagnosisLines.map((line, idx) => (
                          <tr key={line.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{line.part_system || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{line.symptom || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{line.diagnosis || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{line.repair_plan || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{line.parts_materials || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{line.qty || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quote Details */}
              {existingQuote ? (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Phiếu báo giá</p>
                          <p className="text-sm text-green-700">
                            Mã: {existingQuote.quote_code} - Trạng thái: {getStatusLabel(existingQuote.status)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(existingQuote.status === 'draft' || existingQuote.status === 'sent') && (
                          <>
                            <button
                              onClick={handleOpenQuoteForm}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                              Chỉnh Sửa
                            </button>
                            <button
                              onClick={handleApproveQuote}
                              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                            >
                              <Save className="w-4 h-4" />
                              Duyệt Báo Giá
                            </button>
                          </>
                        )}
                        <button
                          onClick={handlePrintQuote}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800"
                        >
                          <Printer className="w-4 h-4" />
                          In
                        </button>
                        {existingQuote.status === 'approved' && (
                          <button
                            onClick={() => setShowServiceRequestForm(true)}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            Tạo Phiếu Yêu Cầu Dịch Vụ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi Tiết Báo Giá</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng Mục</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triệu Chứng</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chẩn Đoán</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương Án</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vật Tư</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SL</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn Giá</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Công Thợ</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành Tiền</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {quoteItems.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                Không có dữ liệu báo giá
                              </td>
                            </tr>
                          ) : (
                            quoteItems.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.component_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.symptom || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.diagnosis_result || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.repair_method || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.part_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-center text-gray-900">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {item.unit_price.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {item.labor_cost.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                  {item.total_amount.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={9} className="px-4 py-3 text-right font-bold text-gray-900">Tổng Cộng:</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-600">
                              {existingQuote.total_amount?.toLocaleString() || '0'} VNĐ
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-orange-900">
                      Chưa tạo phiếu báo giá. Nhấn nút bên dưới để tạo phiếu báo giá từ kết quả chẩn đoán này.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Ngày chẩn đoán: {new Date(report.diagnosis_date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
              {!existingQuote && (
                <button
                  onClick={handleOpenQuoteForm}
                  disabled={loading || diagnosisLines.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Tạo Phiếu Báo Giá
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quote Form Modal */}
      {showQuoteForm && (
        <QuoteFormModal
          report={report}
          diagnosisLines={diagnosisLines}
          intakeRequests={intakeRequests}
          existingQuote={existingQuote}
          onClose={() => setShowQuoteForm(false)}
          onSuccess={() => {
            setShowQuoteForm(false);
            loadDiagnosisDetails();
            onSuccess();
          }}
        />
      )}

      {/* Service Request Form Modal */}
      {showServiceRequestForm && existingQuote && (
        <ServiceRequestFormModal
          quote={existingQuote}
          report={report}
          onClose={() => setShowServiceRequestForm(false)}
          onSuccess={() => {
            setShowServiceRequestForm(false);
            loadDiagnosisDetails();
            onSuccess();
          }}
        />
      )}

      {/* Print Template */}
      {existingQuote && (
        <QuotePrintTemplate
          quote={existingQuote}
          report={report}
          quoteItems={quoteItems}
        />
      )}
    </div>
  );
}
