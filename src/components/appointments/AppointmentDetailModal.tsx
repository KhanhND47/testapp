import { useState, useEffect } from 'react';
import { Appointment, AppointmentServiceType } from '../../lib/supabase';
import { api } from '../../lib/api/client';
import { X, Calendar, Car, Phone, User, Clock, FileText, Wrench, Loader2 } from 'lucide-react';

interface AppointmentRepairItem {
  id: string;
  name: string;
  description: string | null;
  estimated_price: number | null;
}

interface AppointmentDetailModalProps {
  appointment: Appointment;
  onClose: () => void;
}

const SERVICE_TYPE_LABELS: Record<AppointmentServiceType, string> = {
  kiem_tra: 'Kiem Tra',
  sua_chua: 'Sua Chua',
  bao_duong_dong_co: 'Bao Duong Dong Co',
  bao_duong_3_buoc: 'Bao Duong 3 Buoc',
  bao_duong: 'Bao Duong',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Cho xu ly', color: 'bg-amber-100 text-amber-800' },
  cancelled: { label: 'Da huy', color: 'bg-red-100 text-red-800' },
  converted: { label: 'Da chuyen', color: 'bg-green-100 text-green-800' },
};

export default function AppointmentDetailModal({ appointment, onClose }: AppointmentDetailModalProps) {
  const [repairItems, setRepairItems] = useState<AppointmentRepairItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepairItems();
  }, [appointment.id]);

  const fetchRepairItems = async () => {
    try {
      const data = await api.get<{ appointment: any; items: AppointmentRepairItem[] }>('api-appointments', `/${appointment.id}`);
      if (data?.items) {
        setRepairItems(data.items);
      }
    } catch (err) {
      console.error('Error fetching repair items:', err);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalEstimatedPrice = repairItems.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
  const status = STATUS_LABELS[appointment.status] || STATUS_LABELS.pending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Chi tiet lich hen
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 font-mono">{appointment.license_plate}</h3>
              <p className="text-gray-600">{appointment.vehicle_name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Khach hang</p>
                <p className="font-semibold text-gray-900">{appointment.customer_name}</p>
              </div>
            </div>

            {appointment.phone && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">So dien thoai</p>
                  <p className="font-semibold text-gray-900">{appointment.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngay hen</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(appointment.appointment_date)}
                  <span className="text-gray-500 font-normal ml-2">
                    ({appointment.appointment_time === 'morning' ? 'Sang' : 'Chieu'})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngay tra xe du kien</p>
                <p className="font-semibold text-gray-900">{formatDate(appointment.expected_return_date)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-4 h-4 text-sky-600" />
              <span className="text-sm text-sky-700">Loai dich vu</span>
            </div>
            <p className="font-semibold text-sky-900">{SERVICE_TYPE_LABELS[appointment.service_type]}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-gray-600" />
                Hang muc sua chua
              </h4>
              {totalEstimatedPrice > 0 && (
                <span className="text-sm font-medium text-gray-600">
                  Tong du kien: <span className="text-sky-600">{totalEstimatedPrice.toLocaleString()}d</span>
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
              </div>
            ) : repairItems.length > 0 ? (
              <div className="space-y-2">
                {repairItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-700 rounded-full text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </div>
                    {item.estimated_price && (
                      <span className="text-sm font-medium text-gray-700 flex-shrink-0">
                        {item.estimated_price.toLocaleString()}d
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Khong co hang muc sua chua nao</p>
              </div>
            )}
          </div>

          {appointment.notes && (
            <div>
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Ghi chu
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Dong
          </button>
        </div>
      </div>
    </div>
  );
}
