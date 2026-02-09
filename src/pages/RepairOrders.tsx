import { useState, useEffect } from 'react';
import type { GeneralRepairOrder, RepairWorker } from '../lib/supabase';
import { api } from '../lib/api/client';
import { Plus, Car, Search, ChevronRight, Clock, AlertTriangle, Wrench, User, Package } from 'lucide-react';
import RepairOrderFormModal from '../components/repairs/RepairOrderFormModal';
import RepairOrderDetailModal from '../components/repairs/RepairOrderDetailModal';
import WorkerManagement from '../components/repairs/WorkerManagement';
import { useAuth } from '../contexts/AuthContext';

interface OrderWithProgress extends GeneralRepairOrder {
  totalItems: number;
  completedItems: number;
  progress: number;
  daysRemaining: number;
}

type TabType = 'orders' | 'completed' | 'management';

export function RepairOrders() {
  const { user, isAdmin, isLead, isSales } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<OrderWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentWorker, setCurrentWorker] = useState<RepairWorker | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchOrders(true);
    loadCurrentWorker();
  }, [user]);

  const loadCurrentWorker = () => {
    const saved = localStorage.getItem('current_repair_worker');
    if (saved) {
      setCurrentWorker(JSON.parse(saved));
    }
  };

  const fetchOrders = async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
      setOrders([]);
    } else {
      setLoadingMore(true);
    }

    if (!user) {
      setOrders([]);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      const params: Record<string, string> = {
        role: user.role,
        offset: reset ? '0' : offset.toString(),
        limit: ITEMS_PER_PAGE.toString()
      };
      if (user.worker_id) params.worker_id = user.worker_id;

      const response = await api.get<{ orders: GeneralRepairOrder[]; hasMore: boolean }>('api-repairs', '/', params);

      if (response && Array.isArray(response.orders)) {
        const ordersWithProgress: OrderWithProgress[] = response.orders.map(order => {
          const returnDate = new Date(order.return_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          returnDate.setHours(0, 0, 0, 0);
          const daysRemaining = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          return {
            ...order,
            totalItems: (order as any).totalItems ?? 0,
            completedItems: (order as any).completedItems ?? 0,
            progress: (order as any).progress ?? 0,
            daysRemaining,
          };
        });

        if (reset) {
          setOrders(ordersWithProgress);
        } else {
          setOrders(prev => [...prev, ...ordersWithProgress]);
        }
        setHasMore(response.hasMore);
        if (!reset) {
          setOffset(offset + ITEMS_PER_PAGE);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setHasMore(false);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (hasMore && !loading && !loadingMore && orders.length > 0) {
      fetchOrders(false);
    }
  }, [hasMore, orders.length]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'completed') return matchesSearch && order.status === 'completed';
    if (activeTab === 'orders') return matchesSearch && order.status !== 'completed';
    return matchesSearch;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const overdueCount = orders.filter(o => o.status !== 'completed' && o.daysRemaining < 0).length;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { accent: 'from-emerald-400 to-teal-400', dot: 'bg-emerald-400' };
      case 'in_progress':
        return { accent: 'from-amber-400 to-orange-400', dot: 'bg-amber-400' };
      default:
        return { accent: 'from-slate-300 to-slate-400', dot: 'bg-slate-300' };
    }
  };

  const getDaysConfig = (days: number) => {
    if (days < 0) return { text: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-200/40', icon: 'text-red-400' };
    if (days <= 1) return { text: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-200/40', icon: 'text-amber-400' };
    if (days <= 3) return { text: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-200/40', icon: 'text-blue-400' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-200/40', icon: 'text-emerald-400' };
  };

  const getProgressGradient = (progress: number) => {
    if (progress === 100) return 'from-emerald-400 via-teal-400 to-cyan-400';
    if (progress > 50) return 'from-blue-400 via-indigo-400 to-violet-400';
    return 'from-red-400 via-rose-400 to-pink-400';
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-3 space-y-3">
        {(isAdmin || isLead) && (
          <div className="tab-bar">
            <button
              onClick={() => setActiveTab('orders')}
              className={`tab-item ${activeTab === 'orders' ? 'tab-item-active' : ''}`}
            >
              Danh sach
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`tab-item ${activeTab === 'completed' ? 'tab-item-active' : ''}`}
            >
              Hoan thanh
            </button>
            {(isAdmin || isLead) && (
              <button
                onClick={() => setActiveTab('management')}
                className={`tab-item ${activeTab === 'management' ? 'tab-item-active' : ''}`}
              >
                Quan ly
              </button>
            )}
          </div>
        )}

        {(isAdmin || isLead || isSales) && (activeTab === 'orders' || activeTab === 'completed') && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary w-full"
          >
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            Tao lenh moi
          </button>
        )}
      </div>

      {activeTab === 'management' ? (
        <div className="px-4">
          <WorkerManagement />
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-4">
          {activeTab === 'orders' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="relative overflow-hidden rounded-[20px] p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(203, 213, 225, 0.08) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-300 to-slate-400 rounded-full opacity-60" />
                <div className="w-9 h-9 mx-auto mb-2 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)' }}>
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-700 tracking-tight leading-none">{pendingCount}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Cho xu ly</p>
              </div>

              <div className="relative overflow-hidden rounded-[20px] p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-60" />
                <div className="w-9 h-9 mx-auto mb-2 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-amber-600 tracking-tight leading-none">{inProgressCount}</p>
                <p className="text-[11px] text-amber-400 font-medium mt-1">Dang lam</p>
              </div>

              <div className="relative overflow-hidden rounded-[20px] p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(244, 114, 182, 0.06) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-pink-400 rounded-full opacity-60" />
                <div className="w-9 h-9 mx-auto mb-2 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f472b6 100%)' }}>
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-red-500 tracking-tight leading-none">{overdueCount}</p>
                <p className="text-[11px] text-red-400/80 font-medium mt-1">Qua han</p>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-300" strokeWidth={1.8} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tim bien so, khach hang, xe..."
              className="input-field pl-11 py-3.5"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-32 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                }}>
                <Car className="w-9 h-9 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-gray-400 font-semibold text-[15px]">Chua co lenh sua chua nao</p>
              <p className="text-gray-300 text-[13px] mt-1.5">Tao lenh moi de bat dau</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const config = getStatusConfig(order.status);
                const daysConfig = getDaysConfig(order.daysRemaining);
                const progressGrad = getProgressGradient(order.progress);

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="card-pressable w-full text-left"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3.5">
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${config.dot} ring-4 ring-white/30`} />
                          <div className={`w-0.5 flex-1 rounded-full bg-gradient-to-b ${config.accent} opacity-30`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="font-bold text-gray-800 text-[17px] tracking-tight">{order.license_plate}</p>
                              {order.waiting_for_parts && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                  <Package className="w-3 h-3" />
                                  Doi phu tung
                                </span>
                              )}
                              {order.ro_code && (
                                <span className="text-[10px] font-semibold text-gray-300 bg-gray-100/50 px-1.5 py-0.5 rounded-md">
                                  {order.ro_code}
                                </span>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2} />
                          </div>

                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Car className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                            <p className="text-[13px] text-gray-500 truncate font-medium">{order.vehicle_name}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                            <p className="text-[12px] text-gray-400 truncate">{order.customer_name}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-3.5">
                            <div className="flex-1">
                              <div className="h-[5px] bg-white/40 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${progressGrad} transition-all`}
                                  style={{ width: `${order.progress}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 tabular-nums w-9 text-right">{order.progress}%</span>
                            {order.status !== 'completed' && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${daysConfig.text} ${daysConfig.bg} border ${daysConfig.border}`}>
                                {order.daysRemaining < 0 ? `Tre ${Math.abs(order.daysRemaining)}d` : `${order.daysRemaining}d`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!searchTerm && loadingMore && filteredOrders.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-violet-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <RepairOrderFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchOrders(true);
          }}
        />
      )}

      {selectedOrderId && (
        <RepairOrderDetailModal
          orderId={selectedOrderId}
          currentWorker={currentWorker}
          onClose={() => setSelectedOrderId(null)}
          onUpdate={() => fetchOrders(true)}
        />
      )}
    </div>
  );
}
