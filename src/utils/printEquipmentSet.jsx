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

  if (validType && validSpec) return `${validType}/${validSpec}`;
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

/**
 * 지브라 라벨 프린터용 설비 셋트 관리 카드 QR 출력 (104mm × 104mm)
 * - 추가 프로그램 설치 없이 Windows 드라이버(브라우저 인쇄)로 104×104mm 라벨 1매 출력
 */
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
  const eqFontSize = rowCount > 8 ? '7.5pt' : rowCount > 6 ? '8.5pt' : '9.5pt';
  const eqCellPad = rowCount > 8 ? '0.5mm 0.8mm' : rowCount > 6 ? '0.7mm 0.8mm' : '0.9mm 1mm';
  const setTitleFontSize = String(equipmentSet.name || '').length > 16 ? '13pt' : '15.5pt';

  const qrSvgString = ReactDOMServer.renderToString(
    <QRCodeSVG
      value={qrUrl}
      size={132}
      level="M"
      shapeRendering="crispEdges"
    />
  );

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해 주세요.');
    return;
  }

  const setTitle = escapeHtml(equipmentSet.name || '-');

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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>설비 셋트 QR 라벨 출력 (104×104mm) - ${setTitle}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 104mm 104mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: 'Malgun Gothic', '맑은 고딕', 'Noto Sans KR', Arial, sans-serif;
            -webkit-font-smoothing: none;
            text-rendering: geometricPrecision;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print-bar {
            position: fixed;
            top: 12px;
            right: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 100;
            background: rgba(255, 255, 255, 0.96);
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          }

          .no-print-tip {
            font-size: 12px;
            color: #334155;
            font-weight: 600;
            margin-right: 4px;
          }

          .no-print-btn {
            padding: 7px 14px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #1e293b;
          }

          .no-print-btn.primary {
            background: #2563eb;
            color: #ffffff;
            border-color: #1d4ed8;
          }

          @media screen {
            body {
              background: #f1f5f9;
              padding: 64px 16px 24px;
              display: flex;
              justify-content: center;
            }
            .label-card {
              background: #ffffff;
              border: 1px dashed #94a3b8;
              box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
            }
          }

          @media print {
            .no-print-bar {
              display: none !important;
            }
            body {
              background: #ffffff;
              padding: 0;
            }
            .label-card {
              border: none;
              box-shadow: none;
            }
          }

          .label-card {
            width: 104mm;
            height: 104mm;
            padding: 3mm 3.5mm;
            display: flex;
            flex-direction: column;
            gap: 1.8mm;
            overflow: hidden;
          }

          .card-header {
            background: #000000;
            color: #ffffff;
            text-align: center;
            font-size: 13pt;
            font-weight: 900;
            letter-spacing: 1.5px;
            padding: 1.1mm 2mm;
            flex-shrink: 0;
          }

          .top-row {
            display: flex;
            gap: 2.5mm;
            align-items: stretch;
            border: 2px solid #000000;
            padding: 1.8mm 2.2mm;
            flex-shrink: 0;
          }

          .set-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .info-label {
            font-size: 9pt;
            font-weight: 900;
            color: #000000;
          }

          .set-name {
            font-size: ${setTitleFontSize};
            font-weight: 900;
            line-height: 1.18;
            color: #000000;
            word-break: keep-all;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            margin-top: 0.4mm;
          }

          .set-count-row {
            display: flex;
            align-items: center;
            gap: 2mm;
            margin-top: 1.2mm;
            padding-top: 1.2mm;
            border-top: 1.5px solid #000000;
          }

          .set-count-badge {
            font-size: 10pt;
            font-weight: 900;
            border: 1.5px solid #000000;
            padding: 0.4mm 2mm;
            white-space: nowrap;
          }

          .qr-caption {
            margin-top: 1.2mm;
            font-size: 8.5pt;
            font-weight: 900;
            line-height: 1.22;
            color: #000000;
          }

          .qr-panel {
            width: 33mm;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-left: 1.5px solid #000000;
            padding-left: 2mm;
          }

          .qr-title {
            font-size: 8.5pt;
            font-weight: 900;
            margin-bottom: 0.8mm;
            text-align: center;
          }

          .qr-frame {
            width: 29mm;
            height: 29mm;
            padding: 1.2mm;
            border: 1.5px solid #000000;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr-frame svg {
            width: 26.5mm;
            height: 26.5mm;
            display: block;
          }

          .table-wrap {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }

          table.eq-table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 2px solid #000000;
            text-align: center;
          }

          table.eq-table th,
          table.eq-table td {
            border: 1.2px solid #000000;
            color: #000000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          table.eq-table th {
            font-size: 8.5pt;
            font-weight: 900;
            padding: 0.8mm 0.8mm;
            background: #ffffff;
            border-bottom: 2px solid #000000;
            height: 5.5mm;
          }

          .eq-td {
            font-size: ${eqFontSize};
            padding: ${eqCellPad};
            font-weight: 900;
          }

          .eq-code {
            font-weight: 900;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span class="no-print-tip">104×104mm 라벨 · 인쇄 시 여백 없음 / 배율 100%</span>
          <button type="button" class="no-print-btn primary" onclick="window.print()">인쇄하기</button>
          <button type="button" class="no-print-btn" onclick="window.close()">창 닫기</button>
        </div>

        <section class="label-card">
          <div class="card-header">설비 셋트 관리 카드</div>

          <div class="top-row">
            <div class="set-info">
              <div>
                <div class="info-label">셋트 이름</div>
                <div class="set-name">${setTitle}</div>
              </div>
              <div>
                <div class="set-count-row">
                  <span class="set-count-badge">포함 설비 총 ${eqList.length}대</span>
                </div>
                <div class="qr-caption">작업 전 QR 스캔하여<br/>셋트 TPM 일지 작성</div>
              </div>
            </div>

            <div class="qr-panel">
              <div class="qr-title">TPM 일지 QR</div>
              <div class="qr-frame">${qrSvgString}</div>
            </div>
          </div>

          <div class="table-wrap">
            <table class="eq-table">
              <colgroup>
                <col style="width: 6.5mm;" />
                <col style="width: 22.5mm;" />
                <col style="width: 27mm;" />
                <col style="width: 23mm;" />
                <col style="width: 17mm;" />
              </colgroup>
              <thead>
                <tr>
                  <th>No</th>
                  <th>관리번호</th>
                  <th>포함 설비명</th>
                  <th>간략 사양</th>
                  <th>제작처</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </section>
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
