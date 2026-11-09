import { TPM_CIRCLED_NUMBERS, DEFAULT_TPM_GUIDE_PHOTO } from '../constants/tpmLogTemplate';

const MARK_COLORS = { O: '#15803d', X: '#dc2626', '△': '#d97706' };

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolvePhotoUrl(photo) {
  const src = photo || DEFAULT_TPM_GUIDE_PHOTO || '';
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  return `${window.location.origin}${src.startsWith('/') ? '' : '/'}${src}`;
}

export function printTpmLogSheet({ equipment, year, month, template, log, photo }) {
  if (!equipment || !template || !log) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해 주세요.');
    return;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const photoUrl = resolvePhotoUrl(photo);

  const eqName = escapeHtml(equipment.name || '');
  const eqCode = escapeHtml(equipment.code || '');

  const legendRowsHtml = (template.legend || [])
    .map((name, i) => {
      const trimmed = String(name || '').trim();
      const numLabel = trimmed ? (TPM_CIRCLED_NUMBERS[i] || `${i + 1}`) : '&nbsp;';
      return `
        <tr>
          <td class="legend-num">${numLabel}</td>
          <td class="legend-name">${trimmed ? escapeHtml(trimmed) : '&nbsp;'}</td>
        </tr>
      `;
    })
    .join('');

  const weeklyRowsHtml = (template.weekly || [])
    .map((w, i) => {
      const rec = log.weekly?.[i] || {};
      const resultVal = String(rec.result || '').trim();
      const resultColor = MARK_COLORS[resultVal] || '#0f172a';
      const isLast = i === (template.weekly.length - 1);
      const bottomCls = isLast ? 'no-bottom' : '';
      return `
        <tr>
          <td class="wk-td ${bottomCls}" style="border-left: none;">제( ${i + 1} )주</td>
          <td class="wk-td ${bottomCls}">${escapeHtml(w?.part || '')}</td>
          <td class="wk-td ${bottomCls}">${escapeHtml(w?.criterion || '')}</td>
          <td class="wk-td wk-mark ${bottomCls}" style="color: ${resultColor};">${escapeHtml(resultVal)}</td>
          <td class="wk-td ${bottomCls}">${escapeHtml(rec.action || '')}</td>
          <td class="wk-td ${bottomCls}">${escapeHtml(rec.confirm || '')}</td>
        </tr>
      `;
    })
    .join('');

  const dailyHeaderDaysHtml = days
    .map((d) => {
      const outCls = d > daysInMonth ? 'out-day' : '';
      return `<th class="day-th ${outCls}">${d}</th>`;
    })
    .join('');

  const dailyItemRowsHtml = (template.items || [])
    .map((item, itemIndex) =>
      (item.rows || [])
        .map((row, rowIndex) => {
          const leftCells =
            rowIndex === 0
              ? `
                <td rowspan="${item.rows.length}" class="item-num-td">
                  ${TPM_CIRCLED_NUMBERS[itemIndex] || itemIndex + 1}
                </td>
                <td rowspan="${item.rows.length}" class="item-name-td">
                  <div class="item-ko">${escapeHtml(item.name || '')}</div>
                  ${item.nameEn ? `<div class="item-en">${escapeHtml(item.nameEn)}</div>` : ''}
                </td>
              `
              : '';

          const dayCells = days
            .map((day) => {
              const outOfMonth = day > daysInMonth;
              const rawVal = String(log.daily?.[row.id]?.[day] ?? '').trim();
              const isMark = rawVal === 'O' || rawVal === 'X' || rawVal === '△';
              const color = MARK_COLORS[rawVal] || '#0f172a';
              const valCls = isMark
                ? 'mark-val'
                : rawVal.length >= 4
                  ? 'num-val-sm'
                  : 'num-val';
              return `
                <td class="daily-td ${outOfMonth ? 'out-day' : ''}">
                  <span class="${valCls}" style="color: ${color};">${escapeHtml(rawVal)}</span>
                </td>
              `;
            })
            .join('');

          return `
            <tr>
              ${leftCells}
              <td class="crit-td">${escapeHtml(row.criterion || '')}</td>
              ${dayCells}
            </tr>
          `;
        })
        .join('')
    )
    .join('');

  const renderStampRowHtml = (label, field) => {
    const cells = days
      .map((day) => {
        const outOfMonth = day > daysInMonth;
        const val = String(log[field]?.[day] ?? '').trim();
        return `
          <td class="stamp-day-td ${outOfMonth ? 'out-day' : ''}">
            ${escapeHtml(val)}
          </td>
        `;
      })
      .join('');

    return `
      <tr>
        <td colspan="3" class="stamp-label-td">${escapeHtml(label)}</td>
        ${cells}
      </tr>
    `;
  };

  const colgroupDaysHtml = days.map(() => '<col />').join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>TPM 일지 출력 - ${eqName} (${eqCode}) ${year}년 ${month}월</title>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif, Arial;
            color: #000;
          }

          @media screen {
            body {
              background-color: #e2e8f0;
              display: flex;
              justify-content: center;
              padding: 12px 0;
            }
            .tpm-print-sheet {
              background-color: #ffffff;
              box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
            }
          }

          .no-print-bar {
            position: fixed;
            top: 12px;
            right: 16px;
            display: flex;
            gap: 8px;
            z-index: 200;
          }

          .no-print-btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #1e293b;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.14);
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
            html, body {
              width: 297mm;
              height: 209.5mm;
              overflow: hidden;
              background: #ffffff;
            }
          }

          .tpm-print-sheet {
            width: 297mm;
            height: 209.5mm;
            padding: 5.5mm 6.5mm;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Band 1: 상단 헤더 */
          .top-header {
            height: 14mm;
            flex-shrink: 0;
            display: flex;
            align-items: stretch;
            border: 1px solid #000;
            border-bottom: none;
          }

          .eq-meta-box {
            width: 64mm;
            border-right: 1px solid #000;
            display: flex;
            flex-direction: column;
            font-size: 12px;
            font-weight: 600;
          }

          .eq-meta-row {
            flex: 1;
            display: flex;
            align-items: center;
            padding: 0 3mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .eq-meta-row:first-child {
            border-bottom: 1px solid #000;
          }

          .sheet-title-wrap {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.2mm 4mm;
          }

          .sheet-title-box {
            border: 1px solid #000;
            padding: 1.4mm 8mm;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 1px;
            white-space: nowrap;
          }

          .company-box {
            width: 45mm;
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            padding: 1.5mm 3mm;
            font-size: 13px;
            font-weight: 700;
          }

          /* Band 2: 사진 / 부위명칭 / 주간 점검 기록 */
          .upper-panel {
            height: 67mm;
            flex-shrink: 0;
            display: flex;
            border: 1px solid #000;
            border-bottom: none;
          }

          .photo-panel {
            width: 64mm;
            padding: 1.5mm;
            border-right: 1px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .photo-frame {
            width: 100%;
            height: 100%;
            border: 1px solid #cbd5e1;
            overflow: hidden;
          }

          .photo-frame img {
            width: 100%;
            height: 100%;
            object-fit: fill;
            display: block;
          }

          .legend-panel {
            width: 49mm;
            padding: 6mm 2mm 1.5mm;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }

          table.legend-table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          table.legend-table th,
          table.legend-table td {
            border: 1px solid #000;
            font-size: 10.5px;
            padding: 0 1.5mm;
          }

          table.legend-table th {
            font-weight: 800;
            text-align: center;
            height: 5.5mm;
            background: #fff;
          }

          .legend-num {
            width: 9mm;
            text-align: center;
          }

          .legend-name {
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .weekly-panel {
            flex: 1;
            border-left: 1px solid #000;
            display: flex;
          }

          table.weekly-table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            text-align: center;
          }

          table.weekly-table th {
            border-bottom: 1px solid #000;
            border-left: 1px solid #000;
            font-size: 11.5px;
            font-weight: 800;
            padding: 0.8mm 1mm;
          }

          table.weekly-table th.wk-group-th {
            border-left: none;
            background: #e5e7eb;
            height: 6.5mm;
            font-size: 12px;
          }

          table.weekly-table th.wk-sub-th {
            background: #ffffff;
            height: 6.5mm;
          }

          .wk-td {
            border-left: 1px solid #000;
            border-bottom: 1px solid #000;
            font-size: 11.5px;
            padding: 0.6mm 1.2mm;
            word-break: keep-all;
          }

          .wk-td.no-bottom {
            border-bottom: none;
          }

          .wk-mark {
            font-weight: 900;
            font-size: 13px;
          }

          /* Band 3: 판정 기호 안내 */
          .mark-guide-bar {
            height: 8mm;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 0 2.5mm;
            border: 1px solid #000;
            border-bottom: none;
          }

          .mark-guide-box {
            border: 1px solid #000;
            padding: 0.7mm 4mm;
            font-size: 11.5px;
            font-weight: 800;
          }

          /* Band 4: 설비 일상 점검 (1~31일) */
          .daily-panel {
            flex: 1;
            min-height: 0;
            display: flex;
          }

          table.daily-table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            text-align: center;
          }

          table.daily-table th,
          table.daily-table td {
            border: 1px solid #000;
            padding: 0;
          }

          table.daily-table thead th {
            font-weight: 800;
            font-size: 11.5px;
            background: #ffffff;
            height: 5.5mm;
          }

          table.daily-table thead th.day-th {
            font-size: 10.5px;
          }

          .out-day {
            background-color: #e5e7eb !important;
          }

          .item-num-td {
            font-size: 13px;
            font-weight: 700;
          }

          .item-name-td {
            padding: 0.5mm 1mm !important;
            word-break: keep-all;
          }

          .item-ko {
            font-size: 11px;
            font-weight: 700;
            line-height: 1.15;
          }

          .item-en {
            font-size: 9px;
            color: #1e293b;
            line-height: 1.1;
            margin-top: 0.4mm;
          }

          .crit-td {
            font-size: 10px;
            padding: 0.5mm 1mm !important;
            word-break: keep-all;
            line-height: 1.15;
          }

          .daily-td {
            border-top: 1px dotted #000 !important;
            border-bottom: 1px dotted #000 !important;
            border-left: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            vertical-align: middle;
          }

          .mark-val {
            font-size: 12px;
            font-weight: 900;
            line-height: 1;
          }

          .num-val {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: -0.3px;
            line-height: 1;
          }

          .num-val-sm {
            font-size: 8.5px;
            font-weight: 800;
            letter-spacing: -0.4px;
            line-height: 1;
          }

          .stamp-label-td {
            font-size: 11.5px;
            font-weight: 800;
            height: 6.8mm;
            background: #ffffff;
          }

          .stamp-day-td {
            font-size: 8.5px;
            font-weight: 800;
            color: #1d4ed8;
            line-height: 1.05;
            overflow: hidden;
            word-break: break-all;
            padding: 0 0.3mm !important;
          }

          /* Band 5: 이상발생시 처리보고 순서 */
          .bottom-flow-bar {
            height: 7.5mm;
            flex-shrink: 0;
            border: 1px solid #000;
            border-top: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2.5mm;
            font-size: 12px;
            font-weight: 800;
          }

          .flow-step {
            border: 1px solid #000;
            padding: 0.4mm 2.5mm;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <button type="button" class="no-print-btn primary" onclick="window.print()">🖨️ 인쇄하기 (A4 가로)</button>
          <button type="button" class="no-print-btn" onclick="window.close()">창 닫기</button>
        </div>

        <div class="tpm-print-sheet">
          <!-- Band 1 -->
          <div class="top-header">
            <div class="eq-meta-box">
              <div class="eq-meta-row">설비명칭 : ${eqName}</div>
              <div class="eq-meta-row">설비번호 : ${eqCode}</div>
            </div>
            <div class="sheet-title-wrap">
              <div class="sheet-title-box">${year} 年 ( ${month} )月 설비 일상 점검 일지</div>
            </div>
            <div class="company-box">㈜ 조영산업</div>
          </div>

          <!-- Band 2 -->
          <div class="upper-panel">
            <div class="photo-panel">
              <div class="photo-frame">
                ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="설비 사진" />` : ''}
              </div>
            </div>

            <div class="legend-panel">
              <table class="legend-table">
                <thead>
                  <tr>
                    <th class="legend-num">번호</th>
                    <th>부위명칭</th>
                  </tr>
                </thead>
                <tbody>
                  ${legendRowsHtml}
                </tbody>
              </table>
            </div>

            <div class="weekly-panel">
              <table class="weekly-table">
                <colgroup>
                  <col style="width: 18mm;" />
                  <col style="width: 28mm;" />
                  <col />
                  <col style="width: 16mm;" />
                  <col style="width: 36mm;" />
                  <col style="width: 18mm;" />
                </colgroup>
                <thead>
                  <tr>
                    <th colspan="6" class="wk-group-th">주간 점검 기록</th>
                  </tr>
                  <tr>
                    <th class="wk-sub-th" style="border-left: none;">구분</th>
                    <th class="wk-sub-th">점검부위</th>
                    <th class="wk-sub-th">점검기준</th>
                    <th class="wk-sub-th">결과</th>
                    <th class="wk-sub-th">조치</th>
                    <th class="wk-sub-th">확인</th>
                  </tr>
                </thead>
                <tbody>
                  ${weeklyRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Band 3 -->
          <div class="mark-guide-bar">
            <div class="mark-guide-box">O : 양호,&nbsp;&nbsp;X : 이상,&nbsp;&nbsp;△ : 수리</div>
          </div>

          <!-- Band 4 -->
          <div class="daily-panel">
            <table class="daily-table">
              <colgroup>
                <col style="width: 7.5mm;" />
                <col style="width: 31mm;" />
                <col style="width: 35.5mm;" />
                ${colgroupDaysHtml}
              </colgroup>
              <thead>
                <tr>
                  <th colspan="2" rowspan="2">부위</th>
                  <th rowspan="2">점검기준</th>
                  <th colspan="31">설비 일상 점검</th>
                </tr>
                <tr>
                  ${dailyHeaderDaysHtml}
                </tr>
              </thead>
              <tbody>
                ${dailyItemRowsHtml}
                ${renderStampRowHtml('작업자 확인', 'worker')}
                ${renderStampRowHtml('관리자 확인', 'manager')}
              </tbody>
            </table>
          </div>

          <!-- Band 5 -->
          <div class="bottom-flow-bar">
            <span>이상발생시처리보고순서 :</span>
            <span class="flow-step">작업자</span>
            <span>→</span>
            <span class="flow-step">관리자</span>
            <span>→</span>
            <span class="flow-step">대표</span>
          </div>
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

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  const waitForImagesAndPrint = () => {
    const imgs = Array.from(printWindow.document.images || []);
    if (imgs.length === 0 || imgs.every((img) => img.complete)) {
      setTimeout(triggerPrint, 120);
      return;
    }

    let remaining = imgs.filter((img) => !img.complete).length;
    const onSettled = () => {
      remaining -= 1;
      if (remaining <= 0) {
        setTimeout(triggerPrint, 120);
      }
    };

    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', onSettled, { once: true });
        img.addEventListener('error', onSettled, { once: true });
      }
    });

    // 이미지 지연 시 최대 1.5초 후에는 반드시 인쇄창 실행
    setTimeout(triggerPrint, 1500);
  };

  if (printWindow.document.readyState === 'complete') {
    waitForImagesAndPrint();
  } else {
    printWindow.addEventListener('load', waitForImagesAndPrint, { once: true });
  }
}
