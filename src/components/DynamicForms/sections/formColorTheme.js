/**
 * 전체 양식(#1xxx~#5xxx) 공통 옅은 색상 배치 통일 유틸리티
 *
 * - 상단 구분 헤더 (thead / 구분·서브헤더 행)      : #e8eef5 (연청회색)
 * - 좌측 대분류 (col 0) / 합계·소계·자동계산 셀    : #f1f5f9 (연회색)
 * - 세부 메뉴 / 항목명 / 스펙(규격) 라벨 셀        : #f8fafc (아주 옅은 슬레이트)
 * - 입력창 (input / select / textarea 및 입력 셀)  : #ffffff (순백색)
 */

export const FORM_TABLE_COLORS = {
  headerBg: '#e8eef5',
  categoryBg: '#f1f5f9',
  menuBg: '#f8fafc',
  inputBg: '#ffffff',
};

const TOTAL_LABEL_RE =
  /^(?:불량\s*합계|불량\s*소계|불량\s*계|총\s*불량|합\s*계|소\s*계|총\s*계|잔\s*여|bad\s*sum|total)/i;
const TOTAL_CONTAINS_RE = /(?:불량\s*합계|불량합계|불량\s*소계|자동\s*집계|합계\s*\()/i;
const INPUT_WRAPPER_TEXT_RE =
  /^(?:\([초중종]\)|\[[상하]\]|\d+\.?|mm|℃|°c|±|호기|\(|\)|\[|\]|\/|-|:|~|\.|,)+$/i;

function getDirectControls(cell) {
  return Array.from(cell.querySelectorAll('input, select, textarea')).filter(
    el => el.type !== 'hidden'
  );
}

function getNonControlText(cell) {
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('input, select, textarea, script, style, button').forEach(el => el.remove());
  return (clone.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasSpecialCellBg(cell) {
  const bg = (cell.style?.background || cell.style?.backgroundColor || '').toLowerCase();
  return bg.includes('linear-gradient');
}

function isSummaryControlOrCell(cell, controls) {
  if (cell.dataset?.qtyRole && cell.dataset.qtyRole.includes('sum')) return true;
  if (cell.id && /(?:_sum(?:_|$)|불량합계|total_defect)/i.test(cell.id)) return true;

  for (const el of controls) {
    if (el.placeholder && el.placeholder.includes('자동계산')) return true;
    if (el.id && /(?:_sum(?:_|$)|불량합계|total_defect)/i.test(el.id)) return true;
  }

  const spans = cell.querySelectorAll('span[id]');
  for (const sp of spans) {
    if (/(?:_sum(?:_|$)|불량합계|total_defect|sum)/i.test(sp.id)) return true;
  }
  return false;
}

function isHeaderRowInTbody(tr, trIndex, table) {
  const cells = Array.from(tr.children).filter(
    el => el.tagName === 'TH' || el.tagName === 'TD'
  );
  if (cells.length === 0) return false;

  const controls = tr.querySelectorAll('input:not([type="hidden"]), select, textarea');
  const firstText = getNonControlText(cells[0]);

  if (
    controls.length === 0 &&
    cells.every(c => c.tagName === 'TH') &&
    cells.length >= 2
  ) {
    return true;
  }

  if (
    controls.length === 0 &&
    /^(?:구\s*분(?:\s*\(|$)|금형\s*청소|폐기\s*불량)/.test(firstText)
  ) {
    return true;
  }

  if (
    controls.length === 0 &&
    cells.length >= 4 &&
    cells.slice(1).every(c =>
      /^(?:(?:FRT|RR)\s*)?(?:LH|RH|MIDDLE)(?:\s+[A-Z0-9]+)?$/i.test(getNonControlText(c))
    )
  ) {
    return true;
  }

  if (
    controls.length === 0 &&
    cells.length === 1 &&
    (cells[0].colSpan || 1) >= 3 &&
    firstText.length > 0
  ) {
    return true;
  }

  if (
    trIndex === 0 &&
    !table.querySelector('thead') &&
    controls.length === 0 &&
    cells.length >= 2
  ) {
    return true;
  }

  return false;
}

function isTotalRow(tr) {
  const cells = Array.from(tr.children).filter(
    el => el.tagName === 'TH' || el.tagName === 'TD'
  );
  for (let i = 0; i < Math.min(2, cells.length); i++) {
    const txt = getNonControlText(cells[i]);
    if (!txt) continue;
    if (TOTAL_LABEL_RE.test(txt) || TOTAL_CONTAINS_RE.test(txt)) return true;
  }
  return false;
}

function applyControlBackground(cell, bgMode) {
  const controls = getDirectControls(cell);
  controls.forEach(el => {
    if (el.classList.contains('f5013-machine-no-input')) return;
    if (bgMode === 'summary') {
      el.style.background = 'transparent';
    } else {
      el.style.background = FORM_TABLE_COLORS.inputBg;
    }
  });
}

function getVisualColPositions(rows) {
  const occupied = [];
  return rows.map((tr, rIdx) => {
    if (!occupied[rIdx]) occupied[rIdx] = [];
    let cIdx = 0;
    const cells = Array.from(tr.children).filter(
      el => el.tagName === 'TH' || el.tagName === 'TD'
    );
    return cells.map(cell => {
      while (occupied[rIdx][cIdx]) cIdx++;
      const startCol = cIdx;
      const rSpan = Math.max(1, cell.rowSpan || 1);
      const cSpan = Math.max(1, cell.colSpan || 1);
      for (let rr = rIdx; rr < rIdx + rSpan; rr++) {
        if (!occupied[rr]) occupied[rr] = [];
        for (let cc = startCol; cc < startCol + cSpan; cc++) {
          occupied[rr][cc] = true;
        }
      }
      cIdx += cSpan;
      return { cell, startCol };
    });
  });
}

/**
 * 전달된 루트 요소 내 모든 데이터 테이블에 통일된 옅은 색상 계층을 적용한다.
 * @param {HTMLElement | null | undefined} root
 */
export function applyUnifiedFormColors(root) {
  if (!root) return;

  const tables = root.tagName === 'TABLE'
    ? [root]
    : Array.from(root.querySelectorAll('table'));

  tables.forEach(table => {
    if (table.classList.contains('approval-table')) return;

    const sections = [];
    if (table.tHead) sections.push({ isHead: true, rows: Array.from(table.tHead.rows) });
    Array.from(table.tBodies).forEach(tb => {
      sections.push({ isHead: false, rows: Array.from(tb.rows) });
    });
    if (table.tFoot) sections.push({ isHead: false, rows: Array.from(table.tFoot.rows) });

    if (sections.length === 0) {
      sections.push({ isHead: false, rows: Array.from(table.querySelectorAll('tr')) });
    }

    sections.forEach(sec => {
      const colGrid = getVisualColPositions(sec.rows);
      let inHeaderGroup = sec.isHead;

      sec.rows.forEach((tr, rIdx) => {
        if (tr.style && tr.style.background) {
          tr.style.background = '';
        }

        const rowIsExplicitHeader = sec.isHead || isHeaderRowInTbody(tr, rIdx, table);
        if (rowIsExplicitHeader) {
          inHeaderGroup = true;
        } else if (!sec.isHead) {
          const hasAnyTd = Array.from(tr.children).some(c => c.tagName === 'TD');
          const allTh = Array.from(tr.children).every(c => c.tagName === 'TH');
          if (hasAnyTd || !allTh) {
            inHeaderGroup = false;
          }
        }

        const isHeadRow = sec.isHead || rowIsExplicitHeader || inHeaderGroup;
        const rowIsTotal = !isHeadRow && isTotalRow(tr);

        colGrid[rIdx].forEach(({ cell, startCol }) => {
          if (hasSpecialCellBg(cell)) return;

          const controls = getDirectControls(cell);
          const nonControlText = getNonControlText(cell);
          const strippedText = nonControlText.replace(/\s+/g, '');

          if (isHeadRow) {
            cell.style.background = FORM_TABLE_COLORS.headerBg;
            applyControlBackground(cell, 'input');
            return;
          }

          if (rowIsTotal || isSummaryControlOrCell(cell, controls)) {
            cell.style.background = FORM_TABLE_COLORS.categoryBg;
            applyControlBackground(cell, 'summary');
            return;
          }

          const hasMeaningfulLabel =
            strippedText.length > 0 && !INPUT_WRAPPER_TEXT_RE.test(strippedText);

          if (controls.length > 0 && !hasMeaningfulLabel) {
            cell.style.background = FORM_TABLE_COLORS.inputBg;
            applyControlBackground(cell, 'input');
            return;
          }

          if (controls.length > 0 && hasMeaningfulLabel) {
            cell.style.background = FORM_TABLE_COLORS.menuBg;
            applyControlBackground(cell, 'input');
            return;
          }

          const isMajorCategory =
            startCol === 0 && ((cell.rowSpan || 1) >= 2 || (cell.colSpan || 1) === 1);

          cell.style.background = isMajorCategory
            ? FORM_TABLE_COLORS.categoryBg
            : FORM_TABLE_COLORS.menuBg;
        });
      });
    });
  });
}
