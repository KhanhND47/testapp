import { useState } from 'react';
import { api } from '../../lib/api/client';
import { X, Plus, Trash2, User, Car } from 'lucide-react';

interface IntakeFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface RequestItem {
  id: string;
  request_content: string;
  suggested_service: string;
}

export function IntakeFormModal({ onClose, onSuccess }: IntakeFormModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Customer info
  const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [address, setAddress] = useState('');

  // Vehicle info
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [odo, setOdo] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');

  // Requests
  const [requests, setRequests] = useState<RequestItem[]>([
    { id: '1', request_content: '', suggested_service: '' }
  ]);

  const addRequest = () => {
    setRequests([...requests, { id: Date.now().toString(), request_content: '', suggested_service: '' }]);
  };

  const removeRequest = (id: string) => {
    if (requests.length > 1) {
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  const updateRequest = (id: string, field: 'request_content' | 'suggested_service', value: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const result = await api.post<{ ro_code: string }>('api-vehicles', '/intake', {
        customerType,
        customerName,
        phone,
        companyName,
        taxCode,
        address,
        vehicleName,
        vehicleYear,
        licensePlate,
        vin,
        odo,
        fuelLevel,
        requests: requests.filter(r => r.request_content.trim()),
      });

      alert(`Tạo hồ sơ thành công: ${result.ro_code}`);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating repair order:', error);
      alert('Lỗi khi tạo hồ sơ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = customerName && phone && vehicleName && licensePlate;
  const canProceedStep2 = requests.some(r => r.request_content.trim());

  return (
    <div className="fullscreen-modal">
      <div className="w-full h-full flex flex-col bg-white">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
          <button onClick={onClose} className="w-14 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="flex-1 text-center font-bold text-white truncate text-sm">BM-01: Phieu Tiep Nhan (Buoc {step}/2)</h2>
          <div className="w-14" />
        </div>

        <div className="p-4 pb-safe-bottom overflow-y-auto flex-1">
          {/* Step 1: Customer & Vehicle Info */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">1. Thông Tin Khách Hàng</h3>
                </div>

                <div className="space-y-4">
                  {/* Customer Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại khách hàng</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={customerType === 'individual'}
                          onChange={() => setCustomerType('individual')}
                          className="mr-2"
                        />
                        <span>Cá nhân</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={customerType === 'company'}
                          onChange={() => setCustomerType('company')}
                          className="mr-2"
                        />
                        <span>Doanh nghiệp</span>
                      </label>
                    </div>
                  </div>

                  {/* Customer Name & Phone */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên khách hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        className="input-field"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912345678"
                      />
                    </div>
                  </div>

                  {/* Company fields */}
                  {customerType === 'company' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty</label>
                        <input
                          type="text"
                          className="input-field"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                        <input
                          type="text"
                          className="input-field"
                          value={taxCode}
                          onChange={(e) => setTaxCode(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      className="input-field"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Car className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">2. Thông Tin Xe</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên xe <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={vehicleName}
                        onChange={(e) => setVehicleName(e.target.value)}
                        placeholder="Toyota Camry"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Đời xe</label>
                      <input
                        type="text"
                        className="input-field"
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                        placeholder="2020"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biển số <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                        placeholder="43A-123.45"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số VIN</label>
                      <input
                        type="text"
                        className="input-field"
                        value={vin}
                        onChange={(e) => setVin(e.target.value)}
                        placeholder="1HGBH41JXMN109186"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ODO (km)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={odo}
                        onChange={(e) => setOdo(e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mức nhiên liệu</label>
                      <select
                        className="input-field"
                        value={fuelLevel}
                        onChange={(e) => setFuelLevel(e.target.value)}
                      >
                        <option value="">Chọn mức...</option>
                        <option value="1/8">1/8</option>
                        <option value="1/4">1/4</option>
                        <option value="1/2">1/2</option>
                        <option value="3/4">3/4</option>
                        <option value="Full">Full</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Requests */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Tiếp Nhận Yêu Cầu</h3>

                <div className="space-y-3">
                  {requests.map((request, idx) => (
                    <div key={request.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </span>
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Yêu cầu của khách hàng <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              className="input-field"
                              rows={2}
                              value={request.request_content}
                              onChange={(e) => updateRequest(request.id, 'request_content', e.target.value)}
                              placeholder="VD: Xe bị kêu lạch cạch ở vành đai"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đề xuất dịch vụ</label>
                            <input
                              type="text"
                              className="input-field"
                              value={request.suggested_service}
                              onChange={(e) => updateRequest(request.id, 'suggested_service', e.target.value)}
                              placeholder="VD: Kiểm tra hệ thống treo"
                            />
                          </div>
                        </div>
                        {requests.length > 1 && (
                          <button
                            onClick={() => removeRequest(request.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addRequest}
                  className="mt-3 flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm yêu cầu</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="btn-secondary flex-1"
            >
              Quay lai
            </button>
          )}
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Huy
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
              className="btn-primary flex-1"
            >
              Tiep theo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Dang tao...' : 'Tao Ho So'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
