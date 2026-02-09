import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api/client';
import type { SupplementaryRepairItem } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus, Trash2, ChevronDown, ChevronRight, AlertCircle, Loader2, Search, Package } from 'lucide-react';
import SupplementaryQuickAddPartModal from './SupplementaryQuickAddPartModal';
import { toVietnamDateInputValue } from '../../lib/dateTime';

interface SupplementaryQuoteFormModalProps {
  slipId: string;
  orderId: string;
  customerName: string;
  vehicleName: string;
  licensePlate: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  supplier_name: string;
  sale_price: number;
}

interface QuoteItemInput {
  id: string;
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
  expanded: boolean;
}

export default function SupplementaryQuoteFormModal({
  slipId,
  orderId,
  customerName,
  vehicleName,
  licensePlate,
  onClose,
  onSuccess,
}: SupplementaryQuoteFormModalProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<QuoteItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [partSearchTerm, setPartSearchTerm] = useState<Record<string, string>>({});
  const [partSearchResults, setPartSearchResults] = useState<Record<string, Part[]>>({});
  const [showSearchResults, setShowSearchResults] = useState<Record<string, boolean>>({});
  const searchTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddItemId, setQuickAddItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchSlipItems();
  }, [slipId]);

  const fetchSlipItems = async () => {
    setFetching(true);
    const result = await api.get<{ slip: any; items: SupplementaryRepairItem[] }>(
      'api-repairs',
      `/slips/${slipId}`
    );

    const slipItems: SupplementaryRepairItem[] = result?.items || [];
    const mapped: QuoteItemInput[] = slipItems.map((item) => ({
      id: crypto.randomUUID(),
      component_name: item.item_name,
      symptom: item.symptoms,
      diagnosis_result: item.diagnosis_result,
      repair_method: item.repair_solution,
      part_id: null,
      part_name: item.materials,
      quantity: parseInt(item.quantity) || 1,
      unit_price: 0,
      labor_cost: 0,
      total_amount: 0,
      expanded: true,
    }));

    if (mapped.length === 0) {
      mapped.push(createEmptyItem());
    }

    setItems(mapped);
    setFetching(false);
  };

  const createEmptyItem = (): QuoteItemInput => ({
    id: crypto.randomUUID(),
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
    expanded: true,
  });

  const calcTotal = (item: QuoteItemInput) => {
    return item.unit_price * item.quantity + item.labor_cost;
  };

  const updateItem = (id: string, field: keyof QuoteItemInput, value: string | number | boolean | null) => {
    setItems(items.map((i) => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      updated.total_amount = calcTotal(updated);
      return updated;
    }));
  };

  const addItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
    const newSearch = { ...partSearchTerm };
    delete newSearch[id];
    setPartSearchTerm(newSearch);
  };

  const toggleExpand = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, expanded: !i.expanded } : i)));
  };

  const searchParts = async (searchTerm: string, itemId: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPartSearchResults((prev) => ({ ...prev, [itemId]: [] }));
      setShowSearchResults((prev) => ({ ...prev, [itemId]: false }));
      return;
    }

    const data = await api.get<Part[]>('api-quotes', '/parts/search', { q: searchTerm });

    setPartSearchResults((prev) => ({ ...prev, [itemId]: data || [] }));
    setShowSearchResults((prev) => ({ ...prev, [itemId]: true }));
  };

  const handlePartSearchChange = (value: string, itemId: string) => {
    setPartSearchTerm((prev) => ({ ...prev, [itemId]: value }));
    updateItem(itemId, 'part_name', value);
    updateItem(itemId, 'part_id', null);

    if (searchTimeoutRef.current[itemId]) {
      clearTimeout(searchTimeoutRef.current[itemId]);
    }

    searchTimeoutRef.current[itemId] = setTimeout(() => {
      searchParts(value, itemId);
    }, 300);
  };

  const handleSelectPart = (part: Part, itemId: string) => {
    setItems(items.map((i) => {
      if (i.id !== itemId) return i;
      const updated = {
        ...i,
        part_id: part.id,
        part_name: part.part_name,
        unit_price: part.sale_price,
      };
      updated.total_amount = calcTotal(updated);
      return updated;
    }));

    setPartSearchTerm((prev) => ({ ...prev, [itemId]: part.part_name }));
    setShowSearchResults((prev) => ({ ...prev, [itemId]: false }));
  };

  const handleOpenQuickAdd = (itemId: string) => {
    setQuickAddItemId(itemId);
    setShowQuickAdd(true);
  };

  const handleQuickAddSuccess = (newPart: Part) => {
    if (quickAddItemId) {
      handleSelectPart(newPart, quickAddItemId);
    }
    setQuickAddItemId(null);
    setShowQuickAdd(false);
  };

  const grandTotal = items.reduce((sum, i) => sum + calcTotal(i), 0);

  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.component_name.trim());
    if (validItems.length === 0) {
      setError('Vui long nhap it nhat 1 hang muc');
      return;
    }

    setLoading(true);
    setError(null);

    const today = toVietnamDateInputValue();
    const totalAmount = validItems.reduce((sum, i) => sum + calcTotal(i), 0);

    const itemsData = validItems.map((item, index) => ({
      order_index: index,
      component_name: item.component_name.trim(),
      symptom: item.symptom.trim(),
      diagnosis_result: item.diagnosis_result.trim(),
      repair_method: item.repair_method.trim(),
      part_id: item.part_id,
      part_name: item.part_name.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      labor_cost: item.labor_cost,
      total_amount: calcTotal(item),
    }));

    try {
      await api.post('api-repairs', `/${orderId}/supplementary-quotes`, {
        slip_id: slipId,
        customer_name: customerName,
        vehicle_name: vehicleName,
        license_plate: licensePlate,
        quote_date: today,
        total_amount: totalAmount,
        notes: notes.trim(),
        status: 'draft',
        created_by: user?.display_name || '',
        items: itemsData,
      });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  return (
    <div className="fullscreen-modal" style={{ zIndex: 55 }}>
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
        <button onClick={onClose} className="w-14 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="flex-1 text-center font-bold text-white truncate">
          Tao Bao Gia Bo Sung
        </h2>
        <div className="w-14" />
      </div>

      <div className="p-4 pb-32 overflow-y-auto space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Khach hang</label>
            <input
              type="text"
              value={customerName}
              readOnly
              className="input-field bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ten xe</label>
            <input
              type="text"
              value={vehicleName}
              readOnly
              className="input-field bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bien so xe</label>
            <input
              type="text"
              value={licensePlate}
              readOnly
              className="input-field bg-gray-50 text-gray-500 uppercase font-mono"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Cac hang muc bao gia
          </label>

          {fetching ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="card p-4 space-y-3">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-48" />
                  <div className="skeleton h-3 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="card overflow-visible">
                  <div
                    className="flex items-center gap-2 p-3 active:bg-gray-50"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium text-gray-800 text-sm truncate">
                      {item.component_name || 'Hang muc moi'}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="w-9 h-9 flex items-center justify-center text-red-500 active:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {item.expanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  {item.expanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hang muc / Bo phan</label>
                        <input
                          type="text"
                          value={item.component_name}
                          onChange={(e) => updateItem(item.id, 'component_name', e.target.value)}
                          className="input-field"
                          placeholder="Nhap hang muc..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Trieu chung</label>
                        <input
                          type="text"
                          value={item.symptom}
                          onChange={(e) => updateItem(item.id, 'symptom', e.target.value)}
                          className="input-field"
                          placeholder="Mo ta trieu chung..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Ket qua chan doan</label>
                        <input
                          type="text"
                          value={item.diagnosis_result}
                          onChange={(e) => updateItem(item.id, 'diagnosis_result', e.target.value)}
                          className="input-field"
                          placeholder="Nhap ket qua..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Phuong an sua chua</label>
                        <input
                          type="text"
                          value={item.repair_method}
                          onChange={(e) => updateItem(item.id, 'repair_method', e.target.value)}
                          className="input-field"
                          placeholder="Nhap phuong an..."
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Vat tu / Phu tung</label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={partSearchTerm[item.id] ?? item.part_name}
                                onChange={(e) => handlePartSearchChange(e.target.value, item.id)}
                                onFocus={() => {
                                  if (partSearchResults[item.id]?.length > 0) {
                                    setShowSearchResults((prev) => ({ ...prev, [item.id]: true }));
                                  }
                                }}
                                className="input-field pl-9"
                                placeholder="Tim phu tung trong kho..."
                              />
                            </div>

                            {showSearchResults[item.id] && partSearchResults[item.id]?.length > 0 && (
                              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {partSearchResults[item.id].map((part) => (
                                  <button
                                    key={part.id}
                                    type="button"
                                    onClick={() => handleSelectPart(part, item.id)}
                                    className="w-full text-left px-3 py-2.5 active:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{part.part_name}</p>
                                        <p className="text-xs text-gray-500">{part.supplier_name} - {part.sale_price.toLocaleString('vi-VN')} VND</p>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenQuickAdd(item.id)}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-500 text-white rounded-xl active:bg-emerald-600"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        {item.part_id && (
                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Da chon tu kho
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">So luong</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="input-field"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Don gia (VND)</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseInt(e.target.value) || 0)}
                          className="input-field"
                          step={1000}
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Cong tho (VND)</label>
                        <input
                          type="number"
                          value={item.labor_cost}
                          onChange={(e) => updateItem(item.id, 'labor_cost', parseInt(e.target.value) || 0)}
                          className="input-field"
                          step={1000}
                          min={0}
                        />
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <label className="block text-xs font-medium text-red-500 mb-1">Thanh tien</label>
                        <p className="text-base font-bold text-red-600">{formatNumber(calcTotal(item))} VND</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addItem}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-red-300 text-red-600 font-semibold rounded-2xl active:bg-red-50 text-sm"
          >
            <Plus className="w-4 h-4" />
            Them hang muc
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Ghi chu / Dieu kien
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="Nhap ghi chu hoac dieu kien..."
          />
        </div>

        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4">
          <p className="text-sm text-red-100 mb-1">Tong cong</p>
          <p className="text-2xl font-bold text-white">{formatNumber(grandTotal)} VND</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-gray-200 px-4 py-3 flex gap-3" style={{ paddingBottom: 'calc(12px + var(--safe-bottom))' }}>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary flex-1"
        >
          Huy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Dang luu...' : 'Luu Bao Gia'}
        </button>
      </div>

      {showQuickAdd && (
        <SupplementaryQuickAddPartModal
          onClose={() => {
            setShowQuickAdd(false);
            setQuickAddItemId(null);
          }}
          onSuccess={handleQuickAddSuccess}
        />
      )}
    </div>
  );
}
