import { useState, useEffect } from 'react';
import type { RepairWorker, RepairItem } from '../../lib/supabase';
import { api } from '../../lib/api/client';
import { Users, Calendar, Clock, CheckCircle, ChevronDown, ChevronRight, Edit, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface WorkerStats {
  worker: RepairWorker;
  inProgressCount: number;
  completedCount: number;
  inProgressItems: ItemWithOrder[];
  completedItems: ItemWithOrder[];
}

interface ItemWithOrder extends RepairItem {
  order?: {
    license_plate: string;
    customer_name: string;
    vehicle_name: string;
  };
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';
type WorkerTypeTab = 'repair' | 'paint';

export default function WorkerManagement() {
  const { isAdmin, isPaintLead, isWorkerLead } = useAuth();
  const [workers, setWorkers] = useState<RepairWorker[]>([]);
  const [stats, setStats] = useState<WorkerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkerTypeTab>(
    isPaintLead ? 'paint' : 'repair'
  );
  const [editingWorker, setEditingWorker] = useState<RepairWorker | null>(null);
  const [editFormData, setEditFormData] = useState({ telegram_chat_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [timeFilter, activeTab]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const workersData = await api.get<RepairWorker[]>('api-repairs', '/workers');

      if (!workersData) {
        setLoading(false);
        return;
      }

      const filteredWorkers = workersData.filter(w => w.worker_type === activeTab);
      setWorkers(filteredWorkers);

      const workerStats: WorkerStats[] = filteredWorkers.map((worker: any) => ({
        worker,
        inProgressCount: worker.inProgressCount ?? 0,
        completedCount: worker.completedCount ?? 0,
        inProgressItems: worker.inProgressItems ?? [],
        completedItems: worker.completedItems ?? [],
      }));

      setStats(workerStats);
    } catch (err) {
      console.error('Error fetching workers:', err);
    }

    setLoading(false);
  };

  const toggleWorker = (workerId: string) => {
    setExpandedWorker(expandedWorker === workerId ? null : workerId);
  };

  const openEditModal = (worker: RepairWorker, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWorker(worker);
    setEditFormData({
      telegram_chat_id: (worker as any).telegram_chat_id || ''
    });
  };

  const closeEditModal = () => {
    setEditingWorker(null);
    setEditFormData({ telegram_chat_id: '' });
    setSaving(false);
  };

  const saveWorkerEdit = async () => {
    if (!editingWorker) return;

    setSaving(true);
    try {
      await api.put('api-repairs', `/items/${editingWorker.id}`, {
        telegram_chat_id: editFormData.telegram_chat_id || null,
      });

      closeEditModal();
      fetchData();
    } catch (error) {
      console.error('Error updating worker:', error);
      alert('Lỗi khi cập nhật thông tin thợ');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt || !completedAt) return '-';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diff = end.getTime() - start.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  const totalInProgress = stats.reduce((sum, s) => sum + s.inProgressCount, 0);
  const totalCompleted = stats.reduce((sum, s) => sum + s.completedCount, 0);

  const canViewRepair = isAdmin || isWorkerLead;
  const canViewPaint = isAdmin || isPaintLead;

  if (loading) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <div className="skeleton h-10 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-2 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="input-field !py-2.5 !px-3 !text-sm flex-1"
          >
            <option value="all">Tat ca</option>
            <option value="today">Hom nay</option>
            <option value="week">7 ngay qua</option>
            <option value="month">30 ngay qua</option>
          </select>
        </div>
      </div>

      {(canViewRepair || canViewPaint) && (
        <div className="tab-bar">
          {canViewRepair && (
            <button
              onClick={() => setActiveTab('repair')}
              className={`tab-item ${activeTab === 'repair' ? 'tab-item-active' : ''}`}
            >
              Sua Chua
            </button>
          )}
          {canViewPaint && (
            <button
              onClick={() => setActiveTab('paint')}
              className={`tab-item ${activeTab === 'paint' ? 'tab-item-active' : ''}`}
            >
              Dong Son
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{workers.length}</p>
          <p className="text-[11px] text-gray-500">Tong so tho</p>
        </div>
        <div className="card p-3 text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-600">{totalInProgress}</p>
          <p className="text-[11px] text-gray-500">Dang lam</p>
        </div>
        <div className="card p-3 text-center">
          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-600">{totalCompleted}</p>
          <p className="text-[11px] text-gray-500">Hoan thanh</p>
        </div>
      </div>

      <div className="card">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 rounded-t-[16px]">
          <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4" />
            Chi tiet cong viec tung tho
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {stats.map((stat) => (
            <div key={stat.worker.id}>
              <div
                onClick={() => toggleWorker(stat.worker.id)}
                className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors min-h-[56px]"
              >
                <div className="w-7 h-7 flex items-center justify-center text-gray-400">
                  {expandedWorker === stat.worker.id ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 text-[15px] truncate">
                      {stat.worker.name}
                    </h4>
                    {isAdmin && (
                      <button
                        onClick={(e) => openEditModal(stat.worker, e)}
                        className="p-2 text-gray-400 active:text-red-600 active:bg-red-50 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -my-2"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold">
                    <Clock className="w-3 h-3" />
                    {stat.inProgressCount}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    {stat.completedCount}
                  </span>
                </div>
              </div>

              {expandedWorker === stat.worker.id && (
                <div className="px-4 pb-4 space-y-3">
                  {stat.inProgressCount > 0 && (
                    <div>
                      <h5 className="font-semibold text-amber-700 text-xs mb-2 flex items-center gap-1.5 pl-1">
                        <Clock className="w-3.5 h-3.5" />
                        Dang lam ({stat.inProgressCount})
                      </h5>
                      <div className="space-y-2">
                        {stat.inProgressItems.map((item) => (
                          <div key={item.id} className="bg-amber-50 border border-amber-200 rounded-[14px] p-3">
                            <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                            {item.order && (
                              <p className="text-xs text-gray-600 mt-1">
                                {item.order.license_plate} - {item.order.vehicle_name}
                              </p>
                            )}
                            <p className="text-[11px] text-amber-600 mt-1">
                              Bat dau: {formatDateTime(item.started_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stat.completedCount > 0 && (
                    <div>
                      <h5 className="font-semibold text-emerald-700 text-xs mb-2 flex items-center gap-1.5 pl-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Hoan thanh ({stat.completedCount})
                      </h5>
                      <div className="space-y-2">
                        {stat.completedItems.map((item) => (
                          <div key={item.id} className="bg-emerald-50 border border-emerald-200 rounded-[14px] p-3">
                            <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                            {item.order && (
                              <p className="text-xs text-gray-600 mt-1">
                                {item.order.license_plate} - {item.order.vehicle_name}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-emerald-600">
                              <span>Xong: {formatDateTime(item.completed_at)}</span>
                              <span>{formatDuration(item.started_at, item.completed_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stat.inProgressCount === 0 && stat.completedCount === 0 && (
                    <p className="text-gray-400 text-center py-6 text-sm">Khong co cong viec nao</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {stats.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chua co tho nao</p>
            </div>
          )}
        </div>
      </div>

      {editingWorker && (
        <>
          <div className="bottom-sheet-overlay" onClick={closeEditModal} />
          <div className="bottom-sheet">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="bg-gradient-to-r from-red-600 to-red-700 mx-4 mt-2 px-4 py-4 rounded-[14px]">
              <h3 className="text-base font-bold text-white">Chinh sua thong tin tho</h3>
              <p className="text-red-100 text-sm mt-0.5">{editingWorker.name}</p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={editFormData.telegram_chat_id}
                  onChange={(e) => setEditFormData({ telegram_chat_id: e.target.value })}
                  placeholder="Nhap Chat ID tu Telegram"
                  className="input-field"
                />
                <p className="mt-2 text-xs text-gray-400">
                  De lay Chat ID, yeu cau tho gui tin nhan /start cho bot Telegram cua ban
                </p>
              </div>

              <div className="flex gap-3 pt-2 pb-2">
                <button
                  onClick={closeEditModal}
                  disabled={saving}
                  className="btn-secondary flex-1"
                >
                  Huy
                </button>
                <button
                  onClick={saveWorkerEdit}
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dang luu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Luu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
