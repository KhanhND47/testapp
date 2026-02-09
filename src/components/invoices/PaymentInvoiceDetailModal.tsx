import { useState, useEffect } from 'react';
import { X, Printer, ClipboardCheck } from 'lucide-react';
import { api } from '../../lib/api/client';
import PaymentInvoicePrintTemplate from './PaymentInvoicePrintTemplate';
import AcceptanceHandoverFormModal from './AcceptanceHandoverFormModal';

interface QuoteItem {
  id: string;
  component_name: string;
  symptom: string;
  diagnosis_result: string;
  repair_method: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  labor_cost: number;
  total_amount: number;
  order_index: number;
}

interface Props {
  inspection: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentInvoiceDetailModal({ inspection, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [vehicleRepairOrder, setVehicleRepairOrder] = useState<any>(null);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  useEffect(() => {
    loadQuoteData();
  }, [inspection.general_repair_orders.id]);

  const loadQuoteData = async () => {
    try {
      setLoading(true);

      const data = await api.get<any>('api-invoices', `/${inspection.general_repair_orders.id}`);

      if (data) {
        if (data.vehicleRepairOrder) setVehicleRepairOrder(data.vehicleRepairOrder);
        if (data.quote) setQuote(data.quote);
        if (data.quoteItems) setQuoteItems(data.quoteItems);
      }
    } catch (error: any) {
      console.error('Error loading quote data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = quote?.total_amount || quoteItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-sky-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phieu Thanh Toan</h2>
              <p className="text-sm text-gray-600 mt-1">
                Ma phieu: <span className="font-semibold">{inspection.general_repair_orders.ro_code}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-600">Dang tai...</div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Thong Tin Khach Hang</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Ten:</span>{' '}
                      <span className="font-medium">{inspection.general_repair_orders.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">SDT:</span>{' '}
                      <span className="font-medium">{inspection.general_repair_orders.customer_phone}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Thong Tin Xe</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Bien so:</span>{' '}
                      <span className="font-medium">{inspection.general_repair_orders.license_plate}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ten xe:</span>{' '}
                      <span className="font-medium">{inspection.general_repair_orders.vehicle_name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi Tiet Hang Muc Sua Chua</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hang muc</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trieu chung</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chan doan</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phuong an</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vat tu</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">SL</th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Don gia</th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cong tho</th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thanh tien</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quoteItems.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                              Khong co du lieu hang muc sua chua
                            </td>
                          </tr>
                        ) : (
                          quoteItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-3 py-3 text-sm text-gray-900">{idx + 1}</td>
                              <td className="px-3 py-3 text-sm text-gray-900">{item.component_name || '-'}</td>
                              <td className="px-3 py-3 text-sm text-gray-900">{item.symptom || '-'}</td>
                              <td className="px-3 py-3 text-sm text-gray-900">{item.diagnosis_result || '-'}</td>
                              <td className="px-3 py-3 text-sm text-gray-900">{item.repair_method || '-'}</td>
                              <td className="px-3 py-3 text-sm text-gray-900">{item.part_name || '-'}</td>
                              <td className="px-3 py-3 text-sm text-center text-gray-900">{item.quantity || 0}</td>
                              <td className="px-3 py-3 text-sm text-right text-gray-900">{(item.unit_price || 0).toLocaleString()}</td>
                              <td className="px-3 py-3 text-sm text-right text-gray-900">{(item.labor_cost || 0).toLocaleString()}</td>
                              <td className="px-3 py-3 text-sm text-right font-medium text-gray-900">{(item.total_amount || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={9} className="px-4 py-3 text-right font-bold text-gray-900">Tong Cong:</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                            {totalAmount.toLocaleString()} VND
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center gap-3 p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Ngay nghiem thu: {new Date(inspection.inspection_date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Dong
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHandoverModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Nghiem Thu & Ban Giao
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  In Phieu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!showHandoverModal && (
        <PaymentInvoicePrintTemplate
          repairOrder={inspection.general_repair_orders}
          quoteItems={quoteItems}
          totalAmount={totalAmount}
          vehicleRepairOrder={vehicleRepairOrder}
          quoteDate={quote?.quote_date}
        />
      )}

      {showHandoverModal && (
        <AcceptanceHandoverFormModal
          orderId={inspection.general_repair_orders.id}
          qualityInspectionId={inspection.id}
          customerName={inspection.general_repair_orders.customer_name}
          customerPhone={inspection.general_repair_orders.customer_phone}
          vehicleName={inspection.general_repair_orders.vehicle_name}
          licensePlate={inspection.general_repair_orders.license_plate}
          onClose={() => setShowHandoverModal(false)}
          onSuccess={() => {
            setShowHandoverModal(false);
            onSuccess();
          }}
        />
      )}
    </div>
  );
}
