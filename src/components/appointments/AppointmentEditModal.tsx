import { useState, useEffect } from 'react';
import { Appointment, AppointmentServiceType } from '../../lib/supabase';
import { api } from '../../lib/api/client';
import { X, Save, AlertCircle, Plus, Trash2, Loader2, Wrench, Edit3 } from 'lucide-react';

interface AppointmentRepairItem {
  id: string;
  name: string;
  description: string | null;
  estimated_price: number | null;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

interface AppointmentEditModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

const SERVICE_TYPES: { value: AppointmentServiceType; label: string }[] = [
  { value: 'kiem_tra', label: 'Kiem Tra' },
  { value: 'sua_chua', label: 'Sua Chua' },
  { value: 'bao_duong_dong_co', label: 'Bao Duong Dong Co' },
  { value: 'bao_duong_3_buoc', label: 'Bao Duong 3 Buoc' },
  { value: 'bao_duong', label: 'Bao Duong' },
];

export default function AppointmentEditModal({ appointment, onClose, onSuccess }: AppointmentEditModalProps) {
  const [licensePlate, setLicensePlate] = useState(appointment.license_plate);
  const [customerName, setCustomerName] = useState(appointment.customer_name);
  const [vehicleName, setVehicleName] = useState(appointment.vehicle_name);
  const [phone, setPhone] = useState(appointment.phone || '');
  const [appointmentDate, setAppointmentDate] = useState(appointment.appointment_date);
  const [appointmentTime, setAppointmentTime] = useState<'morning' | 'afternoon'>(
    appointment.appointment_time as 'morning' | 'afternoon'
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState(appointment.expected_return_date);
  const [serviceType, setServiceType] = useState<AppointmentServiceType>(appointment.service_type);
  const [notes, setNotes] = useState(appointment.notes || '');
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repairItems, setRepairItems] = useState<AppointmentRepairItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchRepairItems();
  }, [appointment.id]);

  const fetchRepairItems = async () => {
    try {
      const data = await api.get<{ appointment: any; items: AppointmentRepairItem[] }>('api-appointments', `/${appointment.id}`);
      if (data?.items) {
        setRepairItems(data.items.map(item => ({
          ...item,
          isNew: false,
          isModified: false,
          isDeleted: false,
        })));
      }
    } catch (err) {
      console.error('Error fetching repair items:', err);
    }
    setLoadingItems(false);
  };

  const addRepairItem = () => {
    if (!newItemName.trim()) return;

    const newItem: AppointmentRepairItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      description: null,
      estimated_price: newItemPrice ? parseFloat(newItemPrice) : null,
      isNew: true,
    };

    setRepairItems([...repairItems, newItem]);
    setNewItemName('');
    setNewItemPrice('');
  };

  const updateRepairItem = (id: string, field: 'name' | 'estimated_price', value: string) => {
    setRepairItems(items =>
      items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === 'estimated_price' ? (value ? parseFloat(value) : null) : value,
            isModified: !item.isNew,
          };
        }
        return item;
      })
    );
  };

  const removeRepairItem = (id: string) => {
    setRepairItems(items =>
      items.map(item => {
        if (item.id === id) {
          if (item.isNew) {
            return null;
          }
          return { ...item, isDeleted: true };
        }
        return item;
      }).filter(Boolean) as AppointmentRepairItem[]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licensePlate.trim()) {
      setError('Vui long nhap bien so xe');
      return;
    }
    if (!customerName.trim()) {
      setError('Vui long nhap ten khach hang');
      return;
    }
    if (!vehicleName.trim()) {
      setError('Vui long nhap ten xe');
      return;
    }
    if (!appointmentDate) {
      setError('Vui long chon ngay hen');
      return;
    }
    if (!expectedReturnDate) {
      setError('Vui long chon ngay tra xe du kien');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const appointmentData = {
        license_plate: licensePlate.toUpperCase().trim(),
        customer_name: customerName.trim(),
        vehicle_name: vehicleName.trim(),
        phone: phone.trim() || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        expected_return_date: expectedReturnDate,
        service_type: serviceType,
        notes: notes.trim() || null,
      };

      const newItems = repairItems
        .filter(item => item.isNew && !item.isDeleted)
        .map(item => ({
          name: item.name,
          description: item.description,
          estimated_price: item.estimated_price,
        }));

      const updatedItems = repairItems
        .filter(item => item.isModified && !item.isNew && !item.isDeleted)
        .map(item => ({
          id: item.id,
          name: item.name,
          estimated_price: item.estimated_price,
        }));

      const deletedItemIds = repairItems
        .filter(item => item.isDeleted && !item.isNew)
        .map(item => item.id);

      await api.put('api-appointments', `/${appointment.id}`, {
        appointment: appointmentData,
        newItems,
        updatedItems,
        deletedItemIds,
      });

      setLoading(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const activeRepairItems = repairItems.filter(item => !item.isDeleted);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit3 className="w-6 h-6" />
            Chinh sua lich hen
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bien so xe *
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 uppercase font-mono text-lg"
                placeholder="VD: 30A-12345"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ten khach hang *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Nhap ten khach hang"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ten xe *
              </label>
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="VD: Toyota Camry 2023"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                So dien thoai
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="VD: 0901234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Loai dich vu *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setServiceType(type.value)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    serviceType === type.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngay hen *
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Buoi *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAppointmentTime('morning')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    appointmentTime === 'morning'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Sang
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentTime('afternoon')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    appointmentTime === 'afternoon'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Chieu
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngay tra xe (du kien) *
              </label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Hang muc sua chua
            </label>
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  placeholder="Ten hang muc moi *"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRepairItem();
                    }
                  }}
                />
                <input
                  type="text"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  placeholder="Gia du kien"
                />
                <button
                  type="button"
                  onClick={addRepairItem}
                  disabled={!newItemName.trim()}
                  className="px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {loadingItems ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                </div>
              ) : activeRepairItems.length > 0 ? (
                <div className="space-y-2">
                  {activeRepairItems.map((item, index) => (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg ${item.isNew ? 'bg-green-50 border border-green-200' : item.isModified ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                      <span className="w-6 h-6 flex items-center justify-center bg-sky-100 text-sky-700 rounded-full text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      {editingItemId === item.id ? (
                        <>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateRepairItem(item.id, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={item.estimated_price?.toString() || ''}
                            onChange={(e) => updateRepairItem(item.id, 'estimated_price', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Gia"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setEditingItemId(item.id)}
                          >
                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                            {item.isNew && <span className="text-xs text-green-600">Moi them</span>}
                            {item.isModified && <span className="text-xs text-amber-600">Da sua</span>}
                          </div>
                          {item.estimated_price && (
                            <span className="text-sm font-medium text-gray-700">
                              {item.estimated_price.toLocaleString()}d
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingItemId(item.id)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRepairItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  Chua co hang muc nao. Nhap ten hang muc va nhan Enter hoac bam nut +
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ghi chu
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
              placeholder="Ghi chu them ve yeu cau cua khach hang..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-lg hover:from-sky-700 hover:to-blue-800 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Dang luu...' : 'Luu thay doi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
