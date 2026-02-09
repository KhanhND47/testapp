import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import type { SupplementaryRepairSlip } from '../../lib/supabase';
import { X, Plus, FileText, Calendar, User, ChevronRight } from 'lucide-react';
import SupplementarySlipFormModal from './SupplementarySlipFormModal';
import SupplementarySlipDetailModal from './SupplementarySlipDetailModal';

interface SupplementarySlipListModalProps {
  orderId: string;
  customerName: string;
  vehicleName: string;
  licensePlate: string;
  onClose: () => void;
}

export default function SupplementarySlipListModal({
  orderId,
  customerName,
  vehicleName,
  licensePlate,
  onClose,
}: SupplementarySlipListModalProps) {
  const [slips, setSlips] = useState<SupplementaryRepairSlip[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);

  useEffect(() => {
    fetchSlips();
  }, [orderId]);

  const fetchSlips = async () => {
    setLoading(true);

    const result = await api.get<{ slips: SupplementaryRepairSlip[]; itemCounts: Record<string, number> }>(
      'api-repairs',
      `/${orderId}/supplementary-slips`
    );

    const fetchedSlips = result?.slips || (Array.isArray(result) ? result : []) as SupplementaryRepairSlip[];
    setSlips(fetchedSlips);

    if (result?.itemCounts) {
      setItemCounts(result.itemCounts);
    }

    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fullscreen-modal" style={{ zIndex: 52 }}>
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="flex items-center h-14">
          <button onClick={onClose} className="w-14 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 text-center min-w-0">
            <h2 className="font-bold text-white truncate text-base">Phieu Phat Sinh</h2>
            <p className="text-xs text-red-100 truncate">{licensePlate}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-14 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 pb-safe-bottom space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-48" />
                <div className="skeleton h-3 w-24" />
              </div>
            ))}
          </div>
        ) : slips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Chua co phieu phat sinh nao</p>
            <p className="text-gray-400 text-xs text-center mb-6">
              Tao phieu phat sinh khi phat hien hang muc sua chua bo sung
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tao phieu phat sinh
            </button>
          </div>
        ) : (
          slips.map((slip) => (
            <div
              key={slip.id}
              className="card-pressable p-4 active:scale-[0.98]"
              onClick={() => setSelectedSlipId(slip.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(slip.diagnosis_date)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      slip.status === 'da_duyet'
                        ? 'bg-emerald-100 text-emerald-700'
                        : slip.status === 'da_bao_gia'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {slip.status === 'da_duyet' ? 'Da duyet' : slip.status === 'da_bao_gia' ? 'Da bao gia' : 'Cho xac nhan'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {itemCounts[slip.id] || 0} hang muc
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      {slip.created_by} - {formatDateTime(slip.created_at)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <SupplementarySlipFormModal
          orderId={orderId}
          customerName={customerName}
          vehicleName={vehicleName}
          licensePlate={licensePlate}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchSlips();
          }}
        />
      )}

      {selectedSlipId && (
        <SupplementarySlipDetailModal
          slipId={selectedSlipId}
          orderId={orderId}
          onClose={() => setSelectedSlipId(null)}
          onDelete={() => {
            setSelectedSlipId(null);
            fetchSlips();
          }}
        />
      )}
    </div>
  );
}
