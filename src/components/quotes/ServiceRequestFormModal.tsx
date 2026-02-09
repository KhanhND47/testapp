import { useState, useEffect } from 'react';
import { X, Save, Printer } from 'lucide-react';
import { api } from '../../lib/api/client';
import ServiceRequestPrintTemplate from './ServiceRequestPrintTemplate';
import { toVietnamDateInputValue } from '../../lib/dateTime';

interface ServiceRequestItem {
  component_name: string;
  symptom: string;
  repair_method: string;
  part_name: string;
  quantity: number;
}

interface Props {
  quote: any;
  report?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ServiceRequestFormModal({ quote, report: _report, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [quoteItems, setQuoteItems] = useState<ServiceRequestItem[]>([]);
  const [startTime, setStartTime] = useState('');
  const [expectedFinishTime, setExpectedFinishTime] = useState('');
  const [existingServiceRequest, setExistingServiceRequest] = useState<any>(null);

  useEffect(() => {
    loadQuoteItems();
    checkExistingServiceRequest();
    initializeTimes();
  }, []);

  const initializeTimes = () => {
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    setStartTime(toVietnamDateInputValue(now));
    setExpectedFinishTime(toVietnamDateInputValue(twoDaysLater));
  };

  const checkExistingServiceRequest = async () => {
    try {
      const data = await api.get<any>('api-service-requests', '/check-existing', { quote_id: quote.id });

      if (data) {
        setExistingServiceRequest(data);
        setStartTime(data.start_time ? toVietnamDateInputValue(data.start_time) : '');
        setExpectedFinishTime(data.expected_finish_time ? toVietnamDateInputValue(data.expected_finish_time) : '');
      }
    } catch (error: any) {
      console.error('Error checking existing service request:', error);
    }
  };

  const loadQuoteItems = async () => {
    try {
      const data = await api.get<any[]>('api-service-requests', '/quote-items', { quote_id: quote.id });

      const items = (data || []).map((item: any) => ({
        component_name: item.component_name,
        symptom: item.symptom || '',
        repair_method: item.repair_method || '',
        part_name: item.part_name || '',
        quantity: parseFloat(item.quantity) || 1,
      }));

      setQuoteItems(items);
    } catch (error: any) {
      console.error('Error loading quote items:', error);
      alert('Lỗi khi tải chi tiết báo giá: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (loading) return;

    if (!startTime || !expectedFinishTime) {
      alert('Vui lòng nhập thời gian bắt đầu và dự kiến hoàn thành');
      return;
    }

    setLoading(true);

    try {
      if (existingServiceRequest) {
        // Update existing service request
        await api.put('api-service-requests', `/${existingServiceRequest.id}`, {
          startTime,
          expectedFinishTime,
        });
      } else {
        // Create new service request
        const items = quoteItems.map((item, idx) => ({
          item_type: 'SERVICE',
          description: `${item.component_name} - ${item.symptom} - ${item.repair_method}`,
          qty: item.quantity,
          sort_order: idx,
        }));

        await api.post('api-service-requests', '/', {
          repairOrderId: quote.repair_order_id,
          quoteId: quote.id,
          startTime,
          expectedFinishTime,
          totalAmount: quote.total_amount || 0,
          items,
        });
      }

      alert('Lưu phiếu yêu cầu dịch vụ thành công!');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving service request:', error);
      alert('Lỗi khi lưu phiếu yêu cầu dịch vụ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phiếu Yêu Cầu Dịch Vụ Của Khách Hàng</h2>
              <p className="text-sm text-gray-600 mt-1">
                Mã báo giá: <span className="font-semibold">{quote.quote_code}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Time Information */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian bắt đầu thực hiện
                </label>
                <input
                  type="date"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian dự kiến hoàn thành
                </label>
                <input
                  type="date"
                  value={expectedFinishTime}
                  onChange={(e) => setExpectedFinishTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Service Items Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Danh sách dịch vụ</h3>
              <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng Mục</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triệu Chứng</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương Án</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phụ Tùng</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SL</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quoteItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.component_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.symptom || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.repair_method || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.part_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Ghi chú / Điều kiện:</strong> Phát sinh chi thực hiện khi có xác nhận của khách hàng
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Đóng
            </button>
            {existingServiceRequest && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                In Phiếu
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {existingServiceRequest ? 'Cập Nhật' : 'Tạo Phiếu'}
            </button>
          </div>
        </div>
      </div>

      {/* Print Template */}
      {existingServiceRequest && (
        <ServiceRequestPrintTemplate
          serviceRequest={existingServiceRequest}
          items={quoteItems}
        />
      )}
    </div>
  );
}
