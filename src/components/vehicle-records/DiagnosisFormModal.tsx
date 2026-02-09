import { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { api } from '../../lib/api/client';
import { toVietnamDateInputValue } from '../../lib/dateTime';

interface DiagnosisLine {
  id: string;
  part_system: string;
  symptom: string;
  diagnosis: string;
  repair_plan: string;
  parts_materials: string;
  qty: string;
  note: string;
}

interface Props {
  inspectionRequest: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DiagnosisFormModal({ inspectionRequest, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [diagnosisDate, setDiagnosisDate] = useState(toVietnamDateInputValue());
  const [generalNote, setGeneralNote] = useState('');
  const [lines, setLines] = useState<DiagnosisLine[]>([
    {
      id: '1',
      part_system: '',
      symptom: '',
      diagnosis: '',
      repair_plan: '',
      parts_materials: '',
      qty: '',
      note: '',
    }
  ]);

  const addLine = () => {
    setLines([...lines, {
      id: Date.now().toString(),
      part_system: '',
      symptom: '',
      diagnosis: '',
      repair_plan: '',
      parts_materials: '',
      qty: '',
      note: '',
    }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof DiagnosisLine, value: string) => {
    setLines(lines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleSubmit = async () => {
    const validLines = lines.filter(l =>
      l.part_system.trim() || l.symptom.trim() || l.diagnosis.trim()
    );

    if (validLines.length === 0) {
      alert('Vui lòng điền ít nhất một hạng mục chẩn đoán');
      return;
    }

    setLoading(true);
    try {
      await api.post('api-vehicles', `/${inspectionRequest.repair_order_id}/diagnosis`, {
        inspectionRequestId: inspectionRequest.id,
        diagnosisDate,
        lines: validLines.map((line, idx) => ({
          partSystem: line.part_system || null,
          symptom: line.symptom || null,
          diagnosis: line.diagnosis || null,
          repairPlan: line.repair_plan || null,
          partsMaterials: line.parts_materials || null,
          qty: line.qty ? parseFloat(line.qty) : null,
          note: line.note || null,
          sortOrder: idx,
        })),
      });

      alert('Tạo phiếu chẩn đoán thành công!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating diagnosis:', error);
      alert('Lỗi khi tạo phiếu chẩn đoán: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-7xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-900 bg-blue-50">
            <div className="flex-1">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 uppercase">
                  CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ TOÀN CẦU VÀNG
                </h2>
                <p className="text-sm text-gray-600 mt-1">Địa chỉ: 137 Lê Đình Lý, Phường Thanh Khê, Thành phố Đà Nẵng</p>
                <p className="text-sm text-gray-600">MST: 0401827781</p>
                <p className="text-sm text-gray-600">GARA DANA365 - Địa chỉ: 88 Lê Đại Hành, Đà Nẵng</p>
                <p className="text-sm text-gray-600">Số điện thoại: 0962.7777.79</p>
                <h3 className="text-lg font-bold text-gray-900 mt-4 uppercase">
                  PHIẾU KIỂM TRA, CHẨN ĐOÁN, TƯ VẤN PHƯƠNG ÁN SỬA CHỮA
                </h3>
              </div>
            </div>
            <button onClick={onClose} className="ml-4 p-1 hover:bg-blue-100 rounded transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Customer & Vehicle Info */}
            <div className="border-2 border-gray-900 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-4 gap-4 mb-2">
                <div className="col-span-2">
                  <span className="font-bold">Khách hàng:</span> {inspectionRequest.vehicle_repair_orders.customers.name}
                </div>
                <div>
                  <span className="font-bold">Biển số xe:</span> {inspectionRequest.vehicle_repair_orders.vehicles.license_plate}
                </div>
                <div>
                  <span className="font-bold">ODO:</span> _______
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold">Tên xe:</span> {inspectionRequest.vehicle_repair_orders.vehicles.name}
                </div>
                <div>
                  <span className="font-bold">Số VIN:</span> _______
                </div>
              </div>
              <div className="mt-2">
                <label className="font-bold">Ngày chẩn đoán: </label>
                <input
                  type="date"
                  value={diagnosisDate}
                  onChange={(e) => setDiagnosisDate(e.target.value)}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Diagnosis Table */}
            <div className="border-2 border-gray-900 rounded-lg overflow-hidden mb-4">
              <table className="min-w-full divide-y-2 divide-gray-900">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase border-r-2 border-gray-900" style={{width: '40px'}}>
                      STT
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase border-r-2 border-gray-900" style={{width: '120px'}}>
                      Hạng mục / Bộ phận
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase border-r-2 border-gray-900" style={{width: '150px'}}>
                      Triệu chứng / Phàn ánh
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase border-r-2 border-gray-900" style={{width: '150px'}}>
                      Kết quả chẩn đoán
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase border-r-2 border-gray-900" style={{width: '150px'}}>
                      Phương án sửa chữa
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase border-r-2 border-gray-900" style={{width: '120px'}}>
                      Vật tư / Phụ tùng
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase border-r-2 border-gray-900" style={{width: '70px'}}>
                      Số lượng
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase border-r-2 border-gray-900" style={{width: '100px'}}>
                      Ghi chú
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-900 uppercase" style={{width: '50px'}}>

                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y-2 divide-gray-900">
                  {lines.map((line, idx) => (
                    <tr key={line.id}>
                      <td className="px-2 py-2 text-center text-sm border-r-2 border-gray-900">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-2 border-r-2 border-gray-900">
                        <textarea
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={line.part_system}
                          onChange={(e) => updateLine(line.id, 'part_system', e.target.value)}
                          placeholder="VD: Hệ thống treo"
                        />
                      </td>
                      <td className="px-2 py-2 border-r-2 border-gray-900">
                        <textarea
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={line.symptom}
                          onChange={(e) => updateLine(line.id, 'symptom', e.target.value)}
                          placeholder="VD: Xe kêu lạch cạch"
                        />
                      </td>
                      <td className="px-2 py-2 border-r-2 border-gray-900">
                        <textarea
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={line.diagnosis}
                          onChange={(e) => updateLine(line.id, 'diagnosis', e.target.value)}
                          placeholder="VD: Giảm xóc bị hỏng"
                        />
                      </td>
                      <td className="px-2 py-2 border-r-2 border-gray-900">
                        <textarea
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={line.repair_plan}
                          onChange={(e) => updateLine(line.id, 'repair_plan', e.target.value)}
                          placeholder="VD: Thay giảm xóc mới"
                        />
                      </td>
                      <td className="px-2 py-2 border-r-2 border-gray-900">
                        <textarea
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={line.parts_materials}
                          onChange={(e) => updateLine(line.id, 'parts_materials', e.target.value)}
                          placeholder="VD: Giảm xóc trước"
                        />
                      </td>
                      <td className="px-2 py-2 border-r-2 border-gray-900">
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          value={line.qty}
                          onChange={(e) => updateLine(line.id, 'qty', e.target.value)}
                          placeholder="2"
                        />
                      </td>
                      <td className="px-2 py-2 border-r-2 border-gray-900">
                        <textarea
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={line.note}
                          onChange={(e) => updateLine(line.id, 'note', e.target.value)}
                          placeholder="Ghi chú"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        {lines.length > 1 && (
                          <button
                            onClick={() => removeLine(line.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={addLine}
              className="mb-4 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-300"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm hàng</span>
            </button>

            {/* Notes */}
            <div className="border-2 border-gray-900 rounded-lg p-4 mb-4">
              <label className="block font-bold text-gray-900 mb-2">Ghi chú / Điều kiện:</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder="- Phát sinh chi phí liên khi có sự chấp nhận của khách hàng"
              />
            </div>

            {/* Signatures */}
            <div className="border-2 border-gray-900 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="font-bold text-gray-900">Đại diện Công ty</p>
                  <p className="text-xs text-gray-600 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-20"></div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">Kỹ thuật / Chẩn đoán</p>
                  <p className="text-xs text-gray-600 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-20"></div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">CVDV / NV Tiếp nhận</p>
                  <p className="text-xs text-gray-600 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Đang lưu...' : 'Lưu Phiếu Chẩn Đoán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
