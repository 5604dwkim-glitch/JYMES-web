/**
 * GM 9BQC - G/RUN 종합 현황판 전용 엑셀(.xlsx) 다운로드 유틸리티
 * (공정별 실적·품질 / 부자재 LOT 현황 / 압출소재 LOT 상세 3개 시트 출력)
 */
export async function exportGm9bqcGrunToExcel({ model, periodLabel = '', shiftLabel = '전체' }) {
  const ExcelJS = (await import('exceljs')).default;
  const { saveAs } = await import('file-saver');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'JYMES';
  wb.created = new Date();

  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const subHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  // ── 시트 1: 공정별 실적 및 품질 현황 ──
  const ws1 = wb.addWorksheet('1_공정별_실적_품질');
  ws1.mergeCells('A1:J1');
  const t1 = ws1.getCell('A1');
  t1.value = `GM 9BQC - G/RUN 실시간 종합 관제 현황 (${periodLabel} / 시프트: ${shiftLabel})`;
  t1.font = { name: '맑은 고딕', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  t1.fill = headerFill;
  t1.alignment = { vertical: 'middle', horizontal: 'center' };
  ws1.getRow(1).height = 28;

  const cols1 = [
    '양식코드',
    '공정그룹',
    '공정명',
    'LH(FRT) 실적',
    'RH(RR) 실적',
    '총 생산실적(EA)',
    '불량수량(EA)',
    '불량률(%)',
    '최다 불량유형',
    '담당 작업자'
  ];
  const hRow1 = ws1.addRow(cols1);
  hRow1.height = 22;
  hRow1.eachCell((cell) => {
    cell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = subHeaderFill;
    cell.border = borderThin;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  model.processRows.forEach((p) => {
    const r = ws1.addRow([
      `#${p.code}`,
      p.stageGroup,
      p.processName,
      p.lh,
      p.rh,
      p.actual,
      p.defect,
      Number(p.defectRate.toFixed(2)),
      p.topDefect ? `${p.topDefect.name} (${p.topDefect.count})` : '-',
      p.workers.join(', ') || '-'
    ]);
    r.height = 20;
    r.eachCell((cell, colNumber) => {
      cell.font = { name: '맑은 고딕', size: 10 };
      cell.border = borderThin;
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber >= 4 && colNumber <= 8 ? 'right' : 'center'
      };
    });
  });

  const sumRow = ws1.addRow([
    '합계',
    `${model.activeProcessCount}/12 가동`,
    '-',
    model.processRows.reduce((acc, x) => acc + x.lh, 0),
    model.processRows.reduce((acc, x) => acc + x.rh, 0),
    model.totalActual,
    model.totalDefect,
    Number(model.defectRateTotal.toFixed(2)),
    model.worstProcess ? `최다불량: #${model.worstProcess.code} ${model.worstProcess.shortName}` : '-',
    `일보 ${model.totalReports}건`
  ]);
  sumRow.height = 22;
  sumRow.eachCell((cell, colNumber) => {
    cell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    cell.border = borderThin;
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNumber >= 4 && colNumber <= 8 ? 'right' : 'center'
    };
  });

  ws1.columns = [
    { width: 11 },
    { width: 12 },
    { width: 22 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 14 },
    { width: 12 },
    { width: 22 },
    { width: 20 }
  ];

  // ── 시트 2: 부자재 LOT 실시간 현황 ──
  const ws2 = wb.addWorksheet('2_부자재_LOT_현황');
  ws2.mergeCells('A1:G1');
  const t2 = ws2.getCell('A1');
  t2.value = `GM 9BQC - G/RUN 부자재 및 원재료 LOT 현황 (${periodLabel})`;
  t2.font = { name: '맑은 고딕', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  t2.fill = headerFill;
  t2.alignment = { vertical: 'middle', horizontal: 'center' };
  ws2.getRow(1).height = 28;

  const hRow2 = ws2.addRow(['부자재 품목', '적용 공정', '규격/정보', '대표 LOT', '1단계(초/FRT)', '2단계(중/RR-R)', '3단계(종/Fixed)']);
  hRow2.height = 22;
  hRow2.eachCell((cell) => {
    cell.font = { name: '맑은 고딕', size: 10, bold: true };
    cell.fill = subHeaderFill;
    cell.border = borderThin;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  model.subMaterialCards.forEach((c) => {
    const r = ws2.addRow([
      c.title,
      c.processBadge,
      c.specLabel,
      c.primaryLot || '미입력',
      c.stages[0]?.value || '-',
      c.stages[1]?.value || '-',
      c.stages[2]?.value || '-'
    ]);
    r.height = 20;
    r.eachCell((cell) => {
      cell.font = { name: '맑은 고딕', size: 10 };
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  ws2.columns = [
    { width: 16 },
    { width: 22 },
    { width: 22 },
    { width: 24 },
    { width: 20 },
    { width: 20 },
    { width: 20 }
  ];

  // ── 시트 3: 공정별 투입 압출소재 LOT 현황 ──
  const ws3 = wb.addWorksheet('3_압출소재_LOT_현황');
  ws3.mergeCells('A1:G1');
  const t3 = ws3.getCell('A1');
  t3.value = `GM 9BQC - G/RUN 공정별 투입 압출소재 LOT 현황 (${periodLabel})`;
  t3.font = { name: '맑은 고딕', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  t3.fill = headerFill;
  t3.alignment = { vertical: 'middle', horizontal: 'center' };
  ws3.getRow(1).height = 28;

  const hRow3 = ws3.addRow(['양식코드', '공정그룹', '공정명', '품목구분', '초물 LOT', '중물 LOT', '종물 LOT']);
  hRow3.height = 22;
  hRow3.eachCell((cell) => {
    cell.font = { name: '맑은 고딕', size: 10, bold: true };
    cell.fill = subHeaderFill;
    cell.border = borderThin;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  model.processRows.forEach((p) => {
    const r = ws3.addRow([
      `#${p.code}`,
      p.stageGroup,
      p.processName,
      p.partDesc,
      p.lotSummary.초물 || '-',
      p.lotSummary.중물 || '-',
      p.lotSummary.종물 || '-'
    ]);
    r.height = 20;
    r.eachCell((cell) => {
      cell.font = { name: '맑은 고딕', size: 10 };
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  ws3.columns = [
    { width: 11 },
    { width: 12 },
    { width: 22 },
    { width: 24 },
    { width: 22 },
    { width: 22 },
    { width: 22 }
  ];

  const buf = await wb.xlsx.writeBuffer();
  const safePeriod = String(periodLabel || '현황').replace(/[^0-9A-Za-z가-힣_-]/g, '_');
  saveAs(new Blob([buf]), `JYMES_9BQC_GRUN_종합현황판_${safePeriod}.xlsx`);
}
