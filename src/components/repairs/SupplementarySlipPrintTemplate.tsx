import { SupplementaryRepairSlip, SupplementaryRepairItem } from '../../lib/supabase';

interface SupplementarySlipPrintTemplateProps {
  slip: SupplementaryRepairSlip;
  items: SupplementaryRepairItem[];
}

export default function SupplementarySlipPrintTemplate({ slip, items }: SupplementarySlipPrintTemplateProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="print-template hidden">
      <style>{`
        @media print {
          .print-template {
            display: block !important;
            font-family: 'Times New Roman', serif;
          }
          .slip-table {
            border-collapse: collapse;
            width: 100%;
            page-break-inside: auto;
          }
          .slip-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .slip-table td,
          .slip-table th {
            border: 1px solid black;
            padding: 4px 8px;
            font-size: 12px;
          }
          .slip-table th {
            font-weight: bold;
            text-align: center;
            background-color: #f3f4f6;
          }
          .slip-no-border {
            border: none !important;
          }
        }
      `}</style>

      <div style={{ padding: '20px 30px', fontFamily: "'Times New Roman', serif", color: '#000', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ TOÀN CẦU VÀNG
          </div>
          <div style={{ fontSize: '12px' }}>
            Địa chỉ: 137 Lê Đình Lý, Phường Thanh Khê, Thành phố Đà Nẵng
          </div>
          <div style={{ fontSize: '12px' }}>MST: 0401827781</div>
          <div style={{ fontSize: '12px' }}>
            GARA DANA365 - Địa chỉ: 88 Lê Đại Hành, Đà Nẵng
          </div>
          <div style={{ fontSize: '12px' }}>Số điện thoại: 0962.7777.79</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0' }}>
            PHIẾU PHÁT SINH SỬA CHỮA
          </h1>
        </div>

        <div style={{ marginBottom: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
            <span>
              <strong>Khách hàng:</strong> {slip.customer_name}
            </span>
            <span style={{ marginLeft: 'auto' }}>
              <strong>Tên xe:</strong> {slip.vehicle_name}
            </span>
            <span style={{ marginLeft: '16px' }}>
              <strong>Biển số xe:</strong> {slip.license_plate}
            </span>
          </div>
          <div>
            <strong>Ngày chẩn đoán phát sinh:</strong> {formatDate(slip.diagnosis_date)}
          </div>
        </div>

        <table className="slip-table" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '16px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '4px 8px', width: '35px', fontSize: '12px', textAlign: 'center' }}>STT</th>
              <th style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>Hạng mục / Bộ phận</th>
              <th style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>Triệu chứng</th>
              <th style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>Kết quả chẩn đoán</th>
              <th style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>Phương án sửa chữa</th>
              <th style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>Vật tư</th>
              <th style={{ border: '1px solid black', padding: '4px 8px', width: '45px', fontSize: '12px', textAlign: 'center' }}>SL</th>
              <th style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: '12px' }}>{idx + 1}</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px' }}>{item.item_name}</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px' }}>{item.symptoms}</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px' }}>{item.diagnosis_result}</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px' }}>{item.repair_solution}</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px' }}>{item.materials}</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: '12px' }}>{item.quantity}</td>
                <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: '12px' }}>{item.item_notes}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 3 - items.length))].map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: '12px' }}>{items.length + idx + 1}</td>
                <td style={{ border: '1px solid black', padding: '4px 8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid black', padding: '4px 8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid black', padding: '4px 8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid black', padding: '4px 8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid black', padding: '4px 8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid black', padding: '4px 8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid black', padding: '4px 8px' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginBottom: '8px', fontSize: '13px' }}>
          <div style={{ fontWeight: 'bold' }}>Ghi chú / Điều kiện:</div>
          {slip.notes && <div style={{ marginBottom: '4px' }}>{slip.notes}</div>}
          <div>- Phát sinh chỉ thực hiện khi có xác nhận của khách hàng</div>
        </div>

        <table style={{ width: '100%', marginTop: '30px', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '33%', textAlign: 'center', border: 'none', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Tổ Trưởng/Quản Đốc</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</div>
                <div style={{ height: '70px' }} />
              </td>
              <td style={{ width: '33%', textAlign: 'center', border: 'none', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Kỹ thuật</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</div>
                <div style={{ height: '70px' }} />
              </td>
              <td style={{ width: '33%', textAlign: 'center', border: 'none', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>CVDV</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</div>
                <div style={{ height: '70px' }} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
