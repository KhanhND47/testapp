import { useState, useEffect } from 'react';
import { FileText, Search, Calendar, User, Car } from 'lucide-react';
import { api } from '../lib/api/client';
import ServiceRequestDetailModal from '../components/quotes/ServiceRequestDetailModal';

interface ServiceRequest {
  id: string;
  request_code: string;
  request_date: string;
  start_time: string | null;
  expected_finish_time: string | null;
  total_amount: number;
  status: string;
  created_at: string;
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
  vr_quotes: {
    quote_code: string;
  } | null;
}

export default function ServiceRequests() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'confirmed'>('all');
  const [selectedServiceRequestId, setSelectedServiceRequestId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      const data = await api.get<ServiceRequest[]>('api-service-requests', '/');
      setServiceRequests(data || []);
    } catch (error: any) {
      console.error('Error loading service requests:', error);
      alert('Loi khi tai danh sach phieu yeu cau dich vu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = serviceRequests.filter(request => {
    const matchesSearch =
      request.request_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicle_repair_orders?.ro_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicle_repair_orders?.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicle_repair_orders?.vehicles?.license_plate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      request.status === activeTab;

    return matchesSearch && matchesTab;
  });

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: 'Nhap', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Da gui', color: 'bg-blue-100 text-blue-800' },
      confirmed: { label: 'Da xac nhan', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Da huy', color: 'bg-red-100 text-red-800' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getTabCount = (tab: string) => {
    if (tab === 'all') return serviceRequests.length;
    return serviceRequests.filter(r => r.status === tab).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Phieu Yeu Cau Dich Vu</h1>
        <p className="text-sm text-gray-600 mt-0.5">Quan ly cac phieu yeu cau dich vu</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="tab-bar overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={activeTab === 'all' ? 'tab-item-active' : 'tab-item'}
          >
            Tat ca ({getTabCount('all')})
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={activeTab === 'draft' ? 'tab-item-active' : 'tab-item'}
          >
            Nhap ({getTabCount('draft')})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={activeTab === 'sent' ? 'tab-item-active' : 'tab-item'}
          >
            Da gui ({getTabCount('sent')})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={activeTab === 'confirmed' ? 'tab-item-active' : 'tab-item'}
          >
            Xac nhan ({getTabCount('confirmed')})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tim kiem theo ma phieu, ma ho so, KH..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-9 pr-3 py-2.5 text-sm"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
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
        ) : filteredRequests.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Khong tim thay phieu yeu cau dich vu nao</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRequests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              return (
                <div
                  key={request.id}
                  className="card card-pressable p-4"
                  onClick={() => {
                    setSelectedServiceRequestId(request.id);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">{request.request_code}</span>
                    </div>
                    <span className={`status-badge ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 truncate">
                        {request.vehicle_repair_orders?.customers?.name || '-'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {request.vehicle_repair_orders?.customers?.phone || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-mono font-medium text-gray-900">
                        {request.vehicle_repair_orders?.vehicles?.license_plate || '-'}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {request.vehicle_repair_orders?.vehicles?.name || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">
                        {new Date(request.request_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>Ho so: {request.vehicle_repair_orders?.ro_code}</div>
                      {request.vr_quotes && <div>Bao gia: {request.vr_quotes.quote_code}</div>}
                      {request.app_users && <div>Nguoi tao: {request.app_users.display_name}</div>}
                    </div>
                    <p className="font-bold text-green-600 text-base">
                      {request.total_amount.toLocaleString()} VND
                    </p>
                  </div>

                  {request.start_time && request.expected_finish_time && (
                    <div className="mt-2 text-xs bg-blue-50 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-gray-500">Bat dau: </span>
                        <span className="font-medium text-gray-900">
                          {new Date(request.start_time).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Du kien: </span>
                        <span className="font-medium text-gray-900">
                          {new Date(request.expected_finish_time).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDetailModal && selectedServiceRequestId && (
        <ServiceRequestDetailModal
          serviceRequestId={selectedServiceRequestId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedServiceRequestId(null);
          }}
          onUpdate={() => {
            loadServiceRequests();
          }}
        />
      )}
    </div>
  );
}
