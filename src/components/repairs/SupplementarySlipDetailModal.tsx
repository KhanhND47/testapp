import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import type { SupplementaryRepairSlip, SupplementaryRepairItem } from '../../lib/supabase';
import { X, Printer, Trash2, Car, Calendar, User, FileText, FileCheck } from 'lucide-react';
import SupplementarySlipPrintTemplate from './SupplementarySlipPrintTemplate';
import SupplementaryQuoteFormModal from './SupplementaryQuoteFormModal';

interface SupplementarySlipDetailModalProps {
  slipId: string;
  orderId: string;
  onClose: () => void;
  onDelete: () => void;
}

export default function SupplementarySlipDetailModal({
  slipId,
  orderId,
  onClose,
  onDelete,
}: SupplementarySlipDetailModalProps) {
  const [slip, setSlip] = useState<SupplementaryRepairSlip | null>(null);
  const [items, setItems] = useState<SupplementaryRepairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [slipId]);

  const fetchDetail = async () => {
    setLoading(true);

    const result = await api.get<{ slip: SupplementaryRepairSlip; items: SupplementaryRepairItem[] }>(
      'api-repairs',
      `/slips/${slipId}`
    );

    if (result?.slip) setSlip(result.slip);
    if (result?.items) setItems(result.items);

    setLoading(false);
  };

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 100);
  };

  const handleDelete = async () => {
    if (!window.confirm('Ban co chac chan muon xoa phieu phat sinh nay? Hanh dong nay khong the hoan tac.')) {
      return;
    }

    await api.del('api-repairs', `/slips/${slipId}`);

    onDelete();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderField = (label: string, value: string) => {
    if (!value) return null;
    return (
      <div>
        <span className="text-xs text-gray-400">{label}</span>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fullscreen-modal" style={{ zIndex: 56 }}>
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
          <button onClick={onClose} className="w-14 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="flex-1 text-center font-bold text-white truncate">
            Chi Tiet Phieu Phat Sinh
          </h2>
          <div className="w-14" />
        </div>
        <div className="p-4 space-y-4">
          <div className="card p-4 space-y-3">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-56" />
            <div className="skeleton h-3 w-32" />
          </div>
          <div className="card p-4 space-y-3">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!slip) return null;

  return (
    <div className="fullscreen-modal" style={{ zIndex: 56 }}>
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
        <button onClick={onClose} className="w-14 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="flex-1 text-center font-bold text-white truncate text-sm">
          Chi Tiet Phieu Phat Sinh
        </h2>
        <div className="flex items-center">
          <button
            onClick={handlePrint}
            className="w-11 h-11 flex items-center justify-center text-white active:bg-white/20 rounded-xl"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="w-11 h-11 flex items-center justify-center text-white active:bg-white/20 rounded-xl"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 pb-safe-bottom space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <User className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Khach hang</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{slip.customer_name}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Car className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Ten xe</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{slip.vehicle_name}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-3 border border-red-200">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3 h-3 text-red-400" />
              <p className="text-[10px] text-red-400 uppercase tracking-wider font-medium">Bien so xe</p>
            </div>
            <p className="text-sm font-bold text-red-700 font-mono">{slip.license_plate}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Ngay chan doan</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{formatDate(slip.diagnosis_date)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Trang thai:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              slip.status === 'da_duyet'
                ? 'bg-emerald-100 text-emerald-700'
                : slip.status === 'da_bao_gia'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {slip.status === 'da_duyet' ? 'Da duyet' : slip.status === 'da_bao_gia' ? 'Da bao gia' : 'Cho xac nhan'}
            </span>
          </div>
          {slip.status === 'cho_xac_nhan' && (
            <button
              onClick={() => setShowQuoteForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-xl active:bg-red-600 active:scale-[0.97] transition-all"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Tao bao gia
            </button>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Hang muc phat sinh ({items.length})
          </h3>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full flex-shrink-0">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 flex-1 pt-0.5">{item.item_name}</h4>
                </div>
                <div className="space-y-2 ml-10">
                  {renderField('Trieu chung', item.symptoms)}
                  {renderField('Ket qua chan doan', item.diagnosis_result)}
                  {renderField('Phuong an sua chua', item.repair_solution)}
                  {renderField('Vat tu', item.materials)}
                  {renderField('So luong', item.quantity)}
                  {renderField('Ghi chu', item.item_notes)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {slip.notes && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Ghi chu / Dieu kien</h3>
            <p className="text-sm text-gray-600">{slip.notes}</p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <p className="text-xs text-amber-700 font-medium text-center">
            Phat sinh chi thuc hien khi co xac nhan cua khach hang
          </p>
        </div>
      </div>

      {showPrint && (
        <SupplementarySlipPrintTemplate slip={slip} items={items} />
      )}

      {showQuoteForm && slip && (
        <SupplementaryQuoteFormModal
          slipId={slipId}
          orderId={orderId}
          customerName={slip.customer_name}
          vehicleName={slip.vehicle_name}
          licensePlate={slip.license_plate}
          onClose={() => setShowQuoteForm(false)}
          onSuccess={() => {
            setShowQuoteForm(false);
            fetchDetail();
          }}
        />
      )}
    </div>
  );
}
