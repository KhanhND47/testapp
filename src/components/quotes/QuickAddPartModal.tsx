import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '../../lib/api/client';

interface Props {
  onClose: () => void;
  onSuccess: (part: any) => void;
}

const CATEGORIES = [
  'động cơ',
  'gầm',
  'điện',
  'thân vỏ',
  'nội thất',
  'khác'
];

const GROUPS = [
  'lọc gió',
  'má phanh',
  'bugi',
  'giảm xóc',
  'dầu nhớt',
  'lốp xe',
  'ắc quy',
  'bóng đèn',
  'gương',
  'khác'
];

export default function QuickAddPartModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    part_code: '',
    part_name: '',
    category: CATEGORIES[0],
    group: GROUPS[0],
    supplier_name: '',
    cost_price: '',
    sale_price: '',
    quality_grade: 'A',
    stock_qty: '0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.part_name || !formData.supplier_name) {
      alert('Vui lòng nhập tên phụ tùng và nhà cung cấp');
      return;
    }

    try {
      setLoading(true);

      const newPart = await api.post<any>('api-parts', '/', {
        part_code: formData.part_code.trim() || undefined,
        part_name: formData.part_name.trim(),
        category: formData.category,
        group: formData.group,
        supplier_name: formData.supplier_name.trim(),
        cost_price: parseFloat(formData.cost_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        quality_grade: formData.quality_grade,
        stock_qty: parseInt(formData.stock_qty) || 0,
      });

      alert('Thêm phụ tùng thành công!');
      onSuccess(newPart);
      onClose();
    } catch (error: any) {
      console.error('Error adding part:', error);
      alert('Lỗi khi thêm phụ tùng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Thêm Nhanh Phụ Tùng</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã Phụ Tùng
                </label>
                <input
                  type="text"
                  value={formData.part_code}
                  onChange={(e) => setFormData({ ...formData, part_code: e.target.value })}
                  placeholder="Để trống để tự động tạo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Phụ Tùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.part_name}
                  onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại Phụ Tùng
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhóm
                </label>
                <select
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {GROUPS.map(grp => (
                    <option key={grp} value={grp}>{grp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhà Cung Cấp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chất Lượng
                </label>
                <select
                  value={formData.quality_grade}
                  onChange={(e) => setFormData({ ...formData, quality_grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="A">A - Cao cấp</option>
                  <option value="B">B - Trung bình</option>
                  <option value="C">C - Tiêu chuẩn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá Nhập (VNĐ)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá Bán (VNĐ)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số Lượng Tồn Kho
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_qty}
                  onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Đang lưu...' : 'Lưu Phụ Tùng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
