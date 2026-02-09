import { useState, useEffect } from 'react';
import { api } from '../lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, FileText, ChevronRight } from 'lucide-react';
import { IntakeFormModal } from '../components/vehicle-records/IntakeFormModal';
import { VehicleRecordDetailModal } from '../components/vehicle-records/VehicleRecordDetailModal';

interface VehicleRepairOrder {
  id: string;
  ro_code: string;
  customer_id: string;
  vehicle_id: string;
  received_at: string;
  quote_intent: boolean;
  need_inspection: boolean;
  status: string;
  created_at: string;
  customers: { name: string; phone: string } | null;
  vehicles: { name: string; license_plate: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received: { label: 'Tiep nhan', color: 'bg-blue-50 text-blue-700' },
  inspecting: { label: 'Kiem tra', color: 'bg-yellow-50 text-yellow-700' },
  diagnosed: { label: 'Chan doan', color: 'bg-orange-50 text-orange-700' },
  quoted: { label: 'Bao gia', color: 'bg-teal-50 text-teal-700' },
  approved: { label: 'Duyet', color: 'bg-emerald-50 text-emerald-700' },
  in_progress: { label: 'Sua chua', color: 'bg-blue-50 text-blue-700' },
  completed: { label: 'Hoan thanh', color: 'bg-emerald-50 text-emerald-700' },
  delivered: { label: 'Giao xe', color: 'bg-gray-100 text-gray-600' },
};

const STATUS_ORDER = ['received', 'inspecting', 'diagnosed', 'quoted', 'approved', 'in_progress', 'completed', 'delivered'];

export function VehicleRecords() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<VehicleRepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await api.get<VehicleRepairOrder[]>('api-vehicles', '/');
    setOrders(data || []);
    setLoading(false);
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.ro_code.toLowerCase().includes(searchLower) ||
      order.customers?.name.toLowerCase().includes(searchLower) ||
      order.customers?.phone.toLowerCase().includes(searchLower) ||
      order.vehicles?.license_plate.toLowerCase().includes(searchLower) ||
      order.vehicles?.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-3 space-y-3">
        {isAdmin && (
          <button onClick={() => setShowIntakeModal(true)} className="btn-primary w-full">
            <Plus className="w-5 h-5" />
            Tao ho so moi
          </button>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Tim ma ho so, khach hang, bien so..."
            className="input-field pl-11 py-3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 w-full" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm font-medium">
              {searchTerm ? 'Khong tim thay ho so nao' : 'Chua co ho so nao'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredOrders.map((order) => {
              const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
              const currentIndex = STATUS_ORDER.indexOf(order.status);

              return (
                <button
                  key={order.id}
                  className="card-pressable w-full text-left"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-[15px]">{order.ro_code}</p>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {order.vehicles?.license_plate} - {order.vehicles?.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{order.customers?.name}</p>
                      </div>
                      <span className={`status-badge flex-shrink-0 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-3">
                      {STATUS_ORDER.map((step, idx) => {
                        const isCompleted = currentIndex > idx;
                        const isCurrent = currentIndex === idx;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`w-2 h-2 rounded-full ${
                              isCompleted ? 'bg-emerald-500' :
                              isCurrent ? 'bg-red-500' :
                              'bg-gray-200'
                            }`} />
                            {idx < STATUS_ORDER.length - 1 && (
                              <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        );
                      })}
                      <ChevronRight className="w-4 h-4 text-gray-300 ml-1 flex-shrink-0" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showIntakeModal && (
        <IntakeFormModal
          onClose={() => setShowIntakeModal(false)}
          onSuccess={() => { setShowIntakeModal(false); fetchOrders(); }}
        />
      )}

      {selectedOrderId && (
        <VehicleRecordDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdate={fetchOrders}
        />
      )}
    </div>
  );
}
