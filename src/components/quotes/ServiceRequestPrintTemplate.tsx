interface QuoteItem {
  id?: string;
  component_name: string;
  symptom: string | null;
  repair_method: string | null;
  part_name: string | null;
  quantity: number;
}

interface Props {
  serviceRequest: any;
  items: QuoteItem[];
}

export default function ServiceRequestPrintTemplate({ serviceRequest, items }: Props) {
  if (!serviceRequest) return null;

  return (
    <div className="print-template hidden">
      <style>{`
        @media print {
          .print-template {
            display: block !important;
            font-family: 'Times New Roman', serif;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          table {
            border-collapse: collapse;
            width: 100%;
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
          .font-bold {
            font-weight: bold;
          }
          .bg-gray {
            background-color: #f3f4f6;
          }
        }
      `}</style>

      <div style={{ padding: '20px' }}>
        {/* Company Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ TOÀN CẦU VÀNG</div>
          <div style={{ fontSize: '12px' }}>Địa chỉ: 137 Lê Đình Lý, Phường Thanh Khê, Thành phố Đà Nẵng</div>
          <div style={{ fontSize: '12px' }}>MST: 0401827781</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>GARA DANA365 - Địa chỉ: 88 Lê Đại Hành, Đà Nẵng</div>
          <div style={{ fontSize: '12px' }}>Số điện thoại: 0962.7777.79</div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>PHIẾU YÊU CẦU DỊCH VỤ CỦA KHÁCH HÀNG</h2>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>Mã phiếu: {serviceRequest.request_code}</div>
        </div>

        {/* Customer and Vehicle Information */}
        <table style={{ marginBottom: '20px', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', border: '1px solid black', padding: 0, verticalAlign: 'top' }}>
                <div style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderBottom: '1px solid black' }}>
                  <strong style={{ fontSize: '12px' }}>1. Thông tin về khách hàng</strong>
                </div>
                <div style={{ padding: '8px' }}>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Tên khách:</strong> {serviceRequest.vehicle_repair_orders?.customers?.name || ''}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Số điện thoại:</strong> {serviceRequest.vehicle_repair_orders?.customers?.phone || ''}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Tên Công ty:</strong>
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>MST:</strong>
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Địa chỉ:</strong>
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Mã hồ sơ:</strong> {serviceRequest.vehicle_repair_orders?.ro_code || ''}
                  </div>
                  {serviceRequest.vr_quotes && (
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <strong>Mã báo giá:</strong> {serviceRequest.vr_quotes.quote_code}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Ngày làm phiếu:</strong> {new Date(serviceRequest.request_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Thời gian bắt đầu:</strong> {serviceRequest.start_time ? new Date(serviceRequest.start_time).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
                  </div>
                </div>
              </td>
              <td style={{ width: '50%', border: '1px solid black', padding: 0, verticalAlign: 'top' }}>
                <div style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderBottom: '1px solid black' }}>
                  <strong style={{ fontSize: '12px' }}>2. Thông tin về xe</strong>
                </div>
                <div style={{ padding: '8px' }}>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Tên xe:</strong> {serviceRequest.vehicle_repair_orders?.vehicles?.name || ''}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Đời xe:</strong>
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Biển số xe:</strong> {serviceRequest.vehicle_repair_orders?.vehicles?.license_plate || ''}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Odo:</strong> {serviceRequest.vehicle_repair_orders?.odo ? `${serviceRequest.vehicle_repair_orders.odo.toLocaleString()} km` : ''}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Mức nhiên liệu:</strong> {serviceRequest.vehicle_repair_orders?.fuel_level !== null && serviceRequest.vehicle_repair_orders?.fuel_level !== undefined ? `${serviceRequest.vehicle_repair_orders.fuel_level}%` : ''}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Số VIN:</strong>
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Thời gian dự kiến hoàn thành:</strong> {serviceRequest.expected_finish_time ? new Date(serviceRequest.expected_finish_time).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Service Items Table */}
        <table style={{ marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', width: '40px' }}>STT</th>
              <th style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>Hạng mục</th>
              <th style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>Triệu chứng</th>
              <th style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>Phương án sửa chữa</th>
              <th style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>Phụ tùng</th>
              <th style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', width: '50px' }}>SL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontSize: '12px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ fontSize: '12px' }}>{item.component_name || ''}</td>
                <td style={{ fontSize: '12px' }}>{item.symptom || ''}</td>
                <td style={{ fontSize: '12px' }}>{item.repair_method || ''}</td>
                <td style={{ fontSize: '12px' }}>{item.part_name || ''}</td>
                <td style={{ fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td style={{ fontSize: '12px', textAlign: 'center' }}>{items.length + idx + 1}</td>
                <td style={{ fontSize: '12px' }}>&nbsp;</td>
                <td style={{ fontSize: '12px' }}>&nbsp;</td>
                <td style={{ fontSize: '12px' }}>&nbsp;</td>
                <td style={{ fontSize: '12px' }}>&nbsp;</td>
                <td style={{ fontSize: '12px', textAlign: 'center' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Note */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
            <strong>Ghi chú / Điều kiện:</strong>
          </div>
          <div style={{ fontSize: '12px' }}>
            - Phát sinh chi phí thực hiện khi có xác nhận của khách hàng
          </div>
        </div>

        {/* Signatures */}
        <table style={{ border: 'none', marginTop: '40px' }}>
          <tbody>
            <tr>
              <td style={{ border: 'none', textAlign: 'center', width: '50%' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '60px' }}>CVDV</div>
                <div style={{ fontSize: '12px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</div>
              </td>
              <td style={{ border: 'none', textAlign: 'center', width: '50%' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '60px' }}>KHÁCH HÀNG</div>
                <div style={{ fontSize: '12px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
