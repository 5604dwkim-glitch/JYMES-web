import ReactDOMServer from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

export function printWorkerCard(worker) {
  const loginUrl = `${window.location.origin}/login?id=${encodeURIComponent((worker.id || worker.name || '').trim())}&pw=0000&_t=${Date.now()}`; // cache buster

  // Render QR Code to SVG string
  const qrSvgString = ReactDOMServer.renderToString(
    <QRCodeSVG value={loginUrl} size={120} level={"L"} />
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
            margin: 0;
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
          
          .card-wrapper {
            width: 210mm;
            height: 148.5mm;
            padding: 15mm;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            align-items: center;
            border-bottom: 1px dashed #ccc;
          }

          table.worker-card {
            width: 100%;
            height: 90%;
            border-collapse: collapse;
            border: 2px solid #111;
            font-size: 17px;
            text-align: center;
          }

          table.worker-card td, table.worker-card th {
            border: 1px solid #111;
            padding: 12px;
            color: #111;
          }

          .header-td {
            font-weight: 900;
            font-size: 26px;
            letter-spacing: 2px;
            height: 60px;
          }

          .title-td {
            font-weight: 700;
            font-size: 16px;
          }
          
          .photo-container {
            width: 160px;
            height: 213px;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            margin: 0 auto;
          }
          
          .photo-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .qr-container {
            display: flex;
            justify-content: center;
            align-items: center;
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
                <td colspan="5" class="header-td">
                  작업자 실명 이력카드
                </td>
              </tr>
              <tr>
                <td rowspan="3" style="width: 220px; vertical-align: middle; padding: 10px;">
                  <div class="photo-container">
                    ${worker.photoData ? `<img src="${worker.photoData}" alt="Profile" />` : '<div style="color:#666; font-size:15px;">사진<br>(300*400)</div>'}
                  </div>
                </td>
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
                <td style="vertical-align: middle; height: 160px;">
                  <div class="qr-container">
                    ${qrSvgString}
                  </div>
                </td>
                <td class="title-td">사번</td>
                <td colspan="3" style="font-weight: 900; font-size: 24px; letter-spacing: 1px;">
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
                <td colspan="5" class="header-td">
                  작업자 실명 이력카드
                </td>
              </tr>
              <tr>
                <td rowspan="3" style="width: 220px; vertical-align: middle; padding: 10px;">
                  <div class="photo-container">
                    ${worker.photoData ? `<img src="${worker.photoData}" alt="Profile" />` : '<div style="color:#666; font-size:15px;">사진<br>(300*400)</div>'}
                  </div>
                </td>
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
                <td style="vertical-align: middle; height: 160px;">
                  <div class="qr-container">
                    ${qrSvgString}
                  </div>
                </td>
                <td class="title-td">사번</td>
                <td colspan="3" style="font-weight: 900; font-size: 24px; letter-spacing: 1px;">
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
