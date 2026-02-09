import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { X, Printer, Check, XCircle, Loader2 } from 'lucide-react';
import AcceptanceHandoverPrintTemplate from './AcceptanceHandoverPrintTemplate';

interface CriteriaResult {
  index: number;
  passed: boolean | null;
  note: string;
}

interface RepairItemSummary {
  id: string;
  name: string;
  status: string;
  parent_id: string | null;
}

interface Props {
  orderId: string;
  qualityInspectionId: string;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  licensePlate: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CRITERIA_LABELS = [
  'Các hạng mục sửa chữa đã được thực hiện đúng theo Lệnh sửa chữa.',
  'Xe đã được chạy thử và vận hành ổn định.',
  'Không phát sinh lỗi mới, đèn báo mới sau sửa chữa.',
  'Tình trạng xe và tài sản đúng như Phiếu tiếp nhận xe.',
  'Xe được vệ sinh trước khi bàn giao.',
];

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

const DEFAULT_CRITERIA: CriteriaResult[] = CRITERIA_LABELS.map((_, idx) => ({
  index: idx,
  passed: null,
  note: '',
}));

export default function AcceptanceHandoverFormModal({
  orderId,
  qualityInspectionId,
  customerName,
  customerPhone,
  vehicleName,
  licensePlate,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [criteriaResults, setCriteriaResults] = useState<CriteriaResult[]>(DEFAULT_CRITERIA);
  const [repairItems, setRepairItems] = useState<RepairItemSummary[]>([]);
  const [receiverName, setReceiverName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [customerSignerName, setCustomerSignerName] = useState(customerName);
  const [vehicleInfo, setVehicleInfo] = useState({
    companyName: '',
    taxId: '',
    address: '',
    modelYear: '',
    odo: '',
    fuelLevel: '',
  });

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const data = await api.get<any>('api-invoices', `/handovers/${orderId}`);

      if (data) {
        if (data.repairItems) {
          const topLevel = data.repairItems.filter(
            (item: RepairItemSummary) => !item.parent_id || !data.repairItems.some((p: RepairItemSummary) => p.id === item.parent_id)
          );
          setRepairItems(topLevel);
        }

        if (data.vehicleInfo) {
          setVehicleInfo({
            companyName: data.vehicleInfo.companyName || '',
            taxId: data.vehicleInfo.taxId || '',
            address: data.vehicleInfo.address || '',
            modelYear: data.vehicleInfo.modelYear || '',
            odo: data.vehicleInfo.odo || '',
            fuelLevel: data.vehicleInfo.fuelLevel || '',
          });
        }

        if (data.handover) {
          setExistingId(data.handover.id);
          setCriteriaResults(data.handover.criteria_results || DEFAULT_CRITERIA);
          setReceiverName(data.handover.receiver_name || '');
          setSupervisorName(data.handover.supervisor_name || '');
          setCustomerSignerName(data.handover.customer_signer_name || customerName);
        }
      }
    } catch (error: any) {
      console.error('Error loading acceptance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaChange = (idx: number, passed: boolean | null) => {
    setCriteriaResults((prev) =>
      prev.map((c) => (c.index === idx ? { ...c, passed } : c))
    );
  };

  const handleNoteChange = (idx: number, note: string) => {
    setCriteriaResults((prev) =>
      prev.map((c) => (c.index === idx ? { ...c, note } : c))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        order_id: orderId,
        quality_inspection_id: qualityInspectionId,
        criteria_results: criteriaResults,
        receiver_name: receiverName,
        supervisor_name: supervisorName,
        customer_signer_name: customerSignerName,
      };

      await api.post('api-invoices', '/handovers', payload);

      onSuccess();
    } catch (error: any) {
      console.error('Error saving acceptance handover:', error);
      alert('Lỗi khi lưu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const completedItems = repairItems.filter((i) => i.status === 'completed');

  return (
    <>
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

          <div className="relative inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-teal-600 to-teal-700">
              <div>
                <h2 className="text-xl font-bold text-white">Phiếu Nghiệm Thu và Bàn Giao Xe</h2>
                <p className="text-teal-100 text-sm mt-0.5">{licensePlate} - {vehicleName}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Thông tin khách hàng</h3>
                    <div className="space-y-1.5 text-sm">
                      <div><span className="text-gray-500">Tên khách:</span> <span className="font-medium">{customerName}</span></div>
                      <div><span className="text-gray-500">SĐT:</span> <span className="font-medium">{customerPhone}</span></div>
                      {vehicleInfo.companyName && (
                        <div><span className="text-gray-500">Công ty:</span> <span className="font-medium">{vehicleInfo.companyName}</span></div>
                      )}
                      {vehicleInfo.taxId && (
                        <div><span className="text-gray-500">MST:</span> <span className="font-medium">{vehicleInfo.taxId}</span></div>
                      )}
                      {vehicleInfo.address && (
                        <div><span className="text-gray-500">Địa chỉ:</span> <span className="font-medium">{vehicleInfo.address}</span></div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Thông tin xe</h3>
                    <div className="space-y-1.5 text-sm">
                      <div><span className="text-gray-500">Tên xe:</span> <span className="font-medium">{vehicleName}</span></div>
                      <div><span className="text-gray-500">Biển số:</span> <span className="font-medium">{licensePlate}</span></div>
                      {vehicleInfo.modelYear && (
                        <div><span className="text-gray-500">Đời xe:</span> <span className="font-medium">{vehicleInfo.modelYear}</span></div>
                      )}
                      {vehicleInfo.odo && (
                        <div><span className="text-gray-500">Odo:</span> <span className="font-medium">{vehicleInfo.odo}</span></div>
                      )}
                      {vehicleInfo.fuelLevel && (
                        <div><span className="text-gray-500">Nhiên liệu:</span> <span className="font-medium">{vehicleInfo.fuelLevel}</span></div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Nội dung nghiệm thu</h3>
                  <div className="text-xs text-gray-500 mb-2 text-right">Đ: Đạt &nbsp; KĐ: Không đạt</div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 w-12">STT</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Nội dung nghiệm thu</th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 w-14">Đ</th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 w-14">KĐ</th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 w-40">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {CRITERIA_LABELS.map((label, idx) => {
                          const result = criteriaResults[idx];
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2.5 text-center text-sm font-semibold text-gray-700">
                                {ROMAN_NUMERALS[idx]}
                              </td>
                              <td className="px-3 py-2.5 text-sm text-gray-900">{label}</td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCriteriaChange(idx, result?.passed === true ? null : true)}
                                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                                    result?.passed === true
                                      ? 'bg-green-600 text-white shadow-sm'
                                      : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCriteriaChange(idx, result?.passed === false ? null : false)}
                                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                                    result?.passed === false
                                      ? 'bg-red-600 text-white shadow-sm'
                                      : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'
                                  }`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={result?.note || ''}
                                  onChange={(e) => handleNoteChange(idx, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                  placeholder="Ghi chú..."
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    Danh sách hạng mục sửa chữa đã nghiệm thu
                    <span className="text-sm font-normal text-gray-500 ml-2">({completedItems.length} hạng mục)</span>
                  </h3>
                  {completedItems.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                      Chưa có hạng mục nào hoàn thành
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {completedItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-center text-sm text-gray-700 w-12">{idx + 1}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Người ký tên</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">CVDV/ NV tiếp nhận</label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Họ tên..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tổ trưởng/Quản đốc</label>
                      <input
                        type="text"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Họ tên..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Khách hàng</label>
                      <input
                        type="text"
                        value={customerSignerName}
                        onChange={(e) => setCustomerSignerName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Họ tên..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 p-5 border-t bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Đóng
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {existingId ? 'Cập Nhật' : 'Lưu Phiếu'}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  In Phiếu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AcceptanceHandoverPrintTemplate
        customerName={customerName}
        customerPhone={customerPhone}
        companyName={vehicleInfo.companyName}
        taxId={vehicleInfo.taxId}
        address={vehicleInfo.address}
        vehicleName={vehicleName}
        modelYear={vehicleInfo.modelYear}
        licensePlate={licensePlate}
        odo={vehicleInfo.odo}
        fuelLevel={vehicleInfo.fuelLevel}
        criteriaResults={criteriaResults}
        repairItems={completedItems}
        receiverName={receiverName}
        supervisorName={supervisorName}
        customerSignerName={customerSignerName}
      />
    </>
  );
}
