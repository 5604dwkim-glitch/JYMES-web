import * as Templates from '../FormTemplates.jsx';

/**
 * 생산실적(수량) 섹션 렌더러
 * ctx: { container, qtySection, processValue, existingData, getCurrentFormCode, updateDowntimeSection }
 */
export function renderQtySection(ctx) {
  const { container, qtySection, processValue, existingData, getCurrentFormCode, updateDowntimeSection, isDtCrewClip } = ctx;
    if (!qtySection) return;
    const curProc = processValue ? processValue.value : '';
    const formCode = getCurrentFormCode();
    console.log("QtySectionRenderer running. formCode:", formCode, "curProc:", curProc);

  function calcDtCrewSummary() {
    if (!qtySection || !isDtCrewClip()) return;

    const DEFECT_ITEMS = [
      '길이미달', '길이초과', '끝단부불량',
      '클립홀찢어짐', '클립간격불량', '드레인홀불량',
      '스코치', '기타'
    ];

    // Table A 집계 (dtc_)
    let totalDefectLH_A = 0;
    let totalDefectRH_A = 0;
    DEFECT_ITEMS.forEach(id => {
      totalDefectLH_A += Number(qtySection.querySelector(`#dtc_${id}_LH`)?.value) || 0;
      totalDefectRH_A += Number(qtySection.querySelector(`#dtc_${id}_RH`)?.value) || 0;
    });
    const lhSumA = qtySection.querySelector('#dtc_불량합계_LH');
    const rhSumA = qtySection.querySelector('#dtc_불량합계_RH');
    if (lhSumA) lhSumA.value = totalDefectLH_A;
    if (rhSumA) rhSumA.value = totalDefectRH_A;

    // Table B 집계 (dtcb_ - 4개 호기: LH 3호, LH 4호, RH 2호, RH 4호)
    let totalDefectLH3_B = 0;
    let totalDefectLH4_B = 0;
    let totalDefectRH2_B = 0;
    let totalDefectRH4_B = 0;

    DEFECT_ITEMS.forEach(id => {
      totalDefectLH3_B += Number(qtySection.querySelector(`#dtcb_${id}_LH3`)?.value) || 0;
      totalDefectLH4_B += Number(qtySection.querySelector(`#dtcb_${id}_LH4`)?.value) || 0;
      totalDefectRH2_B += Number(qtySection.querySelector(`#dtcb_${id}_RH2`)?.value) || 0;
      totalDefectRH4_B += Number(qtySection.querySelector(`#dtcb_${id}_RH4`)?.value) || 0;
    });

    const lh3SumB = qtySection.querySelector('#dtcb_불량합계_LH3');
    const lh4SumB = qtySection.querySelector('#dtcb_불량합계_LH4');
    const rh2SumB = qtySection.querySelector('#dtcb_불량합계_RH2');
    const rh4SumB = qtySection.querySelector('#dtcb_불량합계_RH4');

    if (lh3SumB) lh3SumB.value = totalDefectLH3_B;
    if (lh4SumB) lh4SumB.value = totalDefectLH4_B;
    if (rh2SumB) rh2SumB.value = totalDefectRH2_B;
    if (rh4SumB) rh4SumB.value = totalDefectRH4_B;

    // 숨겨진 표준 수량 필드 자동 계산 (Table A + Table B 4개 라인 합산)
    const goodLH_A = Number(qtySection.querySelector('#dtc_정품수량_LH')?.value) || 0;
    const goodRH_A = Number(qtySection.querySelector('#dtc_정품수량_RH')?.value) || 0;

    const goodLH3_B = Number(qtySection.querySelector('#dtcb_정품수량_LH3')?.value) || 0;
    const goodLH4_B = Number(qtySection.querySelector('#dtcb_정품수량_LH4')?.value) || 0;
    const goodRH2_B = Number(qtySection.querySelector('#dtcb_정품수량_RH2')?.value) || 0;
    const goodRH4_B = Number(qtySection.querySelector('#dtcb_정품수량_RH4')?.value) || 0;

    const actualQtyElem = qtySection.querySelector('#actualQty');
    const defectQtyElem = qtySection.querySelector('#defectQty');
    const targetQtyElem = qtySection.querySelector('#targetQty');

    const totalGood_A = goodLH_A + goodRH_A;
    const totalDefect_A = totalDefectLH_A + totalDefectRH_A;
    const totalGood_B = goodLH3_B + goodLH4_B + goodRH2_B + goodRH4_B;
    const totalDefect_B = totalDefectLH3_B + totalDefectLH4_B + totalDefectRH2_B + totalDefectRH4_B;

    const totalGood = totalGood_A + totalGood_B;
    const totalDefect = totalDefect_A + totalDefect_B;

    if (actualQtyElem) actualQtyElem.value = totalGood;
    if (defectQtyElem) defectQtyElem.value = totalDefect;
    if (targetQtyElem) targetQtyElem.value = totalGood + totalDefect;
  }

  function calcKmKxClipSummary() {
    if (!qtySection) return;

    const DEFECT_ITEMS = [
      '길이미달', '길이초과', '끝단부불량',
      '클립홀찢어짐', '클립간격불량', '드레인홀불량',
      '스코치', '기타'
    ];

    let totalDefectLH = 0;
    let totalDefectMID = 0;
    let totalDefectRH = 0;
    DEFECT_ITEMS.forEach(id => {
      totalDefectLH += Number(qtySection.querySelector(`#dtc_${id}_LH`)?.value) || 0;
      totalDefectMID += Number(qtySection.querySelector(`#dtc_${id}_MID`)?.value) || 0;
      totalDefectRH += Number(qtySection.querySelector(`#dtc_${id}_RH`)?.value) || 0;
    });
    const lhSum = qtySection.querySelector('#dtc_불량합계_LH');
    const midSum = qtySection.querySelector('#dtc_불량합계_MID');
    const rhSum = qtySection.querySelector('#dtc_불량합계_RH');
    if (lhSum) lhSum.value = totalDefectLH;
    if (midSum) midSum.value = totalDefectMID;
    if (rhSum) rhSum.value = totalDefectRH;

    const goodLH = Number(qtySection.querySelector('#dtc_정품수량_LH')?.value) || 0;
    const goodMID = Number(qtySection.querySelector('#dtc_정품수량_MID')?.value) || 0;
    const goodRH = Number(qtySection.querySelector('#dtc_정품수량_RH')?.value) || 0;

    const actualQtyElem = qtySection.querySelector('#actualQty');
    const defectQtyElem = qtySection.querySelector('#defectQty');
    const targetQtyElem = qtySection.querySelector('#targetQty');

    const totalGood = goodLH + goodMID + goodRH;
    const totalDefect = totalDefectLH + totalDefectMID + totalDefectRH;

    if (actualQtyElem) actualQtyElem.value = totalGood;
    if (defectQtyElem) defectQtyElem.value = totalDefect;
    if (targetQtyElem) targetQtyElem.value = totalGood + totalDefect;
  }

  function calcDtCrewPostQtySummary() {
    if (!qtySection) return;
    const table = qtySection.querySelector('#dtCrewPostQtyTable');
    if (!table) return;

    const workLH = Number(table.querySelector('#dtc_pqty_work_LH')?.value) || 0;
    const workRH = Number(table.querySelector('#dtc_pqty_work_RH')?.value) || 0;
    const goodLH = Number(table.querySelector('#dtc_pqty_good_LH')?.value) || 0;
    const goodRH = Number(table.querySelector('#dtc_pqty_good_RH')?.value) || 0;

    const extKeys = ['scorch', 'scratch', 'coat', 'len', 'clip_omit', 'oth'];
    const jointKeys = ['drop', 'lack', 'push', 'bubble', 'chew', 'overflow', 'deform', 'foreign', 'twist', 'oth'];
    const postKeys = ['oversand', 'undersand', 'bond_contam', 'ext_contam', 'clip_half', 'clip_hole_omit', 'drain_bad', 'clip_diff', 'cut_omit', 'bond_omit', 'len_over', 'clip_gap_bad', 'oth'];

    let extSumLH = 0, extSumRH = 0;
    extKeys.forEach(k => {
      extSumLH += Number(table.querySelector(`#dtc_pdef_ext_${k}_LH`)?.value) || 0;
      extSumRH += Number(table.querySelector(`#dtc_pdef_ext_${k}_RH`)?.value) || 0;
    });
    const extSumLHElem = table.querySelector('#dtc_pdef_ext_sum_LH');
    const extSumRHElem = table.querySelector('#dtc_pdef_ext_sum_RH');
    if (extSumLHElem) extSumLHElem.textContent = extSumLH;
    if (extSumRHElem) extSumRHElem.textContent = extSumRH;

    let jointSumLH = 0, jointSumRH = 0;
    jointKeys.forEach(k => {
      jointSumLH += Number(table.querySelector(`#dtc_pdef_j_${k}_LH`)?.value) || 0;
      jointSumRH += Number(table.querySelector(`#dtc_pdef_j_${k}_RH`)?.value) || 0;
    });
    const jSumLHElem = table.querySelector('#dtc_pdef_j_sum_LH');
    const jSumRHElem = table.querySelector('#dtc_pdef_j_sum_RH');
    if (jSumLHElem) jSumLHElem.textContent = jointSumLH;
    if (jSumRHElem) jSumRHElem.textContent = jointSumRH;

    const jRowSumLHElem = table.querySelector('#dtc_pdef_j_row_sum_LH');
    const jRowSumRHElem = table.querySelector('#dtc_pdef_j_row_sum_RH');
    if (jRowSumLHElem) jRowSumLHElem.textContent = jointSumLH;
    if (jRowSumRHElem) jRowSumRHElem.textContent = jointSumRH;

    let postSumLH = 0, postSumRH = 0;
    postKeys.forEach(k => {
      postSumLH += Number(table.querySelector(`#dtc_pdef_post_${k}_LH`)?.value) || 0;
      postSumRH += Number(table.querySelector(`#dtc_pdef_post_${k}_RH`)?.value) || 0;
    });
    const postSumLHElem = table.querySelector('#dtc_pdef_post_sum_LH');
    const postSumRHElem = table.querySelector('#dtc_pdef_post_sum_RH');
    if (postSumLHElem) postSumLHElem.textContent = postSumLH;
    if (postSumRHElem) postSumRHElem.textContent = postSumRH;

    const postRowSumLHElem = table.querySelector('#dtc_pdef_post_row_sum_LH');
    const postRowSumRHElem = table.querySelector('#dtc_pdef_post_row_sum_RH');
    if (postRowSumLHElem) postRowSumLHElem.textContent = postSumLH;
    if (postRowSumRHElem) postRowSumRHElem.textContent = postSumRH;

    const totalDefectLH = extSumLH + jointSumLH + postSumLH;
    const totalDefectRH = extSumRH + jointSumRH + postSumRH;

    const autoWorkLH = goodLH + totalDefectLH;
    const autoWorkRH = goodRH + totalDefectRH;

    const workLHElem = table.querySelector('#dtc_pqty_work_LH');
    const workRHElem = table.querySelector('#dtc_pqty_work_RH');
    if (workLHElem) workLHElem.value = (goodLH || totalDefectLH) ? autoWorkLH : '';
    if (workRHElem) workRHElem.value = (goodRH || totalDefectRH) ? autoWorkRH : '';

    const totalSumLHElem = table.querySelector('#dtc_pdef_total_sum_LH');
    const totalSumRHElem = table.querySelector('#dtc_pdef_total_sum_RH');
    if (totalSumLHElem) totalSumLHElem.textContent = totalDefectLH;
    if (totalSumRHElem) totalSumRHElem.textContent = totalDefectRH;

    const badLHElem = table.querySelector('#dtc_pqty_bad_LH');
    const badRHElem = table.querySelector('#dtc_pqty_bad_RH');
    if (badLHElem) badLHElem.textContent = totalDefectLH;
    if (badRHElem) badRHElem.textContent = totalDefectRH;

    const targetQtyElem = qtySection.querySelector('#targetQty');
    const actualQtyElem = qtySection.querySelector('#actualQty');
    const defectQtyElem = qtySection.querySelector('#defectQty');
    if (targetQtyElem) targetQtyElem.value = autoWorkLH + autoWorkRH;
    if (actualQtyElem) actualQtyElem.value = goodLH + goodRH;
    if (defectQtyElem) defectQtyElem.value = totalDefectLH + totalDefectRH;
  }

  function calcKmKxPostQtySummary() {
    if (!qtySection) return;
    const table = qtySection.querySelector('#dtCrewPostQtyTable');
    if (!table) return;

    const goodLH = Number(table.querySelector('#dtc_pqty_good_LH')?.value) || 0;

    const extKeys = ['scorch', 'scratch', 'coat', 'len', 'clip_omit', 'oth'];
    const jointKeys = ['drop', 'lack', 'push', 'bubble', 'chew', 'overflow', 'deform', 'foreign', 'twist', 'oth'];
    const postKeys = ['oversand', 'undersand', 'bond_contam', 'ext_contam', 'clip_half', 'clip_hole_omit', 'drain_bad', 'clip_diff', 'cut_omit', 'bond_omit', 'len_over', 'clip_gap_bad', 'oth'];

    let extSumLH = 0;
    extKeys.forEach(k => {
      extSumLH += Number(table.querySelector(`#dtc_pdef_ext_${k}_LH`)?.value) || 0;
    });
    const extSumLHElem = table.querySelector('#dtc_pdef_ext_sum_LH');
    if (extSumLHElem) extSumLHElem.textContent = extSumLH;

    let jointSumLH = 0;
    jointKeys.forEach(k => {
      jointSumLH += Number(table.querySelector(`#dtc_pdef_j_${k}_LH`)?.value) || 0;
    });
    const jSumLHElem = table.querySelector('#dtc_pdef_j_sum_LH');
    if (jSumLHElem) jSumLHElem.textContent = jointSumLH;

    const jRowSumLHElem = table.querySelector('#dtc_pdef_j_row_sum_LH');
    if (jRowSumLHElem) jRowSumLHElem.textContent = jointSumLH;

    let postSumLH = 0;
    postKeys.forEach(k => {
      postSumLH += Number(table.querySelector(`#dtc_pdef_post_${k}_LH`)?.value) || 0;
    });
    const postSumLHElem = table.querySelector('#dtc_pdef_post_sum_LH');
    if (postSumLHElem) postSumLHElem.textContent = postSumLH;

    const postRowSumLHElem = table.querySelector('#dtc_pdef_post_row_sum_LH');
    if (postRowSumLHElem) postRowSumLHElem.textContent = postSumLH;

    const totalDefectLH = extSumLH + jointSumLH + postSumLH;
    const autoWorkLH = goodLH + totalDefectLH;

    const workLHElem = table.querySelector('#dtc_pqty_work_LH');
    if (workLHElem) workLHElem.value = (goodLH || totalDefectLH) ? autoWorkLH : '';

    const totalSumLHElem = table.querySelector('#dtc_pdef_total_sum_LH');
    if (totalSumLHElem) totalSumLHElem.textContent = totalDefectLH;

    const badLHElem = table.querySelector('#dtc_pqty_bad_LH');
    if (badLHElem) badLHElem.textContent = totalDefectLH;

    const targetQtyElem = qtySection.querySelector('#targetQty');
    const actualQtyElem = qtySection.querySelector('#actualQty');
    const defectQtyElem = qtySection.querySelector('#defectQty');
    if (targetQtyElem) targetQtyElem.value = autoWorkLH;
    if (actualQtyElem) actualQtyElem.value = goodLH;
    if (defectQtyElem) defectQtyElem.value = totalDefectLH;
  }

  function calcDtCrewJointQtySummary() {
    if (!qtySection) return;
    const table = qtySection.querySelector('#dtCrewJointQtyTable');
    if (!table) return;

    const plan1 = Number(table.querySelector('#dtc_jqty_plan_1')?.value) || 0;
    const plan2 = Number(table.querySelector('#dtc_jqty_plan_2')?.value) || 0;
    const act1 = Number(table.querySelector('#dtc_jqty_act_1')?.value) || 0;
    const act2 = Number(table.querySelector('#dtc_jqty_act_2')?.value) || 0;

    const defectKeys = ['tear', 'lack', 'push', 'bubble', 'chew', 'overflow', 'deform', 'foreign', 'twist', 'oth'];
    const cols = [
      { tbl: 1, pos: 'A' }, { tbl: 1, pos: 'B' }, { tbl: 1, pos: 'C' },
      { tbl: 2, pos: 'A' }, { tbl: 2, pos: 'B' }, { tbl: 2, pos: 'C' }
    ];

    let overallDefects = 0;

    cols.forEach(c => {
      let colSum = 0;
      defectKeys.forEach(dk => {
        const val = Number(table.querySelector(`#dtc_jdef_${dk}_${c.tbl}_${c.pos}`)?.value) || 0;
        colSum += val;
      });
      overallDefects += colSum;
      const sumElem = table.querySelector(`#dtc_jdef_sum_${c.tbl}_${c.pos}`);
      if (sumElem) sumElem.textContent = colSum;
    });

    const targetQtyElem = qtySection.querySelector('#targetQty');
    const actualQtyElem = qtySection.querySelector('#actualQty');
    const defectQtyElem = qtySection.querySelector('#defectQty');
    if (targetQtyElem) targetQtyElem.value = plan1 + plan2;
    if (actualQtyElem) actualQtyElem.value = act1 + act2;
    if (defectQtyElem) defectQtyElem.value = overallDefects;
  }

  function calcDtCrewEndJointQtySummary() {
    if (!qtySection) return;
    const table = qtySection.querySelector('#dtCrewJointEndQtyTable');
    if (!table) return;

    const plan1 = Number(table.querySelector('#dtc_jqty_plan_1_1')?.value) || 0;
    const plan2 = Number(table.querySelector('#dtc_jqty_plan_1_2')?.value) || 0;
    const plan3 = Number(table.querySelector('#dtc_jqty_plan_1_3')?.value) || 0;
    const plan4 = Number(table.querySelector('#dtc_jqty_plan_1_4')?.value) || 0;
    const totalPlan = plan1 + plan2 + plan3 + plan4;

    const act1 = Number(table.querySelector('#dtc_jqty_act_1_1')?.value) || 0;
    const act2 = Number(table.querySelector('#dtc_jqty_act_1_2')?.value) || 0;
    const act3 = Number(table.querySelector('#dtc_jqty_act_1_3')?.value) || 0;
    const act4 = Number(table.querySelector('#dtc_jqty_act_1_4')?.value) || 0;
    const totalAct = act1 + act2 + act3 + act4;

    const defectKeys = ['tear', 'lack', 'push', 'bubble', 'chew', 'overflow', 'deform', 'foreign', 'twist', 'oth'];
    const cols = ['1', '2', '3', '4'];

    let overallDefects = 0;

    cols.forEach(pos => {
      let colSum = 0;
      defectKeys.forEach(dk => {
        const val = Number(table.querySelector(`#dtc_jdef_${dk}_1_${pos}`)?.value) || 0;
        colSum += val;
      });
      overallDefects += colSum;
      const sumElem = table.querySelector(`#dtc_jdef_sum_1_${pos}`);
      if (sumElem) sumElem.textContent = colSum;
    });

    const targetQtyElem = qtySection.querySelector('#targetQty');
    const actualQtyElem = qtySection.querySelector('#actualQty');
    const defectQtyElem = qtySection.querySelector('#defectQty');
    if (targetQtyElem) targetQtyElem.value = totalPlan;
    if (actualQtyElem) actualQtyElem.value = totalAct;
    if (defectQtyElem) defectQtyElem.value = overallDefects;
  }

  function calcDtCrewPrepQtySummary() {
    if (!qtySection) return;

    const planLH = Number(qtySection.querySelector('#qty_plan_LH_A')?.value) || 0;
    const planRH = Number(qtySection.querySelector('#qty_plan_RH_A')?.value) || 0;
    const actLH = Number(qtySection.querySelector('#qty_act_LH_A')?.value) || 0;
    const actRH = Number(qtySection.querySelector('#qty_act_RH_A')?.value) || 0;

    const defLH = (Number(qtySection.querySelector('#def_ext_scorch_LH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_ext_contam_LH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_ext_other_LH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_proc_len_LH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_proc_sec_LH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_proc_other_LH_A')?.value) || 0);

    const defRH = (Number(qtySection.querySelector('#def_ext_scorch_RH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_ext_contam_RH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_ext_other_RH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_proc_len_RH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_proc_sec_RH_A')?.value) || 0) +
                  (Number(qtySection.querySelector('#def_proc_other_RH_A')?.value) || 0);

    const sumLH = qtySection.querySelector('#def_sum_LH_A');
    const sumRH = qtySection.querySelector('#def_sum_RH_A');
    if (sumLH) sumLH.textContent = defLH;
    if (sumRH) sumRH.textContent = defRH;

    const targetQtyElem = qtySection.querySelector('#targetQty');
    const actualQtyElem = qtySection.querySelector('#actualQty');
    const defectQtyElem = qtySection.querySelector('#defectQty');
    if (targetQtyElem) targetQtyElem.value = planLH + planRH;
    if (actualQtyElem) actualQtyElem.value = actLH + actRH;
    if (defectQtyElem) defectQtyElem.value = defLH + defRH;
  }


  function calcJg1QtySummary() {
    const table = container.querySelector('#jg1QtyTable');
    if (!table) return;

    const positions = ['FL', 'FR', 'RL', 'RR'];
    let totalPlan = 0;
    let totalAct = 0;
    let overallDefect = 0;

    positions.forEach(pos => {
      const plan = Number(table.querySelector(`#qty_plan_${pos}`)?.value) || 0;
      const act = Number(table.querySelector(`#qty_act_${pos}`)?.value) || 0;
      totalPlan += plan;
      totalAct += act;

      const defs = [
        Number(table.querySelector(`#def_ext_scorch_${pos}`)?.value) || 0,
        Number(table.querySelector(`#def_ext_scratch_${pos}`)?.value) || 0,
        Number(table.querySelector(`#def_ext_flock_${pos}`)?.value) || 0,
        Number(table.querySelector(`#def_ext_contam_${pos}`)?.value) || 0,
        Number(table.querySelector(`#def_proc_len_${pos}`)?.value) || 0,
        Number(table.querySelector(`#def_proc_cut_${pos}`)?.value) || 0,
        Number(table.querySelector(`#def_proc_oth_${pos}`)?.value) || 0
      ];

      const posDefectSum = defs.reduce((a, b) => a + b, 0);
      overallDefect += posDefectSum;

      const sumElem = table.querySelector(`#def_sum_${pos}`);
      if (sumElem) sumElem.textContent = posDefectSum;
    });

    const targetQtyInput = container.querySelector('#targetQty');
    const actualQtyInput = container.querySelector('#actualQty');
    const defectQtyInput = container.querySelector('#defectQty');

    if (targetQtyInput) targetQtyInput.value = totalPlan;
    if (actualQtyInput) actualQtyInput.value = totalAct;
    if (defectQtyInput) defectQtyInput.value = overallDefect;
  }
  
  function calcJoint1002QtySummary() {
    const table = container.querySelector('#jointQtyTable');
    if (!table) return;

    const cols = ['frt_lh', 'frt_rh', 'rr_lh', 'rr_rh'];
    let totalPlan = 0;
    let totalAct = 0;
    let overallDefect = 0;

    cols.forEach(cId => {
      const plan = Number(table.querySelector(`#jqty_plan_${cId}`)?.value) || 0;
      const act = Number(table.querySelector(`#jqty_act_${cId}`)?.value) || 0;
      totalPlan += plan;
      totalAct += act;

      const defs = [
        Number(table.querySelector(`#jdef_split_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_push_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_lack_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_over_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_bubble_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_scrap_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_insert_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_oth_${cId}`)?.value) || 0
      ];

      const colSum = defs.reduce((a, b) => a + b, 0);
      overallDefect += colSum;

      const sumElem = table.querySelector(`#jdef_sum_${cId}`);
      if (sumElem) sumElem.textContent = colSum;
    });

    const targetQtyInput = container.querySelector('#targetQty');
    const actualQtyInput = container.querySelector('#actualQty');
    const defectQtyInput = container.querySelector('#defectQty');

    if (targetQtyInput) targetQtyInput.value = totalPlan;
    if (actualQtyInput) actualQtyInput.value = totalAct;
    if (defectQtyInput) defectQtyInput.value = overallDefect;
  }

  function calcJointQtySummary() {
    const table = container.querySelector('#jointQtyTable');
    if (!table) return;

    const cols = ['frt_p', 'frt_q', 'rr_r', 'rr_s_lh', 'rr_s_rh'];
    let totalPlan = 0;
    let totalAct = 0;
    let overallDefect = 0;

    cols.forEach(cId => {
      const plan = Number(table.querySelector(`#jqty_plan_${cId}`)?.value) || 0;
      const act = Number(table.querySelector(`#jqty_act_${cId}`)?.value) || 0;
      totalPlan += plan;
      totalAct += act;

      const defs = [
        Number(table.querySelector(`#jdef_split_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_push_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_lack_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_over_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_bubble_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_scrap_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_insert_${cId}`)?.value) || 0,
        Number(table.querySelector(`#jdef_oth_${cId}`)?.value) || 0
      ];

      const colSum = defs.reduce((a, b) => a + b, 0);
      overallDefect += colSum;

      const sumElem = table.querySelector(`#jdef_sum_${cId}`);
      if (sumElem) sumElem.textContent = colSum;
    });

    const targetQtyInput = container.querySelector('#targetQty');
    const actualQtyInput = container.querySelector('#actualQty');
    const defectQtyInput = container.querySelector('#defectQty');

    if (targetQtyInput) targetQtyInput.value = totalPlan;
    if (actualQtyInput) actualQtyInput.value = totalAct;
    if (defectQtyInput) defectQtyInput.value = overallDefect;
  }
  function calcPostQtySummary() {
    const table = container.querySelector('#postQtyTable');
    if (!table) return;

    const cols = ['fl', 'fr', 'rl', 'rr'];
    let totalPlan = 0;
    let totalAct = 0;
    let overallDefect = 0;

    cols.forEach(cId => {
      const plan = Number(table.querySelector(`#pqty_plan_${cId}`)?.value) || 0;
      const act = Number(table.querySelector(`#pqty_act_${cId}`)?.value) || 0;
      totalPlan += plan;
      totalAct += act;

      // 조인트 불량 7종
      const jDefs = [
        Number(table.querySelector(`#pdef_j_drop_${cId}`)?.value) || 0,
        Number(table.querySelector(`#pdef_j_lack_${cId}`)?.value) || 0,
        Number(table.querySelector(`#pdef_j_step_${cId}`)?.value) || 0,
        Number(table.querySelector(`#pdef_j_bubble_${cId}`)?.value) || 0,
        Number(table.querySelector(`#pdef_j_chew_${cId}`)?.value) || 0,
        Number(table.querySelector(`#pdef_j_scrap_${cId}`)?.value) || 0,
        Number(table.querySelector(`#pdef_j_oth_${cId}`)?.value) || 0
      ];
      const jSum = jDefs.reduce((a, b) => a + b, 0);

      // 후가공 불량 3종
      const pDefs = [
        Number(table.querySelector(`#pdef_p_trim_${cId}`)?.value) || 0,
        Number(table.querySelector(`#pdef_p_poll_${cId}`)?.value) || 0,
        Number(table.querySelector(`#pdef_p_oth_${cId}`)?.value) || 0
      ];
      const pSum = pDefs.reduce((a, b) => a + b, 0);

      overallDefect += (jSum + pSum);

      const jSumElem = table.querySelector(`#pdef_j_sum_${cId}`);
      if (jSumElem) jSumElem.textContent = jSum;

      const pSumElem = table.querySelector(`#pdef_p_sum_${cId}`);
      if (pSumElem) pSumElem.textContent = pSum;
    });

    const targetQtyInput = container.querySelector('#targetQty');
    const actualQtyInput = container.querySelector('#actualQty');
    const defectQtyInput = container.querySelector('#defectQty');

    if (targetQtyInput) targetQtyInput.value = totalPlan;
    if (actualQtyInput) actualQtyInput.value = totalAct;
    if (defectQtyInput) defectQtyInput.value = overallDefect;
  }
  function calcInspQtySummary() {
    const table = container.querySelector('#inspQtyTable');
    if (!table) return;
    const inspectQtyInputs = table.querySelectorAll('input[id^="insp_inspect_qty_"]');
    const cols = Array.from(inspectQtyInputs).map(inp => inp.id.replace('insp_inspect_qty_', ''));
    let grandInspect = 0;
    let grandGood = 0;
    let grandDefect = 0;

    cols.forEach(c => {
      // 1. 압출소재불량 소계
      const extKeys = ['scorch', 'scratch', 'contam', 'len', 'clip', 'oth'];
      let extSum = 0;
      extKeys.forEach(k => {
        extSum += Number(container.querySelector(`#insp_ext_${k}_${c}`)?.value) || 0;
      });
      const extSubElem = container.querySelector(`#insp_ext_subtotal_${c}`);
      if (extSubElem) extSubElem.value = extSum || '';

      // 2. 조인트불량 불량수
      const jKeys = ['drop', 'lack', 'push', 'bubble', 'chew', 'overflow', 'deform', 'foreign', 'twist', 'oth'];
      let jSum = 0;
      jKeys.forEach(k => {
        jSum += Number(container.querySelector(`#insp_j_${k}_${c}`)?.value) || 0;
      });
      const jSubElem = container.querySelector(`#insp_j_subtotal_${c}`);
      if (jSubElem) jSubElem.value = jSum || '';

      // 3. 후가공불량 불량수
      const pKeys = ['trim_over', 'trim_under', 'bond_contam', 'ext_contam', 'clip_miss', 'clip_hole', 'drain_hole', 'wrong_clip', 'cut_miss', 'bond_miss', 'len_excess', 'clip_pitch', 'oth'];
      let pSum = 0;
      pKeys.forEach(k => {
        pSum += Number(container.querySelector(`#insp_p_${k}_${c}`)?.value) || 0;
      });
      const pSubElem = container.querySelector(`#insp_p_subtotal_${c}`);
      if (pSubElem) pSubElem.value = pSum || '';

      // 4. 불량합계 & 정품수/검사수
      const totalDefect = extSum + jSum + pSum;
      const totDefElem = container.querySelector(`#insp_total_defect_${c}`);
      if (totDefElem) totDefElem.value = totalDefect || '';

      
      if (formCode === 2035 || formCode === 2044) {
        // #2035, #2044: 검사수 = 정품수 + 불량합계
        const goodQty = Number(container.querySelector(`#insp_good_qty_${c}`)?.value) || 0;
        const inspectQty = goodQty + totalDefect;
        const inspElem = container.querySelector(`#insp_inspect_qty_${c}`);
        if (inspElem) inspElem.value = (goodQty > 0 || totalDefect > 0) ? inspectQty : '';

        grandInspect += inspectQty;
        grandGood += goodQty;
        grandDefect += totalDefect;
      } else {
        // 타 검사포장 양식: 정품수 = 검사수 - 불량합계
        const inspectQty = Number(container.querySelector(`#insp_inspect_qty_${c}`)?.value) || 0;
        const goodQty = Math.max(0, inspectQty - totalDefect);
        const goodElem = container.querySelector(`#insp_good_qty_${c}`);
        if (goodElem) goodElem.value = inspectQty ? goodQty : '';

        grandInspect += inspectQty;
        grandGood += inspectQty ? goodQty : 0;
        grandDefect += totalDefect;
      }
    });

    const targetQtyElem = container.querySelector('#targetQty');
    const actualQtyElem = container.querySelector('#actualQty');
    const defectQtyElem = container.querySelector('#defectQty');
    if (targetQtyElem) targetQtyElem.value = grandInspect;
    if (actualQtyElem) actualQtyElem.value = grandGood;
    if (defectQtyElem) defectQtyElem.value = grandDefect;
  }


    if (!curProc) {
      qtySection.innerHTML = `
        <div class="card" style="padding: 24px; text-align: center; background: rgba(2, 132, 199, 0.04); border: 1.5px dashed rgba(2, 132, 199, 0.3); margin-bottom: 16px;">
          <div style="font-size: 28px; margin-bottom: 8px;">👈</div>
          <div style="font-size: 15px; font-weight: 800; color: var(--accent-blue);" data-i18n="select_process_guide">상단에서 생산공정을 선택해 주세요</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">공정을 선택하면 해당 공정에 필요한 입력창이 자동으로 나타납니다.</div>
        </div>
      `;
      updateDowntimeSection();
      return;
    }

    switch (formCode) {

      // ── 조인트 (#1002) ──
      case 1002:
        qtySection.innerHTML = Templates.getJointQty1002HTML(existingData, container);
        qtySection.addEventListener('input', calcJoint1002QtySummary);
        calcJoint1002QtySummary();
        break;

      // ── 클립머신 (#2001, #2011) ──
      case 2001:
      case 2011:
        qtySection.innerHTML = Templates.getDtCrewQtyHTML(existingData, container);
        qtySection.addEventListener('input', calcDtCrewSummary);
        calcDtCrewSummary();
        break;

      // ── KM/KX HOOD SURROUND 클립머신 (#2041) ──
      case 2041:
        qtySection.innerHTML = Templates.getKmKxClipQtyHTML(existingData, container);
        qtySection.addEventListener('input', calcKmKxClipSummary);
        calcKmKxClipSummary();
        break;

      // ── 스텔란티스 소재준비 (#2002, #2012, #2021~#2023, #2031~#2032) ──
      case 2002:
      case 2012:
      case 2021:
      case 2022:
      case 2023:
      case 2031:
      case 2032:
        qtySection.innerHTML = Templates.getDtCrewPrepQtyHTML(existingData, container);
        qtySection.addEventListener('input', calcDtCrewPrepQtySummary);
        calcDtCrewPrepQtySummary();
        break;

      // ── 스텔란티스 DT QUAD 조인트 (#2013) ──
      case 2013:
        qtySection.innerHTML = Templates.getDtCrewJointQtyHTML(existingData, 200, true, container);
        qtySection.addEventListener('input', calcDtCrewJointQtySummary);
        calcDtCrewJointQtySummary();
        break;

      // ── 스텔란티스 조인트 (#2003, #2024) ──
      case 2003:
      case 2024:
        qtySection.innerHTML = Templates.getDtCrewJointQtyHTML(existingData, 300, container);
        qtySection.addEventListener('input', calcDtCrewJointQtySummary);
        calcDtCrewJointQtySummary();
        break;

      // ── KM/KX HOOD SURROUND 조인트 (#2042) ──
      case 2042:
        qtySection.innerHTML = Templates.getKmKxJointQtyHTML(existingData, 300, container);
        qtySection.addEventListener('input', calcDtCrewJointQtySummary);
        calcDtCrewJointQtySummary();
        break;

      // ── 스텔란티스 DS STD 조인트 (#2033) ──
      case 2033:
        qtySection.innerHTML = Templates.getDtCrewJointQtyHTML(existingData, 200, container);
        qtySection.addEventListener('input', calcDtCrewJointQtySummary);
        calcDtCrewJointQtySummary();
        break;

      // ── 스텔란티스 DS CREW 조인트(D) (#2025) ──
      case 2025:
        qtySection.innerHTML = Templates.getDtCrewEndJointQtyHTML(existingData, container);
        qtySection.addEventListener('input', calcDtCrewEndJointQtySummary);
        calcDtCrewEndJointQtySummary();
        break;

      // ── 스텔란티스 후가공 (#2004, #2014, #2026, #2034) ──
      case 2004:
      case 2014:
      case 2026:
      case 2034:
        qtySection.innerHTML = Templates.getDtCrewPostQtyHTML(existingData, container);
        qtySection.addEventListener('input', calcDtCrewPostQtySummary);
        calcDtCrewPostQtySummary();
        break;

      // ── KM/KX HOOD SURROUND 후가공 (#2043) ──
      case 2043:
        qtySection.innerHTML = Templates.getKmKxPostQtyHTML(existingData, container);
        qtySection.addEventListener('input', calcKmKxPostQtySummary);
        calcKmKxPostQtySummary();
        break;

      // ── 스텔란티스 DS STD 검사포장 (#2035) ──
      case 2035:
        qtySection.innerHTML = Templates.getInspQtyHTML(existingData, 2, true, container);
        qtySection.addEventListener('input', calcInspQtySummary);
        calcInspQtySummary();
        break;

      // ── 스텔란티스 검사포장 (#2005, #2015, #2027) ──
      case 2005:
      case 2015:
      case 2027:
        qtySection.innerHTML = Templates.getInspQtyHTML(existingData, 4, container);
        qtySection.addEventListener('input', calcInspQtySummary);
        calcInspQtySummary();
        break;

      // ── KM/KX HOOD SURROUND 검사포장 (#2044) ──
      case 2044:
        qtySection.innerHTML = Templates.getKmKxInspQtyHTML(existingData, container);
        qtySection.addEventListener('input', calcInspQtySummary);
        calcInspQtySummary();
        break;

      case 4011:
        qtySection.innerHTML = Templates.getForm4011QtyHTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;

      case 4001:
        qtySection.innerHTML = Templates.getForm4001QtyHTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;
      case 4003:
        qtySection.innerHTML = Templates.getForm4003QtyHTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;
      case 4004:
        qtySection.innerHTML = Templates.getForm4004QtyHTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;
      case 4012:
        qtySection.innerHTML = Templates.getForm4012QtyHTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;
      case 4013:
        qtySection.innerHTML = Templates.getForm4013QtyHTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;
      case 4014:
        qtySection.innerHTML = Templates.getForm4012QtyHTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;






      // ── 타 제조사 / 기본 공정별 양식 ──
      
      case 1021:
      case 1041:
        qtySection.innerHTML = Templates.getQty1021HTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;
      default:
        if (curProc === '조인트') {
          if (formCode === 1032) {
            qtySection.innerHTML = Templates.getJointQty1032HTML(existingData, container);
          } else {
            qtySection.innerHTML = Templates.getJointQtyHTML(existingData, container);
          }
          qtySection.addEventListener('input', calcJointQtySummary);
          calcJointQtySummary();
        } else if (curProc === '후가공') {
          if (formCode === 1012) {
            qtySection.innerHTML = Templates.getPostQty1012HTML(existingData, container);
          } else {
            qtySection.innerHTML = Templates.getPostQtyHTML(existingData, container, formCode);
          }
          qtySection.addEventListener('input', calcPostQtySummary);
          calcPostQtySummary();
        } else {
          if (formCode === 1013 || formCode === 1024 || formCode === 1044) {
            qtySection.innerHTML = Templates.getStandardQty1013HTML(existingData, container);
          } else {
            qtySection.innerHTML = Templates.getStandardQtyHTML(existingData, container);
          }
          qtySection.addEventListener('input', calcJg1QtySummary);
          calcJg1QtySummary();
        }
        break;
    }

    updateDowntimeSection();
    i18n.applyTranslations(qtySection);
}
