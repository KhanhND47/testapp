import { useState } from 'react';
import { api } from '../../lib/api/client';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus, Trash2, ChevronDown, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { toVietnamDateInputValue } from '../../lib/dateTime';

interface SupplementarySlipFormModalProps {
  orderId: string;
  customerName: string;
  vehicleName: string;
  licensePlate: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemInput {
  id: string;
  item_name: string;
  symptoms: string;
  diagnosis_result: string;
  repair_solution: string;
  materials: string;
  quantity: string;
  item_notes: string;
  expanded: boolean;
}

export default function SupplementarySlipFormModal({
  orderId,
  customerName,
  vehicleName,
  licensePlate,
  onClose,
  onSuccess,
}: SupplementarySlipFormModalProps) {
  const { user } = useAuth();
  const today = toVietnamDateInputValue();
  const [diagnosisDate, setDiagnosisDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemInput[]>([
    {
      id: crypto.randomUUID(),
      item_name: '',
      symptoms: '',
      diagnosis_result: '',
      repair_solution: '',
      materials: '',
      quantity: '',
      item_notes: '',
      expanded: true,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        item_name: '',
        symptoms: '',
        diagnosis_result: '',
        repair_solution: '',
        materials: '',
        quantity: '',
        item_notes: '',
        expanded: true,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemInput, value: string | boolean) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const toggleExpand = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, expanded: !i.expanded } : i)));
  };

  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.item_name.trim());
    if (validItems.length === 0) {
      setError('Vui long nhap it nhat 1 hang muc');
      return;
    }

    setLoading(true);
    setError(null);

    const itemsData = validItems.map((item, index) => ({
      order_index: index,
      item_name: item.item_name.trim(),
      symptoms: item.symptoms.trim(),
      diagnosis_result: item.diagnosis_result.trim(),
      repair_solution: item.repair_solution.trim(),
      materials: item.materials.trim(),
      quantity: item.quantity.trim(),
      item_notes: item.item_notes.trim(),
    }));

    try {
      await api.post('api-repairs', `/${orderId}/supplementary-slips`, {
        customer_name: customerName,
        vehicle_name: vehicleName,
        license_plate: licensePlate,
        diagnosis_date: diagnosisDate,
        notes: notes.trim(),
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

  return (
    <div className="fullscreen-modal" style={{ zIndex: 55 }}>
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
        <button onClick={onClose} className="w-14 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="flex-1 text-center font-bold text-white truncate">
          Tao Phieu Phat Sinh
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ngay chan doan phat sinh</label>
            <input
              type="date"
              value={diagnosisDate}
              onChange={(e) => setDiagnosisDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Cac hang muc phat sinh
          </label>

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
                    {item.item_name || 'Hang muc moi'}
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
                        value={item.item_name}
                        onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                        className="input-field"
                        placeholder="Nhap hang muc..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Trieu chung</label>
                      <input
                        type="text"
                        value={item.symptoms}
                        onChange={(e) => updateItem(item.id, 'symptoms', e.target.value)}
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
                        value={item.repair_solution}
                        onChange={(e) => updateItem(item.id, 'repair_solution', e.target.value)}
                        className="input-field"
                        placeholder="Nhap phuong an..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Vat tu</label>
                      <input
                        type="text"
                        value={item.materials}
                        onChange={(e) => updateItem(item.id, 'materials', e.target.value)}
                        className="input-field"
                        placeholder="Nhap vat tu..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">So luong</label>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className="input-field"
                        placeholder="Nhap so luong..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chu</label>
                      <input
                        type="text"
                        value={item.item_notes}
                        onChange={(e) => updateItem(item.id, 'item_notes', e.target.value)}
                        className="input-field"
                        placeholder="Ghi chu them..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

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
          {loading ? 'Dang tao...' : 'Tao Phieu'}
        </button>
      </div>
    </div>
  );
}
