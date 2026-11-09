/**
 * 공정 및 불량 분석 엑셀(.xlsx) 다운로드 유틸리티
 * 기존 대시보드 고밀도 차트+테이블 엑셀 출력 포맷을 그대로 보존하여 이관
 */
import { Chart as ChartJS } from 'chart.js';

export async function exportAnalyticsToExcel({
  labels = [],
  effectiveMode = 'daily',
  actuals = [],
  defects = [],
  datasets = [],
  totals = { actual: 0, defect: 0, rate: '0.00' },
  defectTable = { rows: [], grandTotal: 0 },
  defectBreakdown = { list: [], total: 0 },
  filterMfg = 'ALL',
  filterCar = 'ALL',
  filterPart = 'ALL',
  filterProc = 'ALL',
  periodLabel = ''
}) {
  const ExcelJS = (await import('exceljs')).default;
  const { saveAs } = await import('file-saver');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'JYMES';
  wb.created = new Date();

  const ws = wb.addWorksheet('생산추이_불량분석', {
    views: [{ showGridLines: true }]
  });

  const titleFont = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  const subTitleFont = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  const headerFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF334155' } };
  const sunHeaderFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFEF4444' } };
  const regularFont = { name: '맑은 고딕', size: 10, color: { argb: 'FF334155' } };
  const boldFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  const blueFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF1D4ED8' } };
  const redFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFDC2626' } };
  const dimFont = { name: '맑은 고딕', size: 10, color: { argb: 'FF94A3B8' } };

  const navyFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  const lightSlateFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const blueCardFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  const redCardFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
  const orangeCardFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  // 1. 최상단 타이틀 배너
  const titleRow = ws.addRow(['📊 JY MES 공정 및 불량 분석 - 생산 추이 · 불량 파레토 보고서']);
  titleRow.height = 34;
  ws.mergeCells(1, 1, 1, Math.max(5, labels.length + 3));
  titleRow.getCell(1).font = titleFont;
  titleRow.getCell(1).fill = navyFill;
  titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  // 2. 조회 필터 조건 배너
  const filterText = `조회 조건:  제조사: [${filterMfg === 'ALL' ? '전체' : filterMfg}]  |  차종: [${filterCar === 'ALL' ? '전체' : filterCar}]  |  부품: [${filterPart === 'ALL' ? '전체' : filterPart}]  |  공정: [${filterProc === 'ALL' ? '전체' : filterProc}]  |  조회기간: [${periodLabel}]  |  다운로드: ${new Date().toLocaleString('ko-KR')}`;
  const filterRow = ws.addRow([filterText]);
  filterRow.height = 24;
  ws.mergeCells(2, 1, 2, Math.max(5, labels.length + 3));
  filterRow.getCell(1).font = { name: '맑은 고딕', size: 9.5, color: { argb: 'FF475569' } };
  filterRow.getCell(1).fill = lightSlateFill;
  filterRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  filterRow.getCell(1).border = thinBorder;

  // 3. 주요 실적 요약 카드
  ws.addRow([]);
  const kpiRow = ws.addRow([
    '총 생산수량 (EA)',
    Number(totals.actual || 0),
    '총 불량수량 (EA)',
    Number(totals.defect || 0),
    '전체 불량률 (%)',
    `${totals.rate}%`
  ]);
  kpiRow.height = 26;
  kpiRow.getCell(1).font = headerFont;
  kpiRow.getCell(1).fill = blueCardFill;
  kpiRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  kpiRow.getCell(1).border = thinBorder;

  kpiRow.getCell(2).font = blueFont;
  kpiRow.getCell(2).numFmt = '#,##0';
  kpiRow.getCell(2).fill = blueCardFill;
  kpiRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  kpiRow.getCell(2).border = thinBorder;

  kpiRow.getCell(3).font = headerFont;
  kpiRow.getCell(3).fill = redCardFill;
  kpiRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
  kpiRow.getCell(3).border = thinBorder;

  kpiRow.getCell(4).font = redFont;
  kpiRow.getCell(4).numFmt = '#,##0';
  kpiRow.getCell(4).fill = redCardFill;
  kpiRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  kpiRow.getCell(4).border = thinBorder;

  kpiRow.getCell(5).font = headerFont;
  kpiRow.getCell(5).fill = redCardFill;
  kpiRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
  kpiRow.getCell(5).border = thinBorder;

  kpiRow.getCell(6).font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FFDC2626' } };
  kpiRow.getCell(6).fill = redCardFill;
  kpiRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
  kpiRow.getCell(6).border = thinBorder;

  ws.addRow([]);

  // 4. 생산 및 불량 실적 추이 차트 이미지 삽입
  const s1HeaderRow = ws.addRow(['■ 생산 및 불량 실적 추이']);
  s1HeaderRow.height = 22;
  s1HeaderRow.getCell(1).font = subTitleFont;

  if (labels.length > 0) {
    try {
      const nCols = Math.max(1, labels.length);
      const exportDpr = 3;
      const targetColLogicalPx = 100;
      const targetLeftLogicalPx = Math.round(targetColLogicalPx * 2.08);
      const targetRightLogicalPx = Math.round(targetColLogicalPx * 1.24);
      const renderLogicalW = targetLeftLogicalPx + nCols * targetColLogicalPx + targetRightLogicalPx;
      const renderLogicalH = 420;

      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = renderLogicalW;
      renderCanvas.height = renderLogicalH;

      let exportChart = null;
      try {
        exportChart = new ChartJS(renderCanvas, {
          type: 'bar',
          data: {
            labels: [...labels],
            datasets: datasets.map((ds) => ({ ...ds, data: [...(ds.data || [])] }))
          },
          options: {
            responsive: false,
            maintainAspectRatio: false,
            animation: false,
            devicePixelRatio: exportDpr,
            layout: { padding: { left: 130, top: 16, right: 70, bottom: 4 } },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  maxRotation: 0,
                  minRotation: 0,
                  autoSkip: false,
                  font: { size: 11 },
                  color(context) {
                    if (effectiveMode === 'daily' && context.tick && typeof context.tick.value === 'number') {
                      const label = labels[context.tick.value];
                      if (label) {
                        const d = new Date(label);
                        if (!Number.isNaN(d.getTime()) && d.getDay() === 0) return '#ef4444';
                      }
                    }
                    return '#64748b';
                  },
                  callback(val, index) {
                    const label = labels[val];
                    if (effectiveMode !== 'daily' || !label) return label;
                    const d = new Date(label);
                    if (Number.isNaN(d.getTime())) return label;
                    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                    const dayStr = `${d.getDate()}일`;
                    const dowStr = `(${dayNames[d.getDay()]})`;
                    return index === 0 ? [`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${dayStr}`, dowStr] : [dayStr, dowStr];
                  }
                }
              },
              y: { type: 'linear', position: 'left', title: { display: true, text: '수량 (EA)', font: { size: 12 } }, grid: { color: '#f1f5f9' } },
              y1: { type: 'linear', position: 'right', title: { display: true, text: '불량률 (%)', font: { size: 12 } }, grid: { drawOnChartArea: false }, min: 0, grace: '20%' }
            },
            plugins: {
              legend: { position: 'top', labels: { font: { size: 13 }, boxWidth: 12, padding: 16 } },
              tooltip: { enabled: false }
            }
          },
          plugins: [{
            id: 'defectRateLabels',
            afterDatasetsDraw(chart) {
              const ds = chart.data.datasets[0];
              if (!ds) return;
              const meta = chart.getDatasetMeta(0);
              const ctx2 = chart.ctx;
              ctx2.save();
              ctx2.font = 'bold 13px sans-serif';
              ctx2.fillStyle = '#ef4444';
              ctx2.textAlign = 'center';
              ctx2.textBaseline = 'bottom';
              meta.data.forEach((pt, i) => {
                const val = ds.data[i];
                if (val === null || val === undefined || val === '') return;
                ctx2.fillText(`${val}%`, pt.x, pt.y - 10);
              });
              ctx2.restore();
            }
          }, {
            id: 'productionQtyLabels',
            afterDatasetsDraw(chart) {
              const ds = chart.data.datasets[1];
              if (!ds) return;
              const meta = chart.getDatasetMeta(1);
              const ctx2 = chart.ctx;
              ctx2.save();
              ctx2.font = 'bold 12px sans-serif';
              ctx2.fillStyle = '#1d4ed8';
              ctx2.textAlign = 'center';
              ctx2.textBaseline = 'bottom';
              const rateDs = chart.data.datasets[0];
              const rateMeta = chart.getDatasetMeta(0);
              meta.data.forEach((bar, i) => {
                const val = Number(ds.data[i]);
                if (!val) return;
                let y = bar.y - 4;
                const pt = rateMeta.data[i];
                const rv = rateDs && rateDs.data[i];
                if (pt && rv !== null && rv !== undefined && rv !== '') {
                  const rBottom = pt.y - 10;
                  const rTop = rBottom - 14;
                  const qTop = y - 13;
                  if (y > rTop - 2 && qTop < rBottom + 2) y = rTop - 4;
                }
                ctx2.fillText(val.toLocaleString(), bar.x, y);
              });
              ctx2.restore();
            }
          }]
        });
        exportChart.draw();

        if (renderCanvas.width > 0 && renderCanvas.height > 0) {
          const offCanvas = document.createElement('canvas');
          const dpr = exportChart.width > 0 ? (renderCanvas.width / exportChart.width) : exportDpr;
          const ca = exportChart.chartArea;
          const xScale = exportChart.scales?.x;
          let srcPlotLeft = ca ? ca.left * dpr : 170 * dpr;
          let srcPlotRight = ca ? ca.right * dpr : (renderCanvas.width - 60 * dpr);
          if (xScale && nCols >= 2 && typeof xScale.getPixelForValue === 'function') {
            const firstCenter = xScale.getPixelForValue(0) * dpr;
            const lastCenter = xScale.getPixelForValue(nCols - 1) * dpr;
            const step = (lastCenter - firstCenter) / (nCols - 1);
            if (step > 0) {
              srcPlotLeft = firstCenter - step * 0.5;
              srcPlotRight = lastCenter + step * 0.5;
            }
          }
          const srcPlotWidth = Math.max(1, srcPlotRight - srcPlotLeft);
          const oneDateColPx = srcPlotWidth / nCols;
          const dstLeftWidth = Math.round(oneDateColPx * 2.08);
          const dstPlotWidth = Math.round(srcPlotWidth);
          const dstRightWidth = Math.round(oneDateColPx * 1.24);
          offCanvas.width = dstLeftWidth + dstPlotWidth + dstRightWidth;
          offCanvas.height = renderCanvas.height;
          const ctx = offCanvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
          const leftAxisNeed = Math.min(srcPlotLeft, 68 * dpr);
          const rightAxisNeed = Math.min(renderCanvas.width - srcPlotRight, 44 * dpr);
          if (dstLeftWidth >= leftAxisNeed && dstRightWidth >= rightAxisNeed) {
            ctx.drawImage(renderCanvas, Math.round(dstLeftWidth - srcPlotLeft), 0);
          } else {
            ctx.drawImage(renderCanvas, srcPlotLeft, 0, srcPlotWidth, renderCanvas.height, dstLeftWidth, 0, dstPlotWidth, renderCanvas.height);
            const srcLeftX = Math.max(0, srcPlotLeft - leftAxisNeed);
            const srcLeftW = Math.max(1, srcPlotLeft - srcLeftX);
            const drawLeftW = Math.min(dstLeftWidth, srcLeftW);
            ctx.drawImage(renderCanvas, srcLeftX, 0, srcLeftW, renderCanvas.height, dstLeftWidth - drawLeftW, 0, drawLeftW, renderCanvas.height);
            const srcRightW = Math.max(1, rightAxisNeed);
            const drawRightW = Math.min(dstRightWidth, srcRightW);
            ctx.drawImage(renderCanvas, srcPlotRight, 0, srcRightW, renderCanvas.height, dstLeftWidth + dstPlotWidth, 0, drawRightW, renderCanvas.height);
          }
          const base64 = offCanvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, '');
          const imageId = wb.addImage({ base64, extension: 'png' });
          const chartStartNativeRow = ws.rowCount;
          for (let i = 0; i < 16; i++) {
            const r = ws.addRow([]);
            r.height = 20;
          }
          const chartEndNativeRow = ws.rowCount;
          ws.addImage(imageId, {
            tl: { nativeCol: 1, nativeColOff: 0, nativeRow: chartStartNativeRow, nativeRowOff: 0 },
            br: { nativeCol: 3 + nCols, nativeColOff: 0, nativeRow: chartEndNativeRow, nativeRowOff: 0 },
            editAs: 'twoCell'
          });
        }
      } finally {
        if (exportChart) exportChart.destroy();
      }
    } catch (e) {
      console.warn('Chart capture skipped in excel export:', e);
    }
  }

  // 5. 날짜별 수치 테이블
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const formattedHeaders = labels.map((l) => {
    if (effectiveMode === 'daily') {
      const d = new Date(l);
      if (!Number.isNaN(d.getTime())) {
        return { text: `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`, isSun: d.getDay() === 0 };
      }
    }
    return { text: l, isSun: false };
  });

  const pHeaderCells = ['순위', '지표 구분', ...formattedHeaders.map((h) => h.text), '합계 / 전체'];
  const pHeader = ws.addRow(pHeaderCells);
  pHeader.height = 24;
  pHeader.eachCell((cell, colNum) => {
    const isSun = colNum >= 3 && colNum < pHeaderCells.length && formattedHeaders[colNum - 3]?.isSun;
    cell.font = isSun ? sunHeaderFont : headerFont;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const actRowCells = ['-', '생산수량 (EA)', ...actuals, totals.actual];
  const actRow = ws.addRow(actRowCells);
  actRow.height = 22;
  actRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  actRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
  actRow.getCell(2).font = boldFont;
  actRow.getCell(2).fill = lightSlateFill;
  for (let c = 3; c <= actRowCells.length; c++) {
    actRow.getCell(c).numFmt = '#,##0';
    actRow.getCell(c).font = blueFont;
    actRow.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
  }
  actRow.getCell(actRowCells.length).fill = blueCardFill;
  actRow.eachCell((cell) => { cell.border = thinBorder; });

  const defRowCells = ['-', '불량수량 (EA)', ...defects, totals.defect];
  const defRow = ws.addRow(defRowCells);
  defRow.height = 22;
  defRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  defRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
  defRow.getCell(2).font = boldFont;
  defRow.getCell(2).fill = lightSlateFill;
  for (let c = 3; c <= defRowCells.length; c++) {
    defRow.getCell(c).numFmt = '#,##0';
    defRow.getCell(c).font = redFont;
    defRow.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
  }
  defRow.getCell(defRowCells.length).fill = redCardFill;
  defRow.eachCell((cell) => { cell.border = thinBorder; });

  const rateRowCells = [
    '-',
    '불량률 (%)',
    ...labels.map((_, i) => {
      const a = actuals[i] || 0;
      const d = defects[i] || 0;
      return a > 0 ? `${((d / a) * 100).toFixed(2)}%` : '0.00%';
    }),
    `${totals.rate}%`
  ];
  const rateRow = ws.addRow(rateRowCells);
  rateRow.height = 22;
  rateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  rateRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
  rateRow.getCell(2).font = boldFont;
  rateRow.getCell(2).fill = redCardFill;
  for (let c = 3; c <= rateRowCells.length; c++) {
    rateRow.getCell(c).font = redFont;
    rateRow.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
  }
  rateRow.getCell(rateRowCells.length).fill = redCardFill;
  rateRow.eachCell((cell) => { cell.border = thinBorder; });

  ws.addRow([]);

  // 6. 불량 유형별 일자별 발생 수량 테이블
  const s2Title = `■ 불량 유형별 일자별 발생 수량 (총 불량 ${defectTable.grandTotal.toLocaleString()}건, 상위 ${defectTable.rows.length}개 유형)`;
  const s2TitleRow = ws.addRow([s2Title]);
  s2TitleRow.getCell(1).font = subTitleFont;

  const dHeaderCells = ['순위', '불량 유형', ...formattedHeaders.map((h) => h.text), '유형별 합계'];
  const dHeader = ws.addRow(dHeaderCells);
  dHeader.height = 24;
  dHeader.eachCell((cell, colNum) => {
    const isSun = colNum >= 3 && colNum < dHeaderCells.length && formattedHeaders[colNum - 3]?.isSun;
    cell.font = isSun ? sunHeaderFont : headerFont;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  defectTable.rows.forEach((dt, rank) => {
    const rowCells = [rank + 1, dt.name, ...labels.map((l) => dt.perLabel[l] || 0), dt.total];
    const row = ws.addRow(rowCells);
    row.height = 22;

    const rankCell = row.getCell(1);
    rankCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (rank === 0) {
      rankCell.font = redFont;
      rankCell.fill = redCardFill;
    } else if (rank < 3) {
      rankCell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFEA580C' } };
      rankCell.fill = orangeCardFill;
    } else {
      rankCell.font = boldFont;
      rankCell.fill = lightSlateFill;
    }

    row.getCell(2).font = boldFont;
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

    labels.forEach((_, i) => {
      const colIdx = i + 3;
      const val = rowCells[colIdx - 1];
      const c = row.getCell(colIdx);
      if (val > 0) {
        c.value = val;
        c.numFmt = '#,##0';
        c.font = redFont;
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        c.value = '-';
        c.font = dimFont;
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    const lastCell = row.getCell(rowCells.length);
    lastCell.numFmt = '#,##0';
    lastCell.font = boldFont;
    lastCell.fill = lightSlateFill;
    lastCell.alignment = { horizontal: 'right', vertical: 'middle' };
    row.eachCell((cell) => { cell.border = thinBorder; });
  });

  const dTotalCells = ['', '합계 / 전체 불량률', ...labels.map((_, i) => defects[i] || 0), `${totals.rate}%`];
  const dTotalRow = ws.addRow(dTotalCells);
  dTotalRow.height = 25;
  dTotalRow.getCell(1).fill = lightSlateFill;
  dTotalRow.getCell(2).font = boldFont;
  dTotalRow.getCell(2).fill = lightSlateFill;
  dTotalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

  labels.forEach((_, i) => {
    const colIdx = i + 3;
    const val = defects[i] || 0;
    const c = dTotalRow.getCell(colIdx);
    if (val > 0) {
      c.value = val;
      c.numFmt = '#,##0';
      c.font = boldFont;
    } else {
      c.value = '-';
      c.font = dimFont;
    }
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.fill = lightSlateFill;
  });

  const grandRateCell = dTotalRow.getCell(dTotalCells.length);
  grandRateCell.font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FFDC2626' } };
  grandRateCell.fill = redCardFill;
  grandRateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dTotalRow.eachCell((cell) => { cell.border = thinBorder; });

  ws.addRow([]);

  // 7. 불량 유형별 점유율 현황 (Top 15)
  if (defectBreakdown.list && defectBreakdown.list.length > 0) {
    const s3TitleRow = ws.addRow(['■ 불량 유형별 점유율 현황 (Top 15)']);
    s3TitleRow.getCell(1).font = subTitleFont;

    const bHeader = ws.addRow(['순위', '불량 유형', '불량 수량 (EA)', '점유율 (%)']);
    bHeader.height = 24;
    bHeader.eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    defectBreakdown.list.forEach((dt, idx) => {
      const pct = defectBreakdown.total > 0 ? ((dt.qty / defectBreakdown.total) * 100).toFixed(1) : '0.0';
      const row = ws.addRow([idx + 1, dt.name, dt.qty, `${pct}%`]);
      row.height = 20;

      const rCell = row.getCell(1);
      rCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (idx === 0) {
        rCell.font = redFont;
        rCell.fill = redCardFill;
      } else if (idx < 3) {
        rCell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFEA580C' } };
        rCell.fill = orangeCardFill;
      } else {
        rCell.font = regularFont;
        rCell.fill = lightSlateFill;
      }

      row.getCell(2).font = boldFont;
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

      row.getCell(3).numFmt = '#,##0';
      row.getCell(3).font = boldFont;
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };

      row.getCell(4).font = regularFont;
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

      row.eachCell((cell) => { cell.border = thinBorder; });
    });

    const bTotalRow = ws.addRow(['', '총 불량 합계', defectBreakdown.total, '100.0%']);
    bTotalRow.height = 22;
    bTotalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    bTotalRow.getCell(2).font = boldFont;
    bTotalRow.getCell(3).numFmt = '#,##0';
    bTotalRow.getCell(3).font = boldFont;
    bTotalRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    bTotalRow.getCell(4).font = boldFont;
    bTotalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    bTotalRow.eachCell((cell) => {
      cell.fill = redCardFill;
      cell.border = thinBorder;
    });
  }

  ws.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 6;
    else if (idx === 1) col.width = 26;
    else if (idx < labels.length + 2) col.width = 12;
    else col.width = 15;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const safe = (v) => String(v === 'ALL' ? '전체' : v).replace(/[\\/:*?"<>|]/g, '_');
  const now = new Date();
  let yy = String(now.getFullYear()).slice(-2);
  let mm = String(now.getMonth() + 1).padStart(2, '0');
  if (labels.length > 0 && /^\d{4}-\d{2}/.test(labels[labels.length - 1])) {
    yy = labels[labels.length - 1].slice(2, 4);
    mm = labels[labels.length - 1].slice(5, 7);
  }
  const fileName = `${safe(filterCar)}-${safe(filterPart)}-${safe(filterProc)}-${yy}년${mm}월.xlsx`;
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
}
