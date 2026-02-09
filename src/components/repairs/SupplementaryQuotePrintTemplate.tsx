import { SupplementaryQuote, SupplementaryQuoteItem } from '../../lib/supabase';

interface SupplementaryQuotePrintTemplateProps {
  quote: SupplementaryQuote;
  items: SupplementaryQuoteItem[];
}

export default function SupplementaryQuotePrintTemplate({ quote, items }: SupplementaryQuotePrintTemplateProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  const cellStyle: React.CSSProperties = {
    border: '1px solid black',
    padding: '4px 8px',
    fontSize: '12px',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f3f4f6',
  };

  const centerCellStyle: React.CSSProperties = {
    ...cellStyle,
    textAlign: 'center',
  };

  const rightCellStyle: React.CSSProperties = {
    ...cellStyle,
    textAlign: 'right',
  };

  return (
    <div className="print-template hidden">
      <style>{`
        @media print {
          .print-template {
            display: block !important;
            font-family: 'Times New Roman', serif;
          }
          .quote-table {
            border-collapse: collapse;
            width: 100%;
            page-break-inside: auto;
          }
          .quote-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .quote-table td,
          .quote-table th {
            border: 1px solid black;
            padding: 4px 8px;
            font-size: 12px;
          }
          .quote-table th {
            font-weight: bold;
            text-align: center;
            background-color: #f3f4f6;
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
            PHIẾU BÁO GIÁ BỔ SUNG
          </h1>
        </div>

        <div style={{ marginBottom: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
            <span>
              <strong>Khách hàng:</strong> {quote.customer_name}
            </span>
            <span style={{ marginLeft: 'auto' }}>
              <strong>Tên xe:</strong> {quote.vehicle_name}
            </span>
            <span style={{ marginLeft: '16px' }}>
              <strong>Biển số xe:</strong> {quote.license_plate}
            </span>
          </div>
          <div>
            <strong>Ngày báo giá:</strong> {formatDate(quote.quote_date)}
          </div>
        </div>

        <table className="quote-table" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '16px' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: '30px' }}>STT</th>
              <th style={headerCellStyle}>Hạng mục / Bộ phận</th>
              <th style={headerCellStyle}>Triệu chứng</th>
              <th style={headerCellStyle}>Kết quả chẩn đoán</th>
              <th style={headerCellStyle}>Phương án sửa chữa</th>
              <th style={headerCellStyle}>Vật tư/Phụ tùng</th>
              <th style={{ ...headerCellStyle, width: '30px' }}>SL</th>
              <th style={headerCellStyle}>Đơn giá</th>
              <th style={headerCellStyle}>Công thợ</th>
              <th style={headerCellStyle}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td style={centerCellStyle}>{idx + 1}</td>
                <td style={cellStyle}>{item.component_name}</td>
                <td style={cellStyle}>{item.symptom}</td>
                <td style={cellStyle}>{item.diagnosis_result}</td>
                <td style={cellStyle}>{item.repair_method}</td>
                <td style={cellStyle}>{item.part_name}</td>
                <td style={centerCellStyle}>{item.quantity}</td>
                <td style={rightCellStyle}>{formatNumber(item.unit_price)}</td>
                <td style={rightCellStyle}>{formatNumber(item.labor_cost)}</td>
                <td style={rightCellStyle}>{formatNumber(item.total_amount)}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 3 - items.length))].map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td style={centerCellStyle}>{items.length + idx + 1}</td>
                <td style={cellStyle}>&nbsp;</td>
                <td style={cellStyle}>&nbsp;</td>
                <td style={cellStyle}>&nbsp;</td>
                <td style={cellStyle}>&nbsp;</td>
                <td style={cellStyle}>&nbsp;</td>
                <td style={cellStyle}>&nbsp;</td>
                <td style={cellStyle}>&nbsp;</td>
                <td style={cellStyle}>&nbsp;</td>
                <td style={cellStyle}>&nbsp;</td>
              </tr>
            ))}
            <tr>
              <td colSpan={9} style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'right' }}>
                Tổng cộng:
              </td>
              <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'right' }}>
                {formatNumber(quote.total_amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginBottom: '8px', fontSize: '13px' }}>
          <div style={{ fontWeight: 'bold' }}>Ghi chú / Điều kiện:</div>
          {quote.notes && <div style={{ marginBottom: '4px' }}>{quote.notes}</div>}
          <div>- Phát sinh chỉ thực hiện khi có sự chấp nhận của khách hàng</div>
        </div>

        <table style={{ width: '100%', marginTop: '30px', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', textAlign: 'center', border: 'none', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>CVDV</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</div>
                <div style={{ height: '70px' }} />
              </td>
              <td style={{ width: '50%', textAlign: 'center', border: 'none', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>KHÁCH HÀNG</div>
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
