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

function getCodeFontSize(code) {
  const len = String(code || '').trim().length;
  if (len <= 8) return '25pt';
  if (len <= 11) return '20pt';
  return '17pt';
}

function formatLocationAndSpec(eq) {
  const loc = String(eq?.location ?? '').trim();
  const spec = String(eq?.spec ?? '').trim();
  const parts = [];
  if (loc && loc !== '-') parts.push(`위치: ${loc}`);
  if (spec && spec !== '-') parts.push(spec);
  return parts.length > 0 ? parts.join(' · ') : '-';
}

/**
 * 지브라 바코드/라벨 프린터용 개별 설비 QR 라벨 출력 (104mm × 65mm)
 * - 추가 프로그램 설치 없이 Windows 프린터 드라이버(브라우저 인쇄)로 연속 라벨 출력
 * - QR 스캔 시 해당 설비의 이력카드(/equipment-history/:equipmentId)로 직접 이동
 */
export function printEquipmentLabels(equipmentSet, resolvedEquipments = []) {
  const eqList = Array.isArray(resolvedEquipments)
    ? resolvedEquipments.filter((eq) => eq && eq.id)
    : [];

  if (eqList.length === 0) {
    alert('출력할 설비 정보가 없습니다.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해 주세요.');
    return;
  }

  const setTitle = escapeHtml(equipmentSet?.name || '설비 라벨');
  const origin = window.location.origin;

  const labelsHtml = eqList
    .map((eq, idx) => {
      const qrUrl = `${origin}/equipment-history/${encodeURIComponent(eq.id)}`;
      const qrSvgString = ReactDOMServer.renderToString(
        <QRCodeSVG
          value={qrUrl}
          size={140}
          level="M"
          shapeRendering="crispEdges"
        />
      );

      const codeText = String(eq.code || '-').trim() || '-';
      const nameText = String(eq.name || '-').trim() || '-';
      const subMeta = formatLocationAndSpec(eq);
      const codeFontSize = getCodeFontSize(codeText);

      return `
        <section class="label-page">
          <div class="label-top">
            <span class="label-badge">설비 이력카드 QR</span>
            <span class="label-set">${setTitle} (${idx + 1}/${eqList.length})</span>
          </div>

          <div class="label-body">
            <div class="qr-box">
              ${qrSvgString}
            </div>
            <div class="info-box">
              <div class="code-caption">관리번호</div>
              <div class="eq-code" style="font-size: ${codeFontSize};">${escapeHtml(codeText)}</div>
              <div class="divider"></div>
              <div class="eq-name">${escapeHtml(nameText)}</div>
              <div class="eq-meta">${escapeHtml(subMeta)}</div>
            </div>
          </div>

          <div class="label-bottom">
            QR 스캔 시 해당 설비 이력카드로 이동합니다
          </div>
        </section>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>설비 라벨 출력 (104×65mm) - ${setTitle}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 104mm 65mm;
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
            background: #0f766e;
            color: #ffffff;
            border-color: #115e59;
          }

          @media screen {
            body {
              background: #f1f5f9;
              padding: 64px 16px 24px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
            }
            .label-page {
              background: #ffffff;
              border: 1px dashed #94a3b8;
              box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
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
            .label-page {
              border: none;
              box-shadow: none;
            }
          }

          .label-page {
            width: 104mm;
            height: 65mm;
            padding: 3mm 4mm 2.5mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
          }

          .label-page:last-of-type {
            page-break-after: auto;
            break-after: auto;
          }

          .label-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 1.2mm;
            gap: 2mm;
          }

          .label-badge {
            display: inline-block;
            background: #000000;
            color: #ffffff;
            font-size: 9.5pt;
            font-weight: 900;
            padding: 0.6mm 2.2mm;
            border-radius: 1mm;
            letter-spacing: 0.2px;
            white-space: nowrap;
          }

          .label-set {
            font-size: 10pt;
            font-weight: 900;
            color: #000000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .label-body {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 3.5mm;
            padding: 1.2mm 0;
            min-height: 0;
          }

          .qr-box {
            width: 39mm;
            height: 39mm;
            padding: 1.8mm;
            border: 2px solid #000000;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .qr-box svg {
            width: 35mm;
            height: 35mm;
            display: block;
          }

          .info-box {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .code-caption {
            font-size: 10pt;
            font-weight: 900;
            color: #000000;
            margin-bottom: 0.4mm;
          }

          .eq-code {
            font-family: 'Arial Black', 'Malgun Gothic', sans-serif;
            font-weight: 900;
            line-height: 1.08;
            letter-spacing: -0.3px;
            color: #000000;
            word-break: break-all;
          }

          .divider {
            border-top: 2px solid #000000;
            margin: 1.8mm 0;
          }

          .eq-name {
            font-size: 14.5pt;
            font-weight: 900;
            line-height: 1.2;
            color: #000000;
            word-break: keep-all;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .eq-meta {
            margin-top: 1mm;
            font-size: 11.5pt;
            font-weight: 900;
            line-height: 1.2;
            color: #000000;
            word-break: keep-all;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .label-bottom {
            border-top: 1.5px solid #000000;
            padding-top: 1mm;
            font-size: 9pt;
            font-weight: 900;
            text-align: center;
            color: #000000;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span class="no-print-tip">총 ${eqList.length}매 (104×65mm) · 인쇄 시 여백 없음 / 배율 100%</span>
          <button type="button" class="no-print-btn primary" onclick="window.print()">인쇄하기</button>
          <button type="button" class="no-print-btn" onclick="window.close()">창 닫기</button>
        </div>
        ${labelsHtml}
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
