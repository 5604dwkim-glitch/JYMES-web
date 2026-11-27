import {
  ILLUMINANCE_MONTHS,
  ILLUMINANCE_PAPER_SPEC,
  ILLUMINANCE_POINTS,
  ILLUMINANCE_TARGET_COMPANY,
  judgeIlluminance,
   ILLUMINANCE_JUDGEMENT,
  toLuxNumber
} from '../constants/illuminanceMeasurement';

/**
 * 조도측정 관리 대장 (연간 1~12월 시트) 엑셀(.xlsx) 다운로드
 */
export async function exportIlluminanceLedgerToExcel({ year, ledgerMatrix, monthMeta }) {
  const ExcelJS = (await import('exceljs')).default;
  const { saveAs } = await import('file-saver');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'JYMES';
  wb.created = new Date();

  const ws = wb.addWorksheet(`${year}년 조도측정 관리 대장`, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1
    }
  });

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FF64748B' } },
    left: { style: 'thin', color: { argb: 'FF64748B' } },
    bottom: { style: 'thin', color: { argb: 'FF64748B' } },
    right: { style: 'thin', color: { argb: 'FF64748B' } }
  };

  // 1행: 제목
  ws.mergeCells('A1:O1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `■ (${year}년) 조도측정 관리 대장`;
  titleCell.font = { name: '맑은 고딕', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 30;

  // 2행: 대상업체
  ws.mergeCells('A2:O2');
  const subCell = ws.getCell('A2');
  subCell.value = `▷대상업체 : ${ILLUMINANCE_TARGET_COMPANY}`;
  subCell.font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left' };
  subCell.border = {
    top: { style: 'medium', color: { argb: 'FF1E3A8A' } }
  };
  ws.getRow(2).height = 24;

  // 3~4행: 테이블 헤더 (순 / 측정공정 / 표준 lux / {year}년 -> 1월~12월)
  ws.mergeCells('A3:A4');
  ws.mergeCells('B3:B4');
  ws.mergeCells('C3:C4');
  ws.mergeCells('D3:O3');

  ws.getCell('A3').value = '순';
  ws.getCell('B3').value = '측정공정';
  ws.getCell('C3').value = '표준 lux';
  ws.getCell('D3').value = `${year}년`;

  ILLUMINANCE_MONTHS.forEach((m, idx) => {
    const colIdx = 4 + idx;
    ws.getRow(4).getCell(colIdx).value = `${m}월`;
  });

  ws.getRow(3).height = 22;
  ws.getRow(4).height = 22;

  for (let r = 3; r <= 4; r += 1) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 15; c += 1) {
      const cell = row.getCell(c);
      cell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  // 5~14행: 1~10번 측정공정 데이터
  ILLUMINANCE_POINTS.forEach((pt) => {
    const rowValues = [pt.no, pt.name, pt.standardLabel];
    ILLUMINANCE_MONTHS.forEach((m) => {
      const cellData = ledgerMatrix?.[pt.no]?.[m];
      const luxNum = toLuxNumber(cellData?.measuredLux);
      rowValues.push(luxNum !== null ? `${luxNum} LUX` : '');
    });
    const addedRow = ws.addRow(rowValues);
    addedRow.height = 26;
    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > 15) return;
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (colNumber >= 4) {
        const m = colNumber - 3;
        const cellData = ledgerMatrix?.[pt.no]?.[m];
        const judgement = judgeIlluminance(cellData?.measuredLux, pt.standardLux);
        const isFail = judgement === ILLUMINANCE_JUDGEMENT.FAIL;
        cell.font = {
          name: '맑은 고딕',
          size: 10,
          bold: cellData?.measuredLux !== undefined && cellData?.measuredLux !== '',
          color: { argb: isFail ? 'FFB91C1C' : 'FF0F172A' }
        };
        if (isFail) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      } else {
        cell.font = {
          name: '맑은 고딕',
          size: 10,
          bold: colNumber === 2
        };
      }
    });
  });

  // 15행: 측정일
  const dateRowValues = ['측정일', '', ''];
  ILLUMINANCE_MONTHS.forEach((m) => {
    dateRowValues.push(monthMeta?.[m]?.date || '');
  });
  const dateRow = ws.addRow(dateRowValues);
  dateRow.height = 26;
  ws.mergeCells(`A${dateRow.number}:C${dateRow.number}`);

  // 16행: 측정시간
  const timeRowValues = ['측정시간', '', ''];
  ILLUMINANCE_MONTHS.forEach((m) => {
    timeRowValues.push(monthMeta?.[m]?.measureTime || '');
  });
  const timeRow = ws.addRow(timeRowValues);
  timeRow.height = 26;
  ws.mergeCells(`A${timeRow.number}:C${timeRow.number}`);

  [dateRow, timeRow].forEach((r) => {
    for (let c = 1; c <= 15; c += 1) {
      const cell = r.getCell(c);
      cell.font = { name: '맑은 고딕', size: 10, bold: c <= 3, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  });

  // 17행: 하단 푸터 (조영산업 / A4(210×297))
  const footerRow = ws.addRow(['', '', '', '', '', '', '', ILLUMINANCE_TARGET_COMPANY, '', '', '', '', '', '', ILLUMINANCE_PAPER_SPEC]);
  footerRow.height = 20;
  ws.mergeCells(`A${footerRow.number}:N${footerRow.number}`);
  const footerCenter = footerRow.getCell(1);
  footerCenter.value = ILLUMINANCE_TARGET_COMPANY;
  footerCenter.font = { name: '맑은 고딕', size: 10, color: { argb: 'FF334155' } };
  footerCenter.alignment = { vertical: 'middle', horizontal: 'center' };

  const footerRight = footerRow.getCell(15);
  footerRight.value = ILLUMINANCE_PAPER_SPEC;
  footerRight.font = { name: '맑은 고딕', size: 9, color: { argb: 'FF475569' } };
  footerRight.alignment = { vertical: 'middle', horizontal: 'right' };

  // 열 너비 설정
  ws.getColumn(1).width = 7;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 13;
  for (let c = 4; c <= 15; c += 1) {
    ws.getColumn(c).width = 11.5;
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `${year}년_조도측정_관리_대장_${ILLUMINANCE_TARGET_COMPANY}.xlsx`);
}
