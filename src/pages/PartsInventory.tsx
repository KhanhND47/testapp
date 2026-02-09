import { useState, useEffect } from 'react';
import { api } from '../lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, X, Package } from 'lucide-react';

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  category: string | null;
  group: string | null;
  supplier_name: string | null;
  cost_price: number;
  sale_price: number;
  quality_grade: string | null;
  stock_qty: number;
  created_at: string;
}

const CATEGORIES = ['Dong co', 'Gam', 'Dien', 'Than vo', 'Noi that'];
const GROUPS = ['Loc gio', 'Ma phanh', 'Bugi', 'Giam xoc', 'Den', 'Guong', 'Dau nhon'];
const QUALITY_GRADES = ['A', 'B', 'C'];

export function PartsInventory() {
  const { isAdmin } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState({
    part_code: '',
    part_name: '',
    category: '',
    group: '',
    supplier_name: '',
    cost_price: 0,
    sale_price: 0,
    quality_grade: 'A',
    stock_qty: 0,
  });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const data = await api.get<Part[]>('api-parts', '/');
      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const partData = {
      ...formData,
      cost_price: Number(formData.cost_price),
      sale_price: Number(formData.sale_price),
      stock_qty: Number(formData.stock_qty),
    };

    try {
      if (editingPart) {
        await api.put('api-parts', `/${editingPart.id}`, partData);
        alert('Cap nhat phu tung thanh cong');
      } else {
        await api.post('api-parts', '/', partData);
        alert('Them phu tung thanh cong');
      }
      closeModal();
      fetchParts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving part:', error);
      alert('Loi khi luu phu tung: ' + message);
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      part_code: part.part_code,
      part_name: part.part_name,
      category: part.category || '',
      group: part.group || '',
      supplier_name: part.supplier_name || '',
      cost_price: part.cost_price,
      sale_price: part.sale_price,
      quality_grade: part.quality_grade || 'A',
      stock_qty: part.stock_qty,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, partName: string) => {
    if (!confirm(`Xac nhan xoa phu tung "${partName}"?`)) return;

    try {
      await api.del('api-parts', `/${id}`);
      alert('Xoa phu tung thanh cong');
      fetchParts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error deleting part:', error);
      alert('Loi khi xoa phu tung: ' + message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPart(null);
    setFormData({
      part_code: '',
      part_name: '',
      category: '',
      group: '',
      supplier_name: '',
      cost_price: 0,
      sale_price: 0,
      quality_grade: 'A',
      stock_qty: 0,
    });
  };

  const filteredParts = parts.filter(part =>
    part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (part.category && part.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (part.supplier_name && part.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Kho Phu Tung</h1>
        <p className="text-sm text-gray-600 mt-0.5">Quan ly danh sach phu tung, gia ca va ton kho</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tim theo ten, ma, loai, NCC..."
              className="input-field w-full pl-9 pr-3 py-2.5 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center justify-center w-11 h-11 p-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="card p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Khong tim thay phu tung nao' : 'Chua co phu tung nao'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredParts.map((part) => (
              <div key={part.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-blue-600 font-medium">{part.part_code}</span>
                      <span className={`status-badge text-xs ${
                        part.quality_grade === 'A' ? 'bg-green-100 text-green-800' :
                        part.quality_grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {part.quality_grade || '-'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{part.part_name}</h3>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleEdit(part)}
                        className="w-11 h-11 flex items-center justify-center text-blue-600 active:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(part.id, part.part_name)}
                        className="w-11 h-11 flex items-center justify-center text-red-600 active:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Loai</span>
                    <span className="text-gray-900">{part.category || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Nhom</span>
                    <span className="text-gray-900">{part.group || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Gia nhap</span>
                    <span className="text-gray-900">{part.cost_price.toLocaleString('vi-VN')}d</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Gia ban</span>
                    <span className="font-medium text-gray-900">{part.sale_price.toLocaleString('vi-VN')}d</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">NCC</span>
                    <span className="text-gray-900 truncate ml-2">{part.supplier_name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Ton kho</span>
                    <span className={`font-semibold ${part.stock_qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {part.stock_qty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingPart ? 'Chinh Sua Phu Tung' : 'Them Phu Tung Moi'}
              </h2>
              <button
                onClick={closeModal}
                className="w-11 h-11 flex items-center justify-center active:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ma Phu Tung <span className="text-gray-400">(de trong de tu dong tao)</span>
                </label>
                <input
                  type="text"
                  className="input-field w-full py-2.5 text-sm"
                  value={formData.part_code}
                  onChange={(e) => setFormData({ ...formData, part_code: e.target.value })}
                  placeholder="VD: PT-2601-0001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ten Phu Tung <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field w-full py-2.5 text-sm"
                  value={formData.part_name}
                  onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                  required
                  placeholder="VD: Loc gio dong co"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loai</label>
                  <select
                    className="input-field w-full py-2.5 text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Chon loai...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhom</label>
                  <select
                    className="input-field w-full py-2.5 text-sm"
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  >
                    <option value="">Chon nhom...</option>
                    {GROUPS.map(grp => (
                      <option key={grp} value={grp}>{grp}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nha Cung Cap</label>
                <input
                  type="text"
                  className="input-field w-full py-2.5 text-sm"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="VD: Toyota Viet Nam"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gia Nhap (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="input-field w-full py-2.5 text-sm"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gia Ban (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="input-field w-full py-2.5 text-sm"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chat Luong</label>
                  <select
                    className="input-field w-full py-2.5 text-sm"
                    value={formData.quality_grade}
                    onChange={(e) => setFormData({ ...formData, quality_grade: e.target.value })}
                  >
                    {QUALITY_GRADES.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">So Luong Ton</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field w-full py-2.5 text-sm"
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({ ...formData, stock_qty: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 pb-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm min-h-[44px]"
                >
                  Huy
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 text-sm min-h-[44px]"
                >
                  {editingPart ? 'Cap Nhat' : 'Them Moi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
