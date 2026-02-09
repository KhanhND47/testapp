import { useState, useEffect } from 'react';
import { FileText, Search, Calendar, User, Car, Printer } from 'lucide-react';
import { api } from '../lib/api/client';
import PaymentInvoiceDetailModal from '../components/invoices/PaymentInvoiceDetailModal';

interface QualityInspection {
  id: string;
  inspection_date: string;
  overall_result: string;
  created_at: string;
  general_repair_orders: {
    id: string;
    ro_code: string;
    license_plate: string;
    customer_name: string;
    customer_phone: string;
    vehicle_name: string;
    receive_date: string;
    return_date: string;
  };
  app_users: {
    display_name: string;
  } | null;
}

export default function PaymentInvoices() {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const data = await api.get<QualityInspection[]>('api-invoices');
      setInspections(data || []);
    } catch (error: any) {
      console.error('Error loading inspections:', error);
      alert('Loi khi tai danh sach phieu thanh toan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = inspections.filter((inspection) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      inspection.general_repair_orders.ro_code.toLowerCase().includes(searchLower) ||
      inspection.general_repair_orders.customer_name.toLowerCase().includes(searchLower) ||
      inspection.general_repair_orders.license_plate.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetail = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900">Phieu Thanh Toan</h1>
          <p className="text-sm text-gray-600 mt-0.5">Quan ly va in phieu thanh toan</p>
        </div>
        <div className="px-4 pb-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4">
              <div className="space-y-2">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Phieu Thanh Toan</h1>
        <p className="text-sm text-gray-600 mt-0.5">Quan ly va in phieu thanh toan cho lenh da nghiem thu dat</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tim theo ma phieu, ten KH, bien so..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-9 pr-3 py-2.5 text-sm"
          />
        </div>

        {filteredInspections.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Khong co phieu thanh toan nao</p>
            <p className="text-xs text-gray-400 mt-1">Phieu thanh toan se xuat hien sau khi hoan thanh nghiem thu chat luong</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredInspections.map((inspection) => (
              <div
                key={inspection.id}
                className="card card-pressable p-4"
                onClick={() => handleViewDetail(inspection)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold text-blue-600">
                    {inspection.general_repair_orders.ro_code}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(inspection);
                    }}
                    className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm min-h-[44px]"
                  >
                    <Printer className="w-4 h-4" />
                    In
                  </button>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">
                      {inspection.general_repair_orders.customer_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {inspection.general_repair_orders.customer_phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-mono font-medium text-gray-900">
                      {inspection.general_repair_orders.license_plate}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {inspection.general_repair_orders.vehicle_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {new Date(inspection.inspection_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </span>
                    {inspection.app_users?.display_name && (
                      <span className="text-gray-400 text-xs ml-auto truncate">
                        KT: {inspection.app_users.display_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedInspection && (
        <PaymentInvoiceDetailModal
          inspection={selectedInspection}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInspection(null);
          }}
          onSuccess={() => {
            loadInspections();
            setShowDetailModal(false);
            setSelectedInspection(null);
          }}
        />
      )}
    </div>
  );
}
