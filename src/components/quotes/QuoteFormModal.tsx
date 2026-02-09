import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { api } from '../../lib/api/client';
import QuickAddPartModal from './QuickAddPartModal';

interface DiagnosisLine {
  id: string;
  part_system: string | null;
  symptom: string | null;
  diagnosis: string | null;
  repair_plan: string | null;
  parts_materials: string | null;
  qty: number | null;
  labor_cost: number | null;
  sort_order: number;
}

interface IntakeRequest {
  id: string;
  request_content: string;
  suggested_service: string | null;
  sort_order: number;
}

interface QuoteItem {
  id?: string;
  diagnosis_item_id?: string;
  component_name: string;
  symptom: string;
  diagnosis_result: string;
  repair_method: string;
  part_id: string | null;
  part_name: string;
  quantity: number;
  unit_price: number;
  labor_cost: number;
  total_amount: number;
  order_index: number;
}

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  supplier_name: string;
  sale_price: number;
}

interface Props {
  report: any;
  diagnosisLines: DiagnosisLine[];
  intakeRequests: IntakeRequest[];
  existingQuote?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuoteFormModal({ report, diagnosisLines, intakeRequests, existingQuote, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [showQuickAddPart, setShowQuickAddPart] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [partSearchTerm, setPartSearchTerm] = useState<{[key: number]: string}>({});
  const [partSearchResults, setPartSearchResults] = useState<{[key: number]: Part[]}>({});
  const [showSearchResults, setShowSearchResults] = useState<{[key: number]: boolean}>({});
  const searchTimeoutRef = useRef<{[key: number]: NodeJS.Timeout}>({});

  useEffect(() => {
    initializeQuoteItems();
  }, [diagnosisLines, intakeRequests]);

  useEffect(() => {
    if (existingQuote) {
      loadExistingQuoteItems();
    }
  }, [existingQuote]);

  const initializeQuoteItems = () => {
    const items: QuoteItem[] = [];
    let currentIndex = 0;

    // Add items from diagnosis lines (items that were inspected and diagnosed)
    diagnosisLines.forEach((line) => {
      items.push({
        diagnosis_item_id: line.id,
        component_name: line.part_system || '',
        symptom: line.symptom || '',
        diagnosis_result: line.diagnosis || '',
        repair_method: line.repair_plan || '',
        part_id: null,
        part_name: line.parts_materials || '',
        quantity: line.qty || 1,
        unit_price: 0,
        labor_cost: line.labor_cost || 0,
        total_amount: line.labor_cost || 0,
        order_index: currentIndex++,
      });
    });

    // Add items from intake requests (items that were not inspected)
    intakeRequests.forEach((request) => {
      items.push({
        component_name: request.request_content,
        symptom: '',
        diagnosis_result: '',
        repair_method: request.suggested_service || '',
        part_id: null,
        part_name: '',
        quantity: 1,
        unit_price: 0,
        labor_cost: 0,
        total_amount: 0,
        order_index: currentIndex++,
      });
    });

    setQuoteItems(items);
  };

  const loadExistingQuoteItems = async () => {
    try {
      const detail = await api.get<any>('api-quotes', `/${report.id}/detail`);
      const data = detail?.quoteItems;

      if (data && data.length > 0) {
        setQuoteItems(data.map((item: any) => ({
          id: item.id,
          diagnosis_item_id: item.diagnosis_item_id,
          component_name: item.component_name,
          symptom: item.symptom || '',
          diagnosis_result: item.diagnosis_result || '',
          repair_method: item.repair_method || '',
          part_id: item.part_id,
          part_name: item.part_name || '',
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          labor_cost: parseFloat(item.labor_cost) || 0,
          total_amount: parseFloat(item.total_amount) || 0,
          order_index: item.order_index,
        })));
      }
    } catch (error: any) {
      console.error('Error loading quote items:', error);
    }
  };

  const searchParts = async (searchTerm: string, itemIndex: number) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPartSearchResults({ ...partSearchResults, [itemIndex]: [] });
      setShowSearchResults({ ...showSearchResults, [itemIndex]: false });
      return;
    }

    try {
      const data = await api.get<Part[]>('api-quotes', '/parts/search', { q: searchTerm });

      setPartSearchResults({ ...partSearchResults, [itemIndex]: data || [] });
      setShowSearchResults({ ...showSearchResults, [itemIndex]: true });
    } catch (error: any) {
      console.error('Error searching parts:', error);
    }
  };

  const handlePartSearchChange = (value: string, itemIndex: number) => {
    setPartSearchTerm({ ...partSearchTerm, [itemIndex]: value });

    if (searchTimeoutRef.current[itemIndex]) {
      clearTimeout(searchTimeoutRef.current[itemIndex]);
    }

    searchTimeoutRef.current[itemIndex] = setTimeout(() => {
      searchParts(value, itemIndex);
    }, 300);
  };

  const handleSelectPart = (part: Part, itemIndex: number) => {
    const updatedItems = [...quoteItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      part_id: part.id,
      part_name: part.part_name,
      unit_price: part.sale_price,
    };

    updatedItems[itemIndex].total_amount = calculateTotal(updatedItems[itemIndex]);

    setQuoteItems(updatedItems);
    setPartSearchTerm({ ...partSearchTerm, [itemIndex]: `${part.part_name} - ${part.supplier_name}` });
    setShowSearchResults({ ...showSearchResults, [itemIndex]: false });
  };

  const handleOpenQuickAddPart = (itemIndex: number) => {
    setCurrentItemIndex(itemIndex);
    setShowQuickAddPart(true);
  };

  const handleQuickAddPartSuccess = (newPart: Part) => {
    if (currentItemIndex !== null) {
      handleSelectPart(newPart, currentItemIndex);
    }
    setCurrentItemIndex(null);
  };

  const calculateTotal = (item: QuoteItem) => {
    return (item.unit_price * item.quantity) + item.labor_cost;
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const updatedItems = [...quoteItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    if (field === 'quantity' || field === 'unit_price' || field === 'labor_cost') {
      updatedItems[index].total_amount = calculateTotal(updatedItems[index]);
    }

    setQuoteItems(updatedItems);
  };

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      component_name: '',
      symptom: '',
      diagnosis_result: '',
      repair_method: '',
      part_id: null,
      part_name: '',
      quantity: 1,
      unit_price: 0,
      labor_cost: 0,
      total_amount: 0,
      order_index: quoteItems.length,
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = quoteItems.filter((_, idx) => idx !== index);
    setQuoteItems(updatedItems.map((item, idx) => ({ ...item, order_index: idx })));
  };

  const getTotalAmount = () => {
    return quoteItems.reduce((sum, item) => sum + item.total_amount, 0);
  };

  const handleSave = async () => {
    if (quoteItems.length === 0) {
      alert('Vui lòng thêm ít nhất một hạng mục');
      return;
    }

    if (!confirm('Xác nhận lưu phiếu báo giá?')) {
      return;
    }

    try {
      setLoading(true);

      const items = quoteItems.map(item => {
        let itemType = 'SERVICE';
        if (item.part_id || item.part_name) {
          itemType = 'PART';
        } else if (item.labor_cost && item.labor_cost > 0 && !item.unit_price) {
          itemType = 'LABOR';
        }

        return {
          item_type: itemType,
          diagnosis_item_id: item.diagnosis_item_id,
          component_name: item.component_name,
          symptom: item.symptom,
          diagnosis_result: item.diagnosis_result,
          repair_method: item.repair_method,
          part_id: item.part_id,
          part_name: item.part_name,
          description: item.component_name || '',
          quantity: item.quantity,
          qty: item.quantity,
          unit_price: item.unit_price,
          labor_cost: item.labor_cost,
          amount: item.total_amount,
          total_amount: item.total_amount,
          order_index: item.order_index,
          sort_order: item.order_index,
        };
      });

      await api.post('api-quotes', '/', {
        reportId: report.id,
        repairOrderId: report.repair_order_id,
        existingQuoteId: existingQuote?.id || null,
        items,
        totalAmount: getTotalAmount(),
      });

      alert('Lưu phiếu báo giá thành công!');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving quote:', error);
      alert('Lỗi khi lưu phiếu báo giá: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full my-8">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {existingQuote ? 'Chỉnh Sửa Phiếu Báo Giá' : 'Tạo Phiếu Báo Giá'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Mã phiếu: <span className="font-semibold">{report.vehicle_repair_orders.ro_code}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
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

            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Chi Tiết Báo Giá</h3>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Thêm Hạng Mục
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8">STT</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng Mục</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triệu Chứng</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chẩn Đoán</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương Án</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Vật Tư/Phụ Tùng</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">SL</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Đơn Giá</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Công Thợ</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">Thành Tiền</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quoteItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.component_name}
                          onChange={(e) => handleItemChange(idx, 'component_name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Bộ phận"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.symptom}
                          onChange={(e) => handleItemChange(idx, 'symptom', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Triệu chứng"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.diagnosis_result}
                          onChange={(e) => handleItemChange(idx, 'diagnosis_result', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Kết quả"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.repair_method}
                          onChange={(e) => handleItemChange(idx, 'repair_method', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Phương án"
                        />
                      </td>
                      <td className="px-3 py-2 relative">
                        <div className="flex gap-1">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={partSearchTerm[idx] || item.part_name}
                              onChange={(e) => {
                                handlePartSearchChange(e.target.value, idx);
                                handleItemChange(idx, 'part_name', e.target.value);
                              }}
                              onFocus={() => {
                                if (partSearchTerm[idx] && partSearchResults[idx]?.length > 0) {
                                  setShowSearchResults({ ...showSearchResults, [idx]: true });
                                }
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="Tìm phụ tùng..."
                            />
                            {showSearchResults[idx] && partSearchResults[idx]?.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {partSearchResults[idx].map(part => (
                                  <div
                                    key={part.id}
                                    onClick={() => handleSelectPart(part, idx)}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                  >
                                    <div className="font-medium">{part.part_name}</div>
                                    <div className="text-xs text-gray-500">{part.supplier_name} - {part.sale_price.toLocaleString()} VNĐ</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleOpenQuickAddPart(idx)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            title="Thêm nhanh"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={item.labor_cost}
                          onChange={(e) => handleItemChange(idx, 'labor_cost', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                        {item.total_amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={9} className="px-3 py-3 text-right font-bold text-gray-900">Tổng Cộng:</td>
                    <td className="px-3 py-3 text-right font-bold text-blue-600 text-lg">
                      {getTotalAmount().toLocaleString()} VNĐ
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading || quoteItems.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Đang lưu...' : 'Lưu Báo Giá'}
            </button>
          </div>
        </div>
      </div>

      {showQuickAddPart && (
        <QuickAddPartModal
          onClose={() => {
            setShowQuickAddPart(false);
            setCurrentItemIndex(null);
          }}
          onSuccess={handleQuickAddPartSuccess}
        />
      )}
    </div>
  );
}
