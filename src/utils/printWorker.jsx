import ReactDOMServer from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

export function printWorkerCard(worker) {
  const loginUrl = `https://jy001-eb144.web.app/login?id=${encodeURIComponent((worker.id || worker.name || '').trim())}&pw=0000`;

  // Render QR Code to SVG string
  const qrSvgString = ReactDOMServer.renderToString(
    <QRCodeSVG value={loginUrl} size={100} level={"L"} />
  );

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해 주세요.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>작업자 이력카드 출력 - ${worker.name}</title>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4 portrait;
            margin: 0; /* Removing margins helps fit exactly 2 cards */
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #fff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Noto Sans KR', sans-serif, Arial;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          /* One card takes exactly half the height of A4 minus some padding */
          .card-wrapper {
            width: 210mm;
            height: 148.5mm; /* exactly half of A4 height (297mm) */
            padding: 15mm;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            align-items: center;
            border-bottom: 1px dashed #ccc;
          }

          table.worker-card {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #0f172a; /* darker border for outer */
            font-size: 16px;
            text-align: center;
          }

          table.worker-card td {
            border: 1px solid #475569; /* slightly softer inner border */
            padding: 14px 12px;
            color: #0f172a;
          }

          .header-td {
            font-weight: 900;
            font-size: 26px;
            letter-spacing: 2px;
            background-color: #f1f5f9 !important;
          }

          .title-td {
            font-weight: 800;
            font-size: 15px;
            background-color: #f8fafc !important;
            color: #334155;
          }
          
          .photo-container {
            width: 240px;
            height: 320px;
            background-color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            margin: 0 auto;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
          }
          
          .photo-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .qr-container {
            margin-top: 10px;
            display: flex;
            justify-content: center;
          }
          .qr-container svg {
            display: block;
          }
        </style>
      </head>
      <body>
        <!-- First Card -->
        <div class="card-wrapper">
          <table class="worker-card">
            <tbody>
              <tr>
                <td rowspan="4" style="width: 260px; vertical-align: top; padding: 0;">
                  <div class="photo-container">
                    ${worker.photoData ? `<img src="${worker.photoData}" alt="Profile" />` : '<div style="color:#999;">사진 없음</div>'}
                  </div>
                </td>
                <td colspan="4" class="header-td" style="height: 60px;">
                  작업자 실명 이력카드
                </td>
              </tr>
              <tr>
                <td class="title-td" style="width: 100px;">작업자</td>
                <td colspan="3" style="font-weight: bold; font-size: 20px;">
                  ${worker.name}
                </td>
              </tr>
              <tr>
                <td class="title-td">소속부서</td>
                <td style="width: 140px;">${worker.dept || '생산'}</td>
                <td class="title-td" style="width: 100px;">공정</td>
                <td style="width: 140px;">${worker.process || '-'}</td>
              </tr>
              <tr>
                <td class="title-td">입사일자</td>
                <td>${worker.hireDate || '-'}</td>
                <td class="title-td">직급</td>
                <td>${worker.role || '-'}</td>
              </tr>
              <tr>
                <td style="vertical-align: middle; height: 160px; padding: 16px;">
                  <div style="font-size: 15px; font-weight: 800; margin-bottom: 12px; color: #1e293b; letter-spacing: 0.5px;">작업일보 작성 QR 코드</div>
                  <div class="qr-container">
                    ${qrSvgString}
                  </div>
                </td>
                <td class="title-td">사번</td>
                <td colspan="3" style="font-weight: 900; font-size: 22px; color: #0f172a; letter-spacing: 1px;">
                  ${worker.id}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Second Card (Duplicate for 2 per page) -->
        <div class="card-wrapper" style="border-bottom: none;">
          <table class="worker-card">
            <tbody>
              <tr>
                <td rowspan="4" style="width: 260px; vertical-align: top; padding: 0;">
                  <div class="photo-container">
                    ${worker.photoData ? `<img src="${worker.photoData}" alt="Profile" />` : '<div style="color:#999;">사진 없음</div>'}
                  </div>
                </td>
                <td colspan="4" class="header-td" style="height: 60px;">
                  작업자 실명 이력카드
                </td>
              </tr>
              <tr>
                <td class="title-td" style="width: 100px;">작업자</td>
                <td colspan="3" style="font-weight: bold; font-size: 20px;">
                  ${worker.name}
                </td>
              </tr>
              <tr>
                <td class="title-td">소속부서</td>
                <td style="width: 140px;">${worker.dept || '생산'}</td>
                <td class="title-td" style="width: 100px;">공정</td>
                <td style="width: 140px;">${worker.process || '-'}</td>
              </tr>
              <tr>
                <td class="title-td">입사일자</td>
                <td>${worker.hireDate || '-'}</td>
                <td class="title-td">직급</td>
                <td>${worker.role || '-'}</td>
              </tr>
              <tr>
                <td style="vertical-align: middle; height: 160px; padding: 16px;">
                  <div style="font-size: 15px; font-weight: 800; margin-bottom: 12px; color: #1e293b; letter-spacing: 0.5px;">작업일보 작성 QR 코드</div>
                  <div class="qr-container">
                    ${qrSvgString}
                  </div>
                </td>
                <td class="title-td">사번</td>
                <td colspan="3" style="font-weight: 900; font-size: 22px; color: #0f172a; letter-spacing: 1px;">
                  ${worker.id}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for images to load before printing
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
