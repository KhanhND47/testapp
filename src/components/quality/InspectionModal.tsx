import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { X, CheckCircle2, XCircle, User, Car, Save } from 'lucide-react';

interface RepairOrder {
  id: string;
  ro_code: string;
  customer_name: string;
  customer_phone: string;
  vehicle_name: string;
  license_plate: string;
  receive_date: string;
  return_date: string;
}

interface RepairItem {
  id: string;
  name: string;
  description: string | null;
  repair_type: string;
  status: string;
}

interface InspectionItemData {
  itemId: string;
  result: 'pass' | 'fail' | null;
  notes: string;
}

interface Props {
  order: RepairOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InspectionModal({ order, onClose, onSuccess }: Props) {
  const [items, setItems] = useState<RepairItem[]>([]);
  const [inspectionData, setInspectionData] = useState<Map<string, InspectionItemData>>(new Map());
  const [generalNotes, setGeneralNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRepairItems();
  }, [order.id]);

  const fetchRepairItems = async () => {
    try {
      const data = await api.get<RepairItem[]>('api-quality', `/${order.id}/items`);

      setItems(data || []);

      const initialData = new Map<string, InspectionItemData>();
      (data || []).forEach(item => {
        initialData.set(item.id, {
          itemId: item.id,
          result: null,
          notes: ''
        });
      });
      setInspectionData(initialData);
    } catch (error: any) {
      console.error('Error fetching repair items:', error);
      alert('Lỗi khi tải danh sách hạng mục: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const setItemResult = (itemId: string, result: 'pass' | 'fail') => {
    const newData = new Map(inspectionData);
    const currentData = newData.get(itemId) || { itemId, result: null, notes: '' };
    newData.set(itemId, { ...currentData, result });
    setInspectionData(newData);
  };

  const setItemNotes = (itemId: string, notes: string) => {
    const newData = new Map(inspectionData);
    const currentData = newData.get(itemId) || { itemId, result: null, notes: '' };
    newData.set(itemId, { ...currentData, notes });
    setInspectionData(newData);
  };

  const handleSubmit = async () => {
    const allItemsInspected = Array.from(inspectionData.values()).every(
      item => item.result !== null
    );

    if (!allItemsInspected) {
      alert('Vui lòng kiểm tra tất cả các hạng mục');
      return;
    }

    const hasFailures = Array.from(inspectionData.values()).some(
      item => item.result === 'fail'
    );

    const overallResult = hasFailures ? 'fail' : 'pass';

    try {
      setSubmitting(true);

      const inspection = {
        repair_order_id: order.id,
        status: 'completed',
        overall_result: overallResult,
        notes: generalNotes || null,
      };

      const inspectionItems = Array.from(inspectionData.values())
        .filter(item => item.result !== null)
        .map(item => ({
          repair_item_id: item.itemId,
          result: item.result!,
          notes: item.notes || null,
        }));

      await api.post('api-quality', '', { inspection, items: inspectionItems });

      alert('Đã hoàn thành nghiệm thu!');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting inspection:', error);
      alert('Lỗi khi lưu kết quả nghiệm thu: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getResultCount = () => {
    const results = Array.from(inspectionData.values());
    const pass = results.filter(r => r.result === 'pass').length;
    const fail = results.filter(r => r.result === 'fail').length;
    const pending = results.filter(r => r.result === null).length;
    return { pass, fail, pending };
  };

  const resultCount = getResultCount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Kiểm Tra Chất Lượng</h2>
              <p className="text-blue-100 text-sm mt-1">{order.ro_code}</p>
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
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>Khách hàng</span>
                  </div>
                  <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-600">{order.customer_phone}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Car className="w-4 h-4" />
                    <span>Thông tin xe</span>
                  </div>
                  <p className="font-semibold text-gray-900">{order.vehicle_name}</p>
                  <p className="text-sm text-gray-600">{order.license_plate}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Tổng hạng mục</p>
                      <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                    </div>
                    <div className="h-12 w-px bg-gray-300"></div>
                    <div>
                      <p className="text-sm text-gray-600">Đạt</p>
                      <p className="text-2xl font-bold text-green-600">{resultCount.pass}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Không đạt</p>
                      <p className="text-2xl font-bold text-red-600">{resultCount.fail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Chưa kiểm tra</p>
                      <p className="text-2xl font-bold text-gray-400">{resultCount.pending}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Danh sách hạng mục sửa chữa</h3>
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const itemData = inspectionData.get(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-semibold text-gray-600">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                                {item.description && (
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                    item.repair_type === 'sua_chua'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {item.repair_type === 'sua_chua' ? 'Sửa chữa' : 'Đồng sơn'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3 mb-3">
                              <button
                                onClick={() => setItemResult(item.id, 'pass')}
                                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all inline-flex items-center justify-center gap-2 ${
                                  itemData?.result === 'pass'
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <CheckCircle2 className="w-5 h-5" />
                                Đạt
                              </button>
                              <button
                                onClick={() => setItemResult(item.id, 'fail')}
                                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all inline-flex items-center justify-center gap-2 ${
                                  itemData?.result === 'fail'
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <XCircle className="w-5 h-5" />
                                Không đạt
                              </button>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú
                              </label>
                              <textarea
                                value={itemData?.notes || ''}
                                onChange={(e) => setItemNotes(item.id, e.target.value)}
                                placeholder="Nhập ghi chú về kết quả kiểm tra..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú chung
                </label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Nhập ghi chú chung về kết quả nghiệm thu..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Đã kiểm tra: <span className="font-semibold text-gray-900">{resultCount.pass + resultCount.fail}/{items.length}</span> hạng mục
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
              disabled={submitting || resultCount.pending > 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Hoàn thành nghiệm thu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
