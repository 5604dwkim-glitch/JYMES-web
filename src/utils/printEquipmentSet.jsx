import ReactDOMServer from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatBriefSpec(eq) {
  const type = String(eq?.type ?? '').trim();
  const spec = String(eq?.spec ?? '').trim();
  const validType = type && type !== '-' ? type : '';
  const validSpec = spec && spec !== '-' ? spec : '';

  if (validType && validSpec) return `${validType} / ${validSpec}`;
  if (validSpec) return validSpec;
  if (validType) return validType;
  return '-';
}

function formatManufacturerOrLoc(eq) {
  const mfg = String(eq?.manufacturer ?? '').trim();
  if (mfg && mfg !== '-') return mfg;
  const loc = String(eq?.location ?? '').trim();
  if (loc && loc !== '-') return loc;
  return '-';
}

export function printEquipmentSetCard(equipmentSet, resolvedEquipments = []) {
  if (!equipmentSet) return;

  const qrUrl = `${window.location.origin}/tpm-check/${encodeURIComponent(equipmentSet.id)}`;
  const eqList = Array.isArray(resolvedEquipments) ? resolvedEquipments : [];

  const minRows = 4;
  const displayRows = [...eqList];
  while (displayRows.length < minRows) {
    displayRows.push(null);
  }

  const rowCount = displayRows.length;
  const qrSize = rowCount > 8 ? 118 : rowCount > 6 ? 128 : 138;
  const eqFontSize = rowCount > 8 ? '10.5px' : rowCount > 6 ? '11.5px' : '13px';
  const eqCellPad = rowCount > 8 ? '2px 4px' : rowCount > 6 ? '3px 5px' : '5px 6px';

  const qrSvgString = ReactDOMServer.renderToString(
    <QRCodeSVG value={qrUrl} size={qrSize} level="M" />
  );

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해 주세요.');
    return;
  }

  const setTitle = escapeHtml(equipmentSet.name || '-');
  const rowspanCount = 2 + displayRows.length;

  const rowsHtml = displayRows
    .map((eq, idx) => {
      if (!eq) {
        return `
          <tr>
            <td class="eq-td">&nbsp;</td>
            <td class="eq-td">&nbsp;</td>
            <td class="eq-td">&nbsp;</td>
            <td class="eq-td">&nbsp;</td>
            <td class="eq-td">&nbsp;</td>
          </tr>
        `;
      }
      return `
        <tr>
          <td class="eq-td">${idx + 1}</td>
          <td class="eq-td eq-code">${escapeHtml(eq.code || '-')}</td>
          <td class="eq-td eq-name">${escapeHtml(eq.name || '-')}</td>
          <td class="eq-td">${escapeHtml(formatBriefSpec(eq))}</td>
          <td class="eq-td">${escapeHtml(formatManufacturerOrLoc(eq))}</td>
        </tr>
      `;
    })
    .join('');

  const renderCardTable = () => `
    <table class="set-card">
      <colgroup>
        <col style="width: 9mm;" />
        <col style="width: 28mm;" />
        <col style="width: 38mm;" />
        <col style="width: 36mm;" />
        <col style="width: 25mm;" />
        <col style="width: 48mm;" />
      </colgroup>
      <tbody>
        <tr>
          <td colspan="6" class="header-td">
            설비 셋트 관리 카드
          </td>
        </tr>
        <tr>
          <td colspan="2" class="title-td">셋트 이름</td>
          <td colspan="2" class="set-name-td">${setTitle}</td>
          <td class="count-td">총 ${eqList.length}대</td>
          <td rowspan="${rowspanCount}" class="qr-td">
            <div class="qr-box">
              <div class="qr-heading">TPM 일지 QR 코드</div>
              <div class="qr-frame">
                ${qrSvgString}
              </div>
              <div class="qr-set-name">${setTitle}</div>
              <div class="qr-caption">작업 전 QR 스캔하여<br/>셋트 TPM 일지 작성</div>
            </div>
          </td>
        </tr>
        <tr>
          <th class="sub-th">No</th>
          <th class="sub-th">관리번호</th>
          <th class="sub-th">포함 설비명</th>
          <th class="sub-th">간략 사양</th>
          <th class="sub-th">제작처</th>
        </tr>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>설비 셋트 QR 코드 출력 - ${setTitle}</title>
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
            font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif, Arial;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .no-print-bar {
            position: fixed;
            top: 12px;
            right: 16px;
            display: flex;
            gap: 8px;
            z-index: 100;
          }

          .no-print-btn {
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #1e293b;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          }

          .no-print-btn.primary {
            background: #2563eb;
            color: #ffffff;
            border-color: #1d4ed8;
          }

          @media print {
            .no-print-bar {
              display: none !important;
            }
          }

          .card-wrapper {
            width: 210mm;
            height: 148mm;
            padding: 11mm 13mm;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            align-items: center;
            border-bottom: 1px dashed #ccc;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          table.set-card {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 2px solid #111;
            color: #111;
            text-align: center;
          }

          table.set-card td,
          table.set-card th {
            border: 1px solid #111;
            color: #111;
            word-break: keep-all;
            overflow-wrap: break-word;
          }

          .header-td {
            height: 13.5mm;
            font-weight: 900;
            font-size: 23px;
            letter-spacing: 3px;
          }

          .title-td {
            height: 12.5mm;
            font-weight: 800;
            font-size: 15px;
            background-color: #f8fafc;
          }

          .set-name-td {
            height: 12.5mm;
            font-weight: 900;
            font-size: 18px;
            padding: 4px 8px;
          }

          .count-td {
            height: 12.5mm;
            font-weight: 800;
            font-size: 14px;
            background-color: #f8fafc;
          }

          .sub-th {
            height: 8.5mm;
            font-weight: 800;
            font-size: 12.5px;
            background-color: #f8fafc;
            padding: 3px 4px;
          }

          .eq-td {
            font-size: ${eqFontSize};
            padding: ${eqCellPad};
            font-weight: 600;
          }

          .eq-code {
            font-weight: 800;
            letter-spacing: 0.2px;
          }

          .eq-name {
            font-weight: 700;
          }

          .qr-td {
            vertical-align: middle;
            padding: 8px 6px;
          }

          .qr-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .qr-heading {
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }

          .qr-frame {
            padding: 8px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #fff;
            display: inline-flex;
            justify-content: center;
            align-items: center;
          }

          .qr-frame svg {
            display: block;
          }

          .qr-set-name {
            margin-top: 8px;
            font-size: 13.5px;
            font-weight: 900;
          }

          .qr-caption {
            margin-top: 4px;
            font-size: 11px;
            color: #334155;
            line-height: 1.35;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <button type="button" class="no-print-btn primary" onclick="window.print()">인쇄하기</button>
          <button type="button" class="no-print-btn" onclick="window.close()">창 닫기</button>
        </div>

        <!-- First Card -->
        <div class="card-wrapper">
          ${renderCardTable()}
        </div>

        <!-- Second Card (Duplicate for 2 per A4 portrait page) -->
        <div class="card-wrapper" style="border-bottom: none;">
          ${renderCardTable()}
        </div>
      </body>
    </html>
  `;

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    printWindow.focus();
    printWindow.print();
  };

  printWindow.onload = triggerPrint;
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 150);
  }
}
