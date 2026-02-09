import { useState, useEffect } from 'react';
import { Search, Eye, FileText, Clock, CheckCircle, User } from 'lucide-react';
import { api } from '../lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import InspectionRequestDetailModal from '../components/vehicle-records/InspectionRequestDetailModal';
import DiagnosisFormModal from '../components/vehicle-records/DiagnosisFormModal';

interface InspectionRequestItemSummary {
  id: string;
  technician_id: string | null;
  app_users: {
    display_name: string;
  } | null;
}

interface InspectionRequest {
  id: string;
  repair_order_id: string;
  check_start_time: string | null;
  expected_result_time: string | null;
  created_at: string;
  vehicle_repair_orders: {
    ro_code: string;
    status: string;
    customers: {
      name: string;
      phone: string;
    };
    vehicles: {
      name: string;
      license_plate: string;
    };
  } | null;
  inspection_request_items?: InspectionRequestItemSummary[] | null;
  diagnosis_reports?: Array<{
    id: string;
    diagnosis_date: string;
  }> | null;
}

type InspectionTab = 'requests' | 'waiting';

const TABS: Array<{ id: InspectionTab; label: string }> = [
  { id: 'requests', label: 'Yeu cau kiem tra' },
  { id: 'waiting', label: 'Danh sach cho kiem tra' },
];

export default function InspectionRequests() {
  const { isAdmin, isWorkerLead } = useAuth();
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<InspectionRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectionTab>('requests');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.get<InspectionRequest[]>('api-vehicles', '/inspection-requests');
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching inspection requests:', error);
      alert('Loi khi tai danh sach yeu cau kiem tra');
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (request: InspectionRequest) => {
    const hasTimeRange = Boolean(request.check_start_time && request.expected_result_time);
    const items = request.inspection_request_items || [];
    const hasItems = items.length > 0;
    const allItemsAssigned = hasItems
      ? items.every((item) => Boolean(item.technician_id))
      : false;
    return hasTimeRange && allItemsAssigned;
  };

  const isWaitingForInspection = (request: InspectionRequest) => {
    return isAssigned(request) && (!request.diagnosis_reports || request.diagnosis_reports.length === 0);
  };

  const filteredBySearch = requests.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    const roCode = request.vehicle_repair_orders?.ro_code || '';
    const customerName = request.vehicle_repair_orders?.customers?.name || '';
    const licensePlate = request.vehicle_repair_orders?.vehicles?.license_plate || '';
    return (
      roCode.toLowerCase().includes(searchLower) ||
      customerName.toLowerCase().includes(searchLower) ||
      licensePlate.toLowerCase().includes(searchLower)
    );
  });

  const requestList = filteredBySearch.filter((request) => !isAssigned(request));
  const waitingList = filteredBySearch.filter((request) => isWaitingForInspection(request));
  const visibleRequests = activeTab === 'requests' ? requestList : waitingList;

  const handleViewDetail = (request: InspectionRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleCreateDiagnosis = (request: InspectionRequest) => {
    setSelectedRequest(request);
    setShowDiagnosisModal(true);
  };

  const getAssignedTechnician = (request: InspectionRequest) => {
    const firstAssigned = (request.inspection_request_items || []).find((item) => item.app_users?.display_name);
    return firstAssigned?.app_users?.display_name || 'Chua phan cong';
  };

  const getStatusBadge = (request: InspectionRequest) => {
    if (request.diagnosis_reports && request.diagnosis_reports.length > 0) {
      return (
        <span className="status-badge bg-green-100 text-green-800 inline-flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Da chan doan
        </span>
      );
    }

    if (isAssigned(request)) {
      return (
        <span className="status-badge bg-blue-100 text-blue-800 inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Cho kiem tra
        </span>
      );
    }

    return (
      <span className="status-badge bg-yellow-100 text-yellow-800 inline-flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Cho phan cong
      </span>
    );
  };

  const canAssign = isAdmin || isWorkerLead;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Yeu Cau Kiem Tra</h1>
        <p className="text-sm text-gray-600 mt-0.5">Quan ly va phan cong phieu yeu cau kiem tra</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tim theo ma RO, ten KH, bien so..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-9 pr-3 py-2.5 text-sm"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4">
                <div className="space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {activeTab === 'requests'
                ? 'Khong co yeu cau nao cho phan cong'
                : 'Khong co yeu cau nao trong danh sach cho kiem tra'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleRequests.map((request) => (
              <div
                key={request.id}
                className="card card-pressable p-4"
                onClick={() => handleViewDetail(request)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold text-blue-600">
                    {request.vehicle_repair_orders?.ro_code || '-'}
                  </span>
                  {getStatusBadge(request)}
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Khach hang</span>
                    <span className="font-medium text-gray-900">
                      {request.vehicle_repair_orders?.customers?.name || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Xe</span>
                    <span className="text-gray-900">
                      {request.vehicle_repair_orders?.vehicles?.name || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Bien so</span>
                    <span className="font-mono font-medium text-gray-900">
                      {request.vehicle_repair_orders?.vehicles?.license_plate || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Nguoi phu trach</span>
                    <span className="inline-flex items-center gap-1 text-gray-900">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {getAssignedTechnician(request)}
                    </span>
                  </div>
                  {request.check_start_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Bat dau KT</span>
                      <span className="text-gray-900">
                        {new Date(request.check_start_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Ngay tao</span>
                    <span className="text-gray-900">
                      {new Date(request.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewDetail(request); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-blue-600 bg-blue-50 rounded-lg font-medium min-h-[44px]"
                  >
                    <Eye className="w-4 h-4" />
                    {canAssign && activeTab === 'requests' ? 'Phan cong' : 'Chi tiet'}
                  </button>
                  {activeTab === 'waiting' && (!request.diagnosis_reports || request.diagnosis_reports.length === 0) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCreateDiagnosis(request); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-green-600 bg-green-50 rounded-lg font-medium min-h-[44px]"
                    >
                      <FileText className="w-4 h-4" />
                      Chan doan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedRequest && (
        <InspectionRequestDetailModal
          request={selectedRequest}
          canAssign={canAssign && activeTab === 'requests'}
          onAssigned={fetchRequests}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequest(null);
          }}
        />
      )}

      {showDiagnosisModal && selectedRequest && (
        <DiagnosisFormModal
          inspectionRequest={selectedRequest}
          onClose={() => {
            setShowDiagnosisModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowDiagnosisModal(false);
            setSelectedRequest(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
