import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import type { SupplementaryQuote } from '../../lib/supabase';
import { X, Calendar, User, ChevronRight, FileText } from 'lucide-react';
import SupplementaryQuoteDetailModal from './SupplementaryQuoteDetailModal';

interface SupplementaryQuoteListModalProps {
  orderId: string;
  licensePlate: string;
  onClose: () => void;
}

export default function SupplementaryQuoteListModal({
  orderId,
  licensePlate,
  onClose,
}: SupplementaryQuoteListModalProps) {
  const [quotes, setQuotes] = useState<SupplementaryQuote[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [orderId]);

  const fetchQuotes = async () => {
    setLoading(true);

    const result = await api.get<{ quotes: SupplementaryQuote[]; itemCounts: Record<string, number> }>(
      'api-repairs',
      `/${orderId}/supplementary-quotes`
    );

    const fetchedQuotes = result?.quotes || (Array.isArray(result) ? result : []) as SupplementaryQuote[];
    setQuotes(fetchedQuotes);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">
            Moi tao
          </span>
        );
      case 'approved':
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">
            Da duyet
          </span>
        );
      case 'converted':
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">
            Da len lenh
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fullscreen-modal" style={{ zIndex: 53 }}>
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="flex items-center h-14">
          <button onClick={onClose} className="w-14 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 text-center min-w-0">
            <h2 className="font-bold text-white truncate text-base">Bao Gia Bo Sung</h2>
            <p className="text-xs text-red-100 truncate">{licensePlate}</p>
          </div>
          <div className="w-14" />
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
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Chua co bao gia bo sung nao</p>
            <p className="text-gray-400 text-xs text-center">
              Bao gia bo sung se duoc tao tu phieu phat sinh
            </p>
          </div>
        ) : (
          quotes.map((quote) => (
            <div
              key={quote.id}
              className="card-pressable p-4 active:scale-[0.98]"
              onClick={() => setSelectedQuoteId(quote.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(quote.quote_date)}
                    </span>
                    {getStatusBadge(quote.status)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-red-600">
                      {quote.total_amount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {itemCounts[quote.id] || 0} hang muc
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      {quote.created_by} - {formatDateTime(quote.created_at)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))
        )}
      </div>

      {selectedQuoteId && (
        <SupplementaryQuoteDetailModal
          quoteId={selectedQuoteId}
          orderId={orderId}
          onClose={() => setSelectedQuoteId(null)}
          onUpdate={() => {
            setSelectedQuoteId(null);
            fetchQuotes();
          }}
        />
      )}
    </div>
  );
}
