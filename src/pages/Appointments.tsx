import { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, AppointmentServiceType } from '../lib/supabase';
import { api } from '../lib/api/client';
import { Plus, Calendar, Search, ChevronDown } from 'lucide-react';
import AppointmentFormModal from '../components/appointments/AppointmentFormModal';
import AppointmentEditModal from '../components/appointments/AppointmentEditModal';

const SERVICE_TYPE_LABELS: Record<AppointmentServiceType, string> = {
  kiem_tra: 'Kiem Tra',
  sua_chua: 'Sua Chua',
  bao_duong_dong_co: 'BD Dong Co',
  bao_duong_3_buoc: 'BD 3 Buoc',
  bao_duong: 'Bao Duong',
};

const SERVICE_TYPE_COLORS: Record<AppointmentServiceType, string> = {
  kiem_tra: 'bg-blue-50 text-blue-700',
  sua_chua: 'bg-orange-50 text-orange-700',
  bao_duong_dong_co: 'bg-teal-50 text-teal-700',
  bao_duong_3_buoc: 'bg-teal-50 text-teal-700',
  bao_duong: 'bg-emerald-50 text-emerald-700',
};

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-600' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600' },
  converted: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.get<Appointment[]>('api-appointments');
      if (data) setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    setUpdatingStatus(id);
    try {
      await api.put('api-appointments', `/${id}/status`, { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Error updating status:', err);
    }
    setUpdatingStatus(null);
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const convertedCount = appointments.filter(a => a.status === 'converted').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-3 space-y-3">
        <button onClick={() => setShowForm(true)} className="btn-primary w-full">
          <Plus className="w-5 h-5" />
          Them lich hen
        </button>

        <div className="grid grid-cols-3 gap-2">
          <div className="card p-2.5 text-center border-amber-100">
            <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
            <p className="text-[10px] text-amber-400 font-medium">Dang hen</p>
          </div>
          <div className="card p-2.5 text-center border-emerald-100">
            <p className="text-lg font-bold text-emerald-600">{convertedCount}</p>
            <p className="text-[10px] text-emerald-400 font-medium">Chuyen doi</p>
          </div>
          <div className="card p-2.5 text-center border-red-100">
            <p className="text-lg font-bold text-red-600">{cancelledCount}</p>
            <p className="text-[10px] text-red-400 font-medium">Da huy</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tim bien so, khach hang, xe..."
            className="input-field pl-11 py-3"
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-24 w-full" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm font-medium">Chua co lich hen nao</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAppointments.map((apt) => {
              const statusConfig = STATUS_COLORS[apt.status];
              const daysUntil = getDaysUntil(apt.appointment_date);

              return (
                <button
                  key={apt.id}
                  className="card-pressable w-full text-left"
                  onClick={() => setSelectedAppointment(apt)}
                >
                  <div className={`h-1 ${apt.status === 'pending' ? 'bg-amber-500' : apt.status === 'converted' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-[15px]">{apt.license_plate}</p>
                      {apt.status === 'pending' && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                          daysUntil < 0 ? 'bg-red-50 text-red-600' :
                          daysUntil === 0 ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {daysUntil < 0 ? `Qua ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Hom nay' : `${daysUntil}d`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{apt.vehicle_name}</p>
                    <p className="text-xs text-gray-400 truncate">{apt.customer_name}</p>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`status-badge ${SERVICE_TYPE_COLORS[apt.service_type]}`}>
                          {SERVICE_TYPE_LABELS[apt.service_type]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(apt.appointment_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()} className="relative">
                        <select
                          value={apt.status}
                          onChange={(e) => updateStatus(apt.id, e.target.value as AppointmentStatus)}
                          disabled={updatingStatus === apt.id}
                          className={`appearance-none text-[11px] font-semibold pl-2.5 pr-6 py-1.5 rounded-lg ${statusConfig.bg} ${statusConfig.text} border-0`}
                        >
                          <option value="pending">Dang hen</option>
                          <option value="converted">Chuyen doi</option>
                          <option value="cancelled">Da huy</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <AppointmentFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchAppointments(); }}
        />
      )}

      {selectedAppointment && (
        <AppointmentEditModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSuccess={() => { setSelectedAppointment(null); fetchAppointments(); }}
        />
      )}
    </div>
  );
}
