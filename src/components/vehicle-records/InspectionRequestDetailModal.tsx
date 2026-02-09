import { useState, useEffect } from 'react';
import { X, User, Car, FileText, Clock } from 'lucide-react';
import { api } from '../../lib/api/client';
import { formatDateTimeVN, formatDateVN, toVietnamDateTimeInputValue } from '../../lib/dateTime';

interface InspectionRequestItem {
  id: string;
  check_content: string;
  estimated_hours: number | null;
  note: string | null;
  sort_order: number;
  technician_id: string | null;
  app_users: {
    display_name: string;
  } | null;
}

interface Technician {
  id: string;
  display_name: string;
}

interface Props {
  request: any;
  onClose: () => void;
  canAssign?: boolean;
  onAssigned?: () => void;
}

export default function InspectionRequestDetailModal({ request, onClose, canAssign = false, onAssigned }: Props) {
  const [items, setItems] = useState<InspectionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [checkStartTime, setCheckStartTime] = useState('');
  const [expectedResultTime, setExpectedResultTime] = useState('');
  const [technicianId, setTechnicianId] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (request.check_start_time) {
      setCheckStartTime(toVietnamDateTimeInputValue(request.check_start_time));
    }
    if (request.expected_result_time) {
      setExpectedResultTime(toVietnamDateTimeInputValue(request.expected_result_time));
    }
  }, [request]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.get<InspectionRequestItem[]>(
        'api-vehicles',
        `/inspection-request-items/${request.id}`
      );
      setItems(data || []);

      const firstAssigned = (data || []).find((item) => item.technician_id);
      if (firstAssigned?.technician_id) {
        setTechnicianId(firstAssigned.technician_id);
      }
    } catch (error: any) {
      console.error('Error fetching inspection items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    if (!canAssign) return;
    try {
      const data = await api.get<Technician[]>('api-vehicles', '/inspection-technicians');
      setTechnicians(data || []);
    } catch (error: any) {
      console.error('Error loading technicians:', error);
      alert('Loi khi tai danh sach ky thuat vien');
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, [canAssign]);

  const handleAssign = async () => {
    if (!checkStartTime || !expectedResultTime || !technicianId) {
      alert('Vui long chon ngay gio bat dau, ket thuc va nguoi phu trach');
      return;
    }

    setAssigning(true);
    try {
      await api.put('api-vehicles', `/inspection-requests/${request.id}/assign`, {
        checkStartTime,
        expectedResultTime,
        technicianId,
      });
      alert('Phan cong kiem tra thanh cong');
      if (onAssigned) onAssigned();
      onClose();
    } catch (error: any) {
      console.error('Error assigning inspection request:', error);
      alert('Loi khi phan cong kiem tra: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Chi tiet yeu cau kiem tra</h2>
              <p className="text-sm text-gray-600 mt-1">Ma RO: {request.vehicle_repair_orders.ro_code}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-blue-100 rounded transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Thong tin khach hang</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Ten khach hang</label>
                    <p className="font-medium text-gray-900">{request.vehicle_repair_orders.customers.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">So dien thoai</label>
                    <p className="font-medium text-gray-900">{request.vehicle_repair_orders.customers.phone}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Thong tin xe</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Ten xe</label>
                    <p className="font-medium text-gray-900">{request.vehicle_repair_orders.vehicles.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Bien so xe</label>
                    <p className="font-mono font-medium text-gray-900">{request.vehicle_repair_orders.vehicles.license_plate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Thoi gian</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Ngay tao</label>
                  <p className="font-medium text-gray-900">
                    {formatDateVN(request.created_at)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Bat dau kiem tra</label>
                  <p className="font-medium text-gray-900">
                    {request.check_start_time ? formatDateTimeVN(request.check_start_time) : 'Chua xac dinh'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Du kien hoan thanh</label>
                  <p className="font-medium text-gray-900">
                    {request.expected_result_time ? formatDateTimeVN(request.expected_result_time) : 'Chua xac dinh'}
                  </p>
                </div>
              </div>
            </div>

            {canAssign && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-3">Phan cong kiem tra</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ngay gio bat dau</label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={checkStartTime}
                      onChange={(e) => setCheckStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ngay gio ket thuc</label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={expectedResultTime}
                      onChange={(e) => setExpectedResultTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nguoi phu trach</label>
                    <select
                      className="input-field"
                      value={technicianId}
                      onChange={(e) => setTechnicianId(e.target.value)}
                    >
                      <option value="">Chon ky thuat vien...</option>
                      {technicians.map((technician) => (
                        <option key={technician.id} value={technician.id}>
                          {technician.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleAssign}
                    disabled={assigning}
                    className="btn-primary"
                  >
                    {assigning ? 'Dang cap nhat...' : 'Xac nhan phan cong'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Hang muc kiem tra</h3>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Dang tai...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  Chua co hang muc kiem tra
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Noi dung kiem tra</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gio du kien</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ky thuat vien</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chu</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.check_content}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.estimated_hours ? `${item.estimated_hours}h` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.app_users?.display_name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Dong
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
