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
  repairOrder: any;
  quoteItems: QuoteItem[];
  totalAmount: number;
  vehicleRepairOrder?: any;
  quoteDate?: string;
}

export default function PaymentInvoicePrintTemplate({ repairOrder, quoteItems, totalAmount, vehicleRepairOrder, quoteDate }: Props) {
  const customerName = vehicleRepairOrder?.customers?.name || repairOrder.customer_name || '';
  const customerPhone = vehicleRepairOrder?.customers?.phone || repairOrder.customer_phone || '';
  const vehicleName = vehicleRepairOrder?.vehicles?.name || repairOrder.vehicle_name || '';
  const licensePlate = vehicleRepairOrder?.vehicles?.license_plate || repairOrder.license_plate || '';
  const dateStr = quoteDate
    ? new Date(quoteDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    : new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  return (
    <div className="print-template hidden">
      <style>{`
        @media print {
          .print-template {
            display: block !important;
            font-family: 'Times New Roman', serif;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          td, th {
            border: 1px solid black;
            padding: 4px 8px;
          }
          .no-border {
            border: none !important;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .font-bold {
            font-weight: bold;
          }
          .uppercase {
            text-transform: uppercase;
          }
        }
      `}</style>

      <div className="p-8">
        <div className="text-center mb-6">
          <div className="font-bold text-lg">CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ TOÀN CẦU VÀNG</div>
          <div className="text-sm">Địa chỉ: 137 Lê Đình Lý, Phường Thanh Khê, Thành phố Đà Nẵng</div>
          <div className="text-sm">MST: 0401827781</div>
          <div className="text-sm">GARA DANA365 - Địa chỉ: 88 Lê Đại Hành, Đà Nẵng</div>
          <div className="text-sm">Số điện thoại: 0962.7777.79</div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase">PHIẾU THANH TOÁN</h1>
        </div>

        <table className="mb-4" style={{ border: 'none' }}>
          <tbody>
            <tr>
              <td className="no-border font-bold" style={{ width: '50%' }}>1. Thông tin về khách hàng</td>
              <td className="no-border font-bold" style={{ width: '50%' }}>2. Thông tin về xe</td>
            </tr>
            <tr>
              <td className="no-border">
                <div>Tên khách: {customerName}</div>
              </td>
              <td className="no-border">
                <div>Tên xe: {vehicleName}</div>
              </td>
            </tr>
            <tr>
              <td className="no-border">
                <div>Số điện thoại: {customerPhone}</div>
              </td>
              <td className="no-border">
                <div>Đời xe: </div>
              </td>
            </tr>
            <tr>
              <td className="no-border">
                <div>Tên Công ty: </div>
              </td>
              <td className="no-border">
                <div>Biển số xe: {licensePlate}</div>
              </td>
            </tr>
            <tr>
              <td className="no-border">
                <div>MST: </div>
              </td>
              <td className="no-border">
                <div>Odo: </div>
              </td>
            </tr>
            <tr>
              <td className="no-border">
                <div>Địa chỉ: </div>
              </td>
              <td className="no-border">
                <div>Mức nhiên liệu: </div>
              </td>
            </tr>
            <tr>
              <td className="no-border">
                <div>Ngày lập phiếu: {dateStr}</div>
              </td>
              <td className="no-border">
                <div>Số VIN: </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mb-4">
          <thead>
            <tr className="text-center">
              <th style={{ width: '40px' }}>STT</th>
              <th>Hạng mục / Bộ phận</th>
              <th>Triệu chứng</th>
              <th>Kết quả chẩn đoán</th>
              <th>Phương án sửa chữa</th>
              <th>Vật tư / Phụ tùng</th>
              <th style={{ width: '40px' }}>SL</th>
              <th style={{ width: '80px' }}>Đơn giá</th>
              <th style={{ width: '80px' }}>Công thợ</th>
              <th style={{ width: '100px' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {quoteItems.map((item, idx) => (
              <tr key={item.id}>
                <td className="text-center">{idx + 1}</td>
                <td>{item.component_name || ''}</td>
                <td>{item.symptom || ''}</td>
                <td>{item.diagnosis_result || ''}</td>
                <td>{item.repair_method || ''}</td>
                <td>{item.part_name || ''}</td>
                <td className="text-center">{item.quantity || 0}</td>
                <td className="text-right">{(item.unit_price || 0).toLocaleString()}</td>
                <td className="text-right">{(item.labor_cost || 0).toLocaleString()}</td>
                <td className="text-right">{(item.total_amount || 0).toLocaleString()}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 3 - quoteItems.length))].map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td className="text-center">{quoteItems.length + idx + 1}</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={9} className="text-right font-bold">Tổng cộng:</td>
              <td className="text-right font-bold">{totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mb-4">
          <div className="font-bold">Ghi chú / Điều kiện:</div>
          <div>- Phát sinh chi thực hiện khi có sự chấp nhận của khách hàng</div>
        </div>

        <table style={{ border: 'none' }} className="mb-4">
          <tbody>
            <tr>
              <td className="no-border text-center" style={{ width: '50%' }}>
                <div className="font-bold">CVDV</div>
                <div className="font-italic text-sm">(Ký, ghi rõ họ tên)</div>
                <div style={{ height: '80px' }}></div>
              </td>
              <td className="no-border text-center" style={{ width: '50%' }}>
                <div className="font-bold">KHÁCH HÀNG</div>
                <div className="font-italic text-sm">(Ký, ghi rõ họ tên)</div>
                <div style={{ height: '80px' }}></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
