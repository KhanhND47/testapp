interface CriteriaResult {
  index: number;
  passed: boolean | null;
  note: string;
}

interface RepairItemSummary {
  name: string;
}

interface Props {
  customerName: string;
  customerPhone: string;
  companyName: string;
  taxId: string;
  address: string;
  vehicleName: string;
  modelYear: string;
  licensePlate: string;
  odo: string;
  fuelLevel: string;
  criteriaResults: CriteriaResult[];
  repairItems: RepairItemSummary[];
  receiverName: string;
  supervisorName: string;
  customerSignerName: string;
}

const CRITERIA_LABELS = [
  'Các hạng mục sửa chữa đã được thực hiện đúng theo Lệnh sửa chữa.',
  'Xe đã được chạy thử và vận hành ổn định.',
  'Không phát sinh lỗi mới, đèn báo mới sau sửa chữa.',
  'Tình trạng xe và tài sản đúng như Phiếu tiếp nhận xe.',
  'Xe được vệ sinh trước khi bàn giao.',
];

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

export default function AcceptanceHandoverPrintTemplate({
  customerName,
  customerPhone,
  companyName,
  taxId,
  address,
  vehicleName,
  modelYear,
  licensePlate,
  odo,
  fuelLevel,
  criteriaResults,
  repairItems,
  receiverName,
  supervisorName,
  customerSignerName,
}: Props) {
  return (
    <div className="acceptance-print-template hidden">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .acceptance-print-template,
          .acceptance-print-template * {
            visibility: visible;
          }
          .acceptance-print-template {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: 'Times New Roman', serif;
            font-size: 13px;
            color: #000;
          }
          .print-no-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div style={{ padding: '20px 40px' }}>
        <div style={{ textAlign: 'left', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', fontStyle: 'italic' }}>
            CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ TOÀN CẦU VÀNG
          </div>
          <div style={{ fontSize: '12px' }}>
            Địa chỉ: 137 Lê Đình Lý, Phường Thanh Khê, Thành phố Đà Nẵng
          </div>
          <div style={{ fontSize: '12px' }}>MST: 0401827781</div>
          <div style={{ fontSize: '12px' }}>
            <strong>GARA DANA365</strong> - Địa chỉ: 88 Lê Đại Hành, Đà Nẵng
          </div>
          <div style={{ fontSize: '12px' }}>Số điện thoại: 0962.7777.79</div>
        </div>

        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
            PHIẾU NGHIỆM THU VÀ BÀN GIAO XE
          </h1>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', border: 'none', padding: '2px 0', fontWeight: 'bold' }}>
                1. Thông tin về khách hàng
              </td>
              <td style={{ width: '50%', border: 'none', padding: '2px 0', fontWeight: 'bold' }}>
                2. Thông tin về xe
              </td>
            </tr>
            <tr>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Tên khách:</em> {customerName}
              </td>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Tên xe:</em> {vehicleName}
              </td>
            </tr>
            <tr>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Số điện thoại:</em> {customerPhone}
              </td>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Đời xe:</em> {modelYear}
              </td>
            </tr>
            <tr>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Tên Công ty:</em> {companyName}
              </td>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Biển số xe:</em> {licensePlate}
              </td>
            </tr>
            <tr>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>MST:</em> {taxId}
              </td>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Odo:</em> {odo}
              </td>
            </tr>
            <tr>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Địa chỉ:</em> {address}
              </td>
              <td style={{ border: 'none', padding: '2px 0' }}>
                <em>Mức nhiên liệu:</em> {fuelLevel}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: 'right', marginBottom: '4px', fontSize: '12px' }}>
          <em>Đ: Đạt; KĐ: Không đạt</em>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '4px 8px', width: '40px', textAlign: 'center' }} rowSpan={2}>STT</th>
              <th style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center' }} rowSpan={2}>Nội dung nghiệm thu</th>
              <th style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center' }} colSpan={2}>Kết quả</th>
              <th style={{ border: '1px solid #000', padding: '4px 8px', width: '120px', textAlign: 'center' }} rowSpan={2}>Ghi chú</th>
            </tr>
            <tr>
              <th style={{ border: '1px solid #000', padding: '4px 8px', width: '40px', textAlign: 'center' }}>Đ</th>
              <th style={{ border: '1px solid #000', padding: '4px 8px', width: '40px', textAlign: 'center' }}>KĐ</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA_LABELS.map((label, idx) => {
              const result = criteriaResults[idx];
              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                    {ROMAN_NUMERALS[idx]}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px' }}>{label}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center' }}>
                    {result?.passed === true ? 'X' : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center' }}>
                    {result?.passed === false ? 'X' : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '12px' }}>
                    {result?.note || ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginBottom: '4px', fontWeight: 'bold', fontStyle: 'italic' }}>
          Danh sách hạng mục sửa chữa đã nghiệm thu:
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <tbody>
            {repairItems.length > 0 ? (
              repairItems.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #000', padding: '3px 8px', width: '40px', textAlign: 'center' }}>
                    {idx + 1}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 8px' }}>{item.name}</td>
                </tr>
              ))
            ) : (
              [0, 1, 2].map((idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #000', padding: '3px 8px', width: '40px', textAlign: 'center' }}>
                    {idx + 1}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>&nbsp;</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="print-no-break">
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>XÁC NHẬN CỦA KHÁCH HÀNG:</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Tôi xác nhận đã được bàn giao xe, đã kiểm tra tình trạng xe và các hạng mục sửa chữa.
              Mọi nội dung đã được giải thích rõ ràng và tôi đồng ý nhận xe.
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
            <tbody>
              <tr>
                <td style={{ width: '33%', border: 'none', textAlign: 'center', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold' }}>CVDV/ NV tiếp nhận</div>
                  <div style={{ fontSize: '11px', fontStyle: 'italic' }}>( Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div>{receiverName}</div>
                </td>
                <td style={{ width: '33%', border: 'none', textAlign: 'center', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold' }}>Tổ trưởng/Quản đốc</div>
                  <div style={{ fontSize: '11px', fontStyle: 'italic' }}>( Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div>{supervisorName}</div>
                </td>
                <td style={{ width: '33%', border: 'none', textAlign: 'center', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold' }}>Khách hàng</div>
                  <div style={{ fontSize: '11px', fontStyle: 'italic' }}>( Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div>{customerSignerName}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
