import { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { X, AlertCircle } from 'lucide-react';

interface InspectionRequestModalProps {
  repairOrderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface IntakeRequest {
  id: string;
  request_content: string;
  suggested_service: string;
}

interface InspectionItem {
  intakeRequestId: string;
  checkContent: string;
  note: string;
}

export function InspectionRequestModal({ repairOrderId, onClose, onSuccess }: InspectionRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [intakeRequests, setIntakeRequests] = useState<IntakeRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [inspectionItems, setInspectionItems] = useState<Record<string, InspectionItem>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      const data = await api.get<{ intakeRequests: IntakeRequest[] }>(
        'api-vehicles',
        `/${repairOrderId}/inspection-request-data`
      );
      setIntakeRequests(data.intakeRequests || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      alert('Loi khi tai du lieu: ' + error.message);
    } finally {
      setFetchingData(false);
    }
  };

  const toggleRequest = (requestId: string, requestContent: string) => {
    const newSelected = new Set(selectedRequests);
    const newItems = { ...inspectionItems };

    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
      delete newItems[requestId];
    } else {
      newSelected.add(requestId);
      newItems[requestId] = {
        intakeRequestId: requestId,
        checkContent: requestContent,
        note: '',
      };
    }

    setSelectedRequests(newSelected);
    setInspectionItems(newItems);
  };

  const updateInspectionItem = (requestId: string, field: keyof InspectionItem, value: string) => {
    setInspectionItems((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (selectedRequests.size === 0) {
      alert('Vui long chon it nhat mot hang muc can kiem tra');
      return;
    }

    setLoading(true);
    try {
      const items = Array.from(selectedRequests).map((requestId, idx) => ({
        intakeRequestId: requestId,
        checkContent: inspectionItems[requestId].checkContent,
        note: inspectionItems[requestId].note || null,
        sortOrder: idx,
      }));

      await api.post('api-vehicles', `/${repairOrderId}/inspection-request`, {
        checkStartTime: null,
        expectedResultTime: null,
        items,
      });

      alert('Tao phieu yeu cau kiem tra thanh cong!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating inspection request:', error);
      alert('Loi khi tao phieu yeu cau kiem tra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="fullscreen-modal">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Dang tai du lieu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-modal">
      <div className="w-full h-full flex flex-col bg-white">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-yellow-600 to-yellow-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
          <button onClick={onClose} className="w-14 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="flex-1 text-center font-bold text-white truncate text-sm">BM-02: Phieu Yeu Cau Kiem Tra</h2>
          <div className="w-14" />
        </div>

        <div className="p-4 pb-safe-bottom overflow-y-auto flex-1">
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium">Huong dan</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Chi can chon cac hang muc can kiem tra de tao yeu cau.
                    To truong va admin se phan cong thoi gian va nguoi phu trach o buoc sau.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tiep nhan yeu cau kiem tra</h3>

              {intakeRequests.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">Khong co yeu cau nao tu phieu tiep nhan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {intakeRequests.map((request, idx) => {
                    const isSelected = selectedRequests.has(request.id);
                    const item = inspectionItems[request.id];

                    return (
                      <div
                        key={request.id}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRequest(request.id, request.request_content)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                {idx + 1}
                              </span>
                              <p className="flex-1 text-gray-900 font-medium">{request.request_content}</p>
                            </div>

                            {request.suggested_service && (
                              <p className="text-sm text-gray-600 ml-8 mb-3">
                                De xuat: {request.suggested_service}
                              </p>
                            )}

                            {isSelected && (
                              <div className="ml-8 space-y-3 mt-3 pt-3 border-t border-blue-200">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chu</label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={item?.note || ''}
                                    onChange={(e) => updateInspectionItem(request.id, 'note', e.target.value)}
                                    placeholder="Ghi chu them..."
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Da chon: <span className="font-semibold text-gray-900">{selectedRequests.size}</span> hang muc
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Huy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedRequests.size === 0}
              className="btn-primary flex-1"
            >
              {loading ? 'Dang tao...' : 'Tao Phieu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
