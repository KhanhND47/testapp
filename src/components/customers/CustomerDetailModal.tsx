import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { X, User, Phone, Building, MapPin, FileText, Car, Calendar, Loader } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  company_name: string | null;
  tax_id: string | null;
  address: string | null;
  customer_type: string;
  created_at: string;
}

interface Vehicle {
  id: string;
  name: string;
  model_year: string | null;
  license_plate: string;
  vin: string | null;
  created_at: string;
}

interface VehicleRepairOrder {
  id: string;
  ro_code: string;
  received_at: string;
  status: string;
}

interface CustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received: { label: 'Đã tiếp nhận', color: 'bg-blue-100 text-blue-800' },
  inspecting: { label: 'Đang kiểm tra', color: 'bg-yellow-100 text-yellow-800' },
  diagnosed: { label: 'Đã chẩn đoán', color: 'bg-purple-100 text-purple-800' },
  quoted: { label: 'Đã báo giá', color: 'bg-orange-100 text-orange-800' },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
  in_progress: { label: 'Đang sửa chữa', color: 'bg-indigo-100 text-indigo-800' },
  completed: { label: 'Hoàn thành', color: 'bg-teal-100 text-teal-800' },
  delivered: { label: 'Đã giao xe', color: 'bg-gray-100 text-gray-800' },
};

export function CustomerDetailModal({ customerId, onClose, onUpdate: _onUpdate }: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [repairOrders, setRepairOrders] = useState<VehicleRepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchVehicleRepairOrders(selectedVehicleId);
    } else {
      setRepairOrders([]);
    }
  }, [selectedVehicleId]);

  const fetchCustomerDetails = async () => {
    setLoading(true);

    try {
      const customerData = await api.get<Customer>('api-customers', `/${customerId}`);
      if (!customerData) {
        setLoading(false);
        return;
      }

      const vehiclesData = await api.get<Vehicle[]>('api-customers', `/${customerId}/vehicles`);

      setCustomer(customerData);
      setVehicles(vehiclesData || []);

      if (vehiclesData && vehiclesData.length > 0) {
        setSelectedVehicleId(vehiclesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    }

    setLoading(false);
  };

  const fetchVehicleRepairOrders = async (vehicleId: string) => {
    setLoadingOrders(true);

    try {
      const data = await api.get<VehicleRepairOrder[]>('api-customers', `/${customerId}/orders`, { vehicle_id: vehicleId });
      setRepairOrders(data || []);
    } catch (err) {
      console.error('Error fetching repair orders:', err);
    }

    setLoadingOrders(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-8 text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Thông Tin Khách Hàng</h2>
            <p className="text-gray-600 mt-1">Chi tiết khách hàng và danh sách xe</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                    customer.customer_type === 'company' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    {customer.customer_type === 'company' ? (
                      <Building className={`w-8 h-8 ${
                        customer.customer_type === 'company' ? 'text-purple-600' : 'text-blue-600'
                      }`} />
                    ) : (
                      <User className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{customer.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.customer_type === 'company'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {customer.customer_type === 'company' ? 'Công ty' : 'Cá nhân'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Số điện thoại</p>
                      <p className="text-gray-900">{customer.phone}</p>
                    </div>
                  </div>

                  {customer.company_name && (
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tên công ty</p>
                        <p className="text-gray-900">{customer.company_name}</p>
                      </div>
                    </div>
                  )}

                  {customer.tax_id && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Mã số thuế</p>
                        <p className="text-gray-900">{customer.tax_id}</p>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Địa chỉ</p>
                        <p className="text-gray-900">{customer.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ngày tạo</p>
                      <p className="text-gray-900">
                        {new Date(customer.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-medium mb-1">Tổng số xe</p>
                    <p className="text-4xl font-bold text-blue-900">{vehicles.length}</p>
                  </div>
                  <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Car className="w-8 h-8 text-blue-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicles List */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Danh Sách Xe ({vehicles.length})</h3>

              {vehicles.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                  <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Khách hàng chưa có xe nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedVehicleId === vehicle.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                      }`}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{vehicle.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Biển số:</span> {vehicle.license_plate}
                          </p>
                          {vehicle.model_year && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Năm sản xuất:</span> {vehicle.model_year}
                            </p>
                          )}
                          {vehicle.vin && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">VIN:</span> {vehicle.vin}
                            </p>
                          )}
                        </div>
                        {selectedVehicleId === vehicle.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Repair Orders for Selected Vehicle */}
              {selectedVehicle && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Hồ Sơ Xe: {selectedVehicle.license_plate}
                  </h3>

                  {loadingOrders ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <Loader className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                      <p className="text-gray-600 mt-2 text-sm">Đang tải hồ sơ...</p>
                    </div>
                  ) : repairOrders.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Xe này chưa có hồ sơ sửa chữa</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {repairOrders.map((order) => {
                        const statusInfo = STATUS_LABELS[order.status] || {
                          label: order.status,
                          color: 'bg-gray-100 text-gray-800'
                        };

                        return (
                          <div
                            key={order.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900">{order.ro_code}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Ngày tiếp nhận:</span>{' '}
                              {new Date(order.received_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
