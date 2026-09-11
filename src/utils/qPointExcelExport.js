import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Helper to add base64 image to exceljs
const addImageToCell = (workbook, worksheet, base64Image, tl, ext) => {
  if (!base64Image) return;
  try {
    const imageId = workbook.addImage({
      base64: base64Image,
      extension: 'jpeg',
    });
    worksheet.addImage(imageId, {
      tl: tl,
      ext: ext,
      editAs: 'oneCell'
    });
  } catch (e) {
    console.error('Failed to add image to excel', e);
  }
};

export const exportQPointToExcel = async (qPointData, rowData) => {
  const data = qPointData || {};
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('변경내용이력표', {
    pageSetup: { paperSize: 9, orientation: 'landscape', margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3 } }
  });

  // Columns definition (Total 12 columns for fine-grained merging)
  sheet.columns = [
    { width: 10 }, { width: 12 }, { width: 15 }, { width: 15 }, 
    { width: 10 }, { width: 15 }, { width: 15 }, { width: 15 }, 
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }
  ];

  const borderStyle = {
    top: { style: 'thin' }, left: { style: 'thin' },
    bottom: { style: 'thin' }, right: { style: 'thin' }
  };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2FF' } }; // Light blue
  const alignCenter = { vertical: 'middle', horizontal: 'center', wrapText: true };
  const alignLeft = { vertical: 'middle', horizontal: 'left', wrapText: true };

  // Row 1: Title
  sheet.mergeCells('A1:L1');
  const r1 = sheet.getCell('A1');
  r1.value = 'Level2. 4M 변경 시 ISIR 미대상(사전통보)                                        변경 이력표                                                               권장 양식';
  r1.font = { bold: true, size: 10 };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  r1.border = borderStyle;
  r1.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 25;

  // Row 2: Date
  sheet.mergeCells('A2:L2');
  const r2 = sheet.getCell('A2');
  r2.value = `작성일자 : ${data.reportDate || ''}`;
  r2.alignment = { vertical: 'middle', horizontal: 'right' };
  r2.font = { size: 10, bold: true };
  sheet.getRow(2).height = 20;

  // Row 3: 변경 내용 이력표
  sheet.mergeCells('A3:C4');
  const titleCell = sheet.getCell('A3');
  titleCell.value = '변경 내용 이력표';
  titleCell.font = { size: 20, bold: true };
  titleCell.alignment = alignCenter;
  
  sheet.getCell('D3').value = '차종(연식)';
  sheet.getCell('D3').fill = headerFill;
  sheet.getCell('E3').value = data.carModel || '';
  sheet.getCell('F3').value = '품 명';
  sheet.getCell('F3').fill = headerFill;
  sheet.mergeCells('G3:H3');
  sheet.getCell('G3').value = data.partName || '';
  sheet.getCell('I3').value = '협력사명';
  sheet.getCell('I3').fill = headerFill;
  sheet.mergeCells('J3:L3');
  sheet.getCell('J3').value = data.partnerName || '';

  sheet.getCell('D4').value = '개발유형';
  sheet.getCell('D4').fill = headerFill;
  sheet.getCell('E4').value = data.devType || '';
  sheet.getCell('F4').value = '품 번';
  sheet.getCell('F4').fill = headerFill;
  sheet.mergeCells('G4:H4');
  sheet.getCell('G4').value = data.partNo || '';
  sheet.getCell('I4').value = '작성자';
  sheet.getCell('I4').fill = headerFill;
  sheet.mergeCells('J4:L4');
  sheet.getCell('J4').value = data.author || '';

  // Row 5: 변경 사유
  sheet.mergeCells('A5:B5');
  sheet.getCell('A5').value = '변경 사유';
  sheet.getCell('A5').fill = headerFill;
  sheet.mergeCells('C5:F5');
  sheet.getCell('C5').value = data.changeReason || '';
  sheet.mergeCells('G5:H5');
  sheet.getCell('G5').value = '변경 작업자';
  sheet.getCell('G5').fill = headerFill;
  sheet.mergeCells('I5:L5');
  sheet.getCell('I5').value = data.changeWorker || '';

  // Row 6: 변경 서류
  sheet.mergeCells('A6:B6');
  sheet.getCell('A6').value = '변경 서류';
  sheet.getCell('A6').fill = headerFill;
  sheet.mergeCells('C6:L6');
  const docs = data.changeDocs || [];
  const docOther = data.changeDocsOther || '';
  sheet.getCell('C6').value = ` ${docs.includes('변경 내용 이력표')?'■':'□'} 변경 내용 이력표   ${docs.includes('검사성적서')?'■':'□'} 검사성적서   ${docs.includes('기타')?'■':'□'} 기타( ${docOther} )`;
  sheet.getCell('C6').alignment = alignLeft;

  // Row 7: 수요자 검토
  sheet.mergeCells('A7:B7');
  sheet.getCell('A7').value = '수요자 검토';
  sheet.getCell('A7').fill = headerFill;
  sheet.mergeCells('C7:L7');
  const needs = data.reviewNeeds || [];
  const needsOther = data.reviewNeedsOther || '';
  sheet.getCell('C7').value = ` ${needs.includes('공정점검 필요')?'■':'□'} 공정점검 필요   ${needs.includes('조립적합성 필요')?'■':'□'} 조립적합성 필요   ${needs.includes('완성차 품질확인 필요')?'■':'□'} 완성차 품질확인 필요   ${needs.includes('기타')?'■':'□'} 기타( ${needsOther} )`;
  sheet.getCell('C7').alignment = alignLeft;

  // Row 8: 변경 일시
  sheet.mergeCells('A8:B8');
  sheet.getCell('A8').value = '변경 일시';
  sheet.getCell('A8').fill = headerFill;
  sheet.mergeCells('C8:D8');
  sheet.getCell('C8').value = data.changeDate || '';
  sheet.mergeCells('E8:F8');
  sheet.getCell('E8').value = '적용 예정일';
  sheet.getCell('E8').fill = headerFill;
  sheet.mergeCells('G8:H8');
  sheet.getCell('G8').value = data.applyDate || '';
  sheet.mergeCells('I8:J8');
  sheet.getCell('I8').value = '변경품 식별표시 방법';
  sheet.getCell('I8').fill = headerFill;
  sheet.mergeCells('K8:L8');
  sheet.getCell('K8').value = data.identifyMethod || '無';

  // Row 9: 변경내용 (전/후)
  sheet.getRow(9).height = 250;
  sheet.mergeCells('A9:B9');
  sheet.getCell('A9').value = '변경내용\n(전/후)';
  sheet.getCell('A9').fill = headerFill;
  
  sheet.mergeCells('C9:L9');
  sheet.getCell('C9').value = data.changeContentText || '';
  sheet.getCell('C9').alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  
  // Insert Images manually (approximate positions in cell C9)
  // 350x350 pixels is roughly 262x262 points.
  // Col C starts at 3rd col, let's put beforeImage at Col D, afterImage at Col I.
  if (data.beforeImage) {
    addImageToCell(workbook, sheet, data.beforeImage, { col: 3.5, row: 8.5 }, { width: 350, height: 350 });
  }
  if (data.afterImage) {
    addImageToCell(workbook, sheet, data.afterImage, { col: 8.5, row: 8.5 }, { width: 350, height: 350 });
  }

  // Row 10-13: 변경 후 품질 점검 결과
  sheet.mergeCells('A10:B13');
  sheet.getCell('A10').value = '변경 후\n품질 점검\n결과';
  sheet.getCell('A10').fill = headerFill;

  // Row 10
  sheet.getCell('C10').value = '업체';
  sheet.getCell('C10').fill = headerFill;
  sheet.mergeCells('D10:E10');
  sheet.getCell('D10').value = '화승알앤에이';
  sheet.mergeCells('F10:H10');
  sheet.getCell('F10').value = `협력사명: ${data.qcPartner || ''}`;
  sheet.getCell('F10').fill = headerFill;
  
  sheet.mergeCells('I10:I13');
  sheet.getCell('I10').value = '품질 확인';
  sheet.getCell('I10').fill = headerFill;
  
  sheet.getCell('J10').value = '화승\n알앤에이';
  sheet.mergeCells('J10:J11');
  sheet.mergeCells('K10:L11');
  sheet.getCell('K10').value = `${data.qcApprover1 || ''} (서명)`;

  // Row 11
  sheet.getCell('C11').value = '확인 수량';
  sheet.getCell('C11').fill = headerFill;
  sheet.mergeCells('D11:H11');
  sheet.getCell('D11').value = data.qcQuantity || '';

  // Row 12
  sheet.getCell('C12').value = '확인 내용';
  sheet.getCell('C12').fill = headerFill;
  sheet.mergeCells('D12:H12');
  sheet.getCell('D12').value = data.qcContent || '';
  
  sheet.getCell('J12').value = '협력사';
  sheet.mergeCells('J12:J13');
  sheet.mergeCells('K12:L13');
  sheet.getCell('K12').value = `${data.qcApprover2 || ''} (서명)`;

  // Row 13
  sheet.getCell('C13').value = '확인 결과';
  sheet.getCell('C13').fill = headerFill;
  sheet.mergeCells('D13:H13');
  sheet.getCell('D13').value = data.qcResult || '';

  // Apply borders and alignments to all cells in table
  for (let r = 3; r <= 13; r++) {
    const row = sheet.getRow(r);
    if (r !== 9) row.height = 30; // standard height except image row
    for (let c = 1; c <= 12; c++) {
      const cell = row.getCell(c);
      cell.border = borderStyle;
      if (!cell.alignment) {
        cell.alignment = alignCenter;
      }
    }
  }

  // Row 14: PAGE
  sheet.mergeCells('A14:L14');
  const r14 = sheet.getCell('A14');
  r14.value = 'PAGE : 1/1';
  r14.alignment = { vertical: 'middle', horizontal: 'right' };
  r14.font = { bold: true };
  r14.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  r14.border = borderStyle;

  // Generate File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `QPOINT_변경이력표_${data.carModel || '공통'}_${data.partName || '부품'}.xlsx`);
};
