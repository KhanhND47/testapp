import { useState, useEffect } from 'react';
import { FileText, Search, Calendar, User, Car } from 'lucide-react';
import { api } from '../lib/api/client';
import QuoteDetailModal from '../components/quotes/QuoteDetailModal';

interface DiagnosisReport {
  id: string;
  diagnosis_date: string;
  created_at: string;
  technician_id: string;
  app_users: {
    display_name: string;
  } | null;
  vehicle_repair_orders: {
    ro_code: string;
    status: string;
    customers: {
      name: string;
      phone: string;
    };
    vehicles: {
      license_plate: string;
      name: string;
    };
  };
}

export default function Quotes() {
  const [reports, setReports] = useState<DiagnosisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<DiagnosisReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('api-quotes', '/');
      setReports(data as any);
    } catch (error: any) {
      console.error('Error loading diagnosis reports:', error);
      alert('Loi khi tai danh sach phieu chan doan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report: any) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      report.vehicle_repair_orders.ro_code.toLowerCase().includes(searchLower) ||
      report.vehicle_repair_orders.customers.name.toLowerCase().includes(searchLower) ||
      report.vehicle_repair_orders.vehicles.license_plate.toLowerCase().includes(searchLower)
    );

    if (activeTab === 'pending') {
      return matchesSearch && report.quote && (report.quote.status === 'draft' || report.quote.status === 'sent');
    }

    if (activeTab === 'approved') {
      return matchesSearch && report.quote && report.quote.status === 'approved';
    }

    return matchesSearch;
  });

  const getQuoteStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'draft': { label: 'Nhap', className: 'bg-gray-100 text-gray-800' },
      'sent': { label: 'Da gui', className: 'bg-blue-100 text-blue-800' },
      'approved': { label: 'Da duyet', className: 'bg-green-100 text-green-800' },
      'rejected': { label: 'Tu choi', className: 'bg-red-100 text-red-800' },
    };
    const status_info = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`status-badge ${status_info.className}`}>
        {status_info.label}
      </span>
    );
  };

  const handleViewDetail = (report: DiagnosisReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900">Danh Sach Bao Gia</h1>
          <p className="text-sm text-gray-600 mt-0.5">Quan ly phieu chan doan va tao bao gia</p>
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
        <h1 className="text-xl font-bold text-gray-900">Danh Sach Bao Gia</h1>
        <p className="text-sm text-gray-600 mt-0.5">Quan ly phieu chan doan va tao bao gia</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="tab-bar">
          <button
            onClick={() => setActiveTab('all')}
            className={activeTab === 'all' ? 'tab-item-active' : 'tab-item'}
          >
            Tat Ca
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={activeTab === 'pending' ? 'tab-item-active' : 'tab-item'}
          >
            Cho Duyet
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={activeTab === 'approved' ? 'tab-item-active' : 'tab-item'}
          >
            Da Duyet
          </button>
        </div>

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

        {filteredReports.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Khong co phieu chan doan nao</p>
            <p className="text-xs text-gray-400 mt-1">Phieu chan doan se xuat hien khi ky thuat vien hoan thanh kiem tra</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReports.map((report: any) => (
              <div
                key={report.id}
                className="card card-pressable p-4"
                onClick={() => handleViewDetail(report)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold text-blue-600">
                    {report.vehicle_repair_orders.ro_code}
                  </span>
                  {report.quote ? (
                    getQuoteStatusBadge(report.quote.status)
                  ) : (
                    <span className="text-xs text-gray-400">Chua co BG</span>
                  )}
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">
                      {report.vehicle_repair_orders.customers.name}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {report.vehicle_repair_orders.customers.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-mono font-medium text-gray-900">
                      {report.vehicle_repair_orders.vehicles.license_plate}
                    </span>
                    <span className="text-gray-500 text-xs truncate">
                      {report.vehicle_repair_orders.vehicles.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {new Date(report.diagnosis_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </span>
                    {report.app_users?.display_name && (
                      <span className="text-gray-400 text-xs ml-auto truncate">
                        KTV: {report.app_users.display_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedReport && (
        <QuoteDetailModal
          report={selectedReport}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
          onSuccess={() => {
            loadReports();
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
        />
      )}
    </div>
  );
}
