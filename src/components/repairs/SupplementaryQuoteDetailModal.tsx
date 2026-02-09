import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import type { SupplementaryQuote, SupplementaryQuoteItem, RepairType } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Printer, Trash2, Car, Calendar, User, FileText, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import SupplementaryQuotePrintTemplate from './SupplementaryQuotePrintTemplate';

interface SupplementaryQuoteDetailModalProps {
  quoteId: string;
  orderId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function SupplementaryQuoteDetailModal({
  quoteId,
  orderId: _orderId,
  onClose,
  onUpdate,
}: SupplementaryQuoteDetailModalProps) {
  const { isAdmin, isLead } = useAuth();
  const [quote, setQuote] = useState<SupplementaryQuote | null>(null);
  const [items, setItems] = useState<SupplementaryQuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);
  const [showApproveSection, setShowApproveSection] = useState(false);
  const [repairTypes, setRepairTypes] = useState<Record<number, RepairType>>({});
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [quoteId]);

  const fetchDetail = async () => {
    setLoading(true);

    const result = await api.get<{ quote: SupplementaryQuote; items: SupplementaryQuoteItem[] }>(
      'api-repairs',
      `/squotes/${quoteId}`
    );

    if (result?.quote) setQuote(result.quote);
    if (result?.items) {
      setItems(result.items);
      const defaults: Record<number, RepairType> = {};
      result.items.forEach((_: SupplementaryQuoteItem, idx: number) => {
        defaults[idx] = 'sua_chua';
      });
      setRepairTypes(defaults);
    }

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
    if (!window.confirm('Ban co chac chan muon xoa bao gia nay? Hanh dong nay khong the hoan tac.')) {
      return;
    }

    await api.del('api-repairs', `/squotes/${quoteId}`);

    onUpdate();
  };

  const handleApproveAndConvert = async () => {
    if (!quote) return;
    setApproving(true);

    const repairItems = items.map((item, i) => ({
      name: item.component_name || item.repair_method,
      status: 'pending',
      repair_type: repairTypes[i] || 'sua_chua',
    }));

    try {
      await api.post('api-repairs', `/squotes/${quoteId}/approve`, {
        repairItems,
      });
    } catch {
      setApproving(false);
      return;
    }

    setApproving(false);
    onUpdate();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-100 text-gray-600">
            Moi tao
          </span>
        );
      case 'approved':
        return (
          <span className="text-xs font-medium px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700">
            Da duyet
          </span>
        );
      case 'converted':
        return (
          <span className="text-xs font-medium px-3 py-1 rounded-lg bg-blue-100 text-blue-700">
            Da len lenh
          </span>
        );
      default:
        return null;
    }
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
      <div className="fullscreen-modal" style={{ zIndex: 57 }}>
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
          <button onClick={onClose} className="w-14 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="flex-1 text-center font-bold text-white truncate">
            Chi Tiet Bao Gia Bo Sung
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

  if (!quote) return null;

  return (
    <div className="fullscreen-modal" style={{ zIndex: 57 }}>
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
        <button onClick={onClose} className="w-14 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="flex-1 text-center font-bold text-white truncate text-sm">
          Chi Tiet Bao Gia Bo Sung
        </h2>
        <div className="flex items-center">
          <button
            onClick={handlePrint}
            className="w-11 h-11 flex items-center justify-center text-white active:bg-white/20 rounded-xl"
          >
            <Printer className="w-5 h-5" />
          </button>
          {(isAdmin || isLead) && (
            <button
              onClick={handleDelete}
              className="w-11 h-11 flex items-center justify-center text-white active:bg-white/20 rounded-xl"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 pb-32 space-y-4">
        <div className="flex items-center justify-center">
          {getStatusBadge(quote.status)}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <User className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Khach hang</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{quote.customer_name}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Car className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Ten xe</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{quote.vehicle_name}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-3 border border-red-200">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3 h-3 text-red-400" />
              <p className="text-[10px] text-red-400 uppercase tracking-wider font-medium">Bien so xe</p>
            </div>
            <p className="text-sm font-bold text-red-700 font-mono">{quote.license_plate}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Ngay bao gia</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{formatDate(quote.quote_date)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-red-200" />
            <p className="text-sm text-red-100">Tong cong</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(quote.total_amount)} VND</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Hang muc bao gia ({items.length})
          </h3>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full flex-shrink-0">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 flex-1 pt-0.5">{item.component_name}</h4>
                </div>
                <div className="space-y-2 ml-10">
                  {renderField('Trieu chung', item.symptom)}
                  {renderField('Ket qua chan doan', item.diagnosis_result)}
                  {renderField('Phuong an sua chua', item.repair_method)}
                  {renderField('Vat tu / Phu tung', item.part_name)}
                  <div className="flex items-center gap-4 pt-1">
                    <div>
                      <span className="text-xs text-gray-400">SL</span>
                      <p className="text-sm font-medium text-gray-800">{item.quantity}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Don gia</span>
                      <p className="text-sm font-medium text-gray-800">{formatNumber(item.unit_price)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Cong tho</span>
                      <p className="text-sm font-medium text-gray-800">{formatNumber(item.labor_cost)}</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2 mt-1">
                    <span className="text-xs text-red-500">Thanh tien</span>
                    <p className="text-sm font-bold text-red-600">{formatNumber(item.total_amount)} VND</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {quote.notes && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Ghi chu / Dieu kien</h3>
            <p className="text-sm text-gray-600">{quote.notes}</p>
          </div>
        )}

        {quote.status === 'draft' && !showApproveSection && (
          <button
            type="button"
            onClick={() => setShowApproveSection(true)}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
          >
            <CheckCircle2 className="w-5 h-5" />
            Duyet & Len Lenh
          </button>
        )}

        {quote.status === 'draft' && showApproveSection && (
          <div className="card p-4 space-y-4 border-2 border-red-200">
            <h3 className="text-sm font-bold text-gray-900">Chon loai sua chua cho tung hang muc</h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                    {item.component_name || item.repair_method}
                  </span>
                  <div className="flex rounded-xl overflow-hidden border border-gray-300 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setRepairTypes({ ...repairTypes, [index]: 'sua_chua' })}
                      className={`px-3 py-2 text-xs font-medium transition-colors ${
                        repairTypes[index] === 'sua_chua'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-600 active:bg-gray-100'
                      }`}
                    >
                      Sua chua
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepairTypes({ ...repairTypes, [index]: 'dong_son' })}
                      className={`px-3 py-2 text-xs font-medium transition-colors ${
                        repairTypes[index] === 'dong_son'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-600 active:bg-gray-100'
                      }`}
                    >
                      Dong son
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowApproveSection(false)}
                className="btn-secondary flex-1"
              >
                Huy
              </button>
              <button
                type="button"
                onClick={handleApproveAndConvert}
                disabled={approving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {approving && <Loader2 className="w-4 h-4 animate-spin" />}
                {approving ? 'Dang xu ly...' : 'Xac Nhan'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPrint && quote && (
        <SupplementaryQuotePrintTemplate quote={quote} items={items} />
      )}
    </div>
  );
}
