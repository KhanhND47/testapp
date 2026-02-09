import { useState } from 'react';
import { api } from '../../lib/api/client';
import { X, Loader2, Package } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: (part: any) => void;
}

const CATEGORIES = [
  'dong_co', 'gam', 'dien', 'than_vo', 'noi_that', 'khac'
];

const CATEGORY_LABELS: Record<string, string> = {
  dong_co: 'Dong co',
  gam: 'Gam',
  dien: 'Dien',
  than_vo: 'Than vo',
  noi_that: 'Noi that',
  khac: 'Khac',
};

const GROUPS = [
  'loc_gio', 'ma_phanh', 'bugi', 'giam_xoc', 'dau_nhot', 'lop_xe', 'ac_quy', 'bong_den', 'guong', 'khac'
];

const GROUP_LABELS: Record<string, string> = {
  loc_gio: 'Loc gio',
  ma_phanh: 'Ma phanh',
  bugi: 'Bugi',
  giam_xoc: 'Giam xoc',
  dau_nhot: 'Dau nhot',
  lop_xe: 'Lop xe',
  ac_quy: 'Ac quy',
  bong_den: 'Bong den',
  guong: 'Guong',
  khac: 'Khac',
};

export default function SupplementaryQuickAddPartModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    part_name: '',
    category: CATEGORIES[0],
    group: GROUPS[0],
    supplier_name: '',
    cost_price: '',
    sale_price: '',
    quality_grade: 'A',
    stock_qty: '0',
  });

  const handleSubmit = async () => {
    if (!formData.part_name.trim() || !formData.supplier_name.trim()) {
      alert('Vui long nhap ten phu tung va nha cung cap');
      return;
    }

    try {
      setLoading(true);

      const newPart = await api.post<any>('api-parts', '/', {
        part_name: formData.part_name.trim(),
        category: formData.category,
        group: formData.group,
        supplier_name: formData.supplier_name.trim(),
        cost_price: parseFloat(formData.cost_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        quality_grade: formData.quality_grade,
        stock_qty: parseInt(formData.stock_qty) || 0,
      });

      onSuccess(newPart);
    } catch (error: any) {
      alert('Loi khi them phu tung: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fullscreen-modal" style={{ zIndex: 60 }}>
      <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-emerald-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
        <button onClick={onClose} className="w-14 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="flex-1 text-center font-bold text-white truncate">
          Them Nhanh Phu Tung
        </h2>
        <div className="w-14" />
      </div>

      <div className="p-4 pb-32 overflow-y-auto space-y-4">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <Package className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700">Phu tung moi se duoc them vao kho va tu dong chon cho bao gia</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ten phu tung <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.part_name}
              onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
              className="input-field"
              placeholder="Nhap ten phu tung..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nha cung cap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              className="input-field"
              placeholder="Nhap nha cung cap..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loai</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nhom</label>
              <select
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="input-field"
              >
                {GROUPS.map((grp) => (
                  <option key={grp} value={grp}>{GROUP_LABELS[grp]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Chat luong</label>
            <div className="flex gap-2">
              {['A', 'B', 'C'].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setFormData({ ...formData, quality_grade: grade })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    formData.quality_grade === grade
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {grade === 'A' ? 'A - Cao cap' : grade === 'B' ? 'B - Trung binh' : 'C - Tieu chuan'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gia nhap (VND)</label>
              <input
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="input-field"
                step={1000}
                min={0}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gia ban (VND)</label>
              <input
                type="number"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                className="input-field"
                step={1000}
                min={0}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">So luong ton kho</label>
            <input
              type="number"
              value={formData.stock_qty}
              onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
              className="input-field"
              min={0}
              placeholder="0"
            />
          </div>
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
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-semibold rounded-2xl active:bg-emerald-600 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Dang luu...' : 'Luu Phu Tung'}
        </button>
      </div>
    </div>
  );
}
