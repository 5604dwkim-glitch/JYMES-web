export function extractDefectBreakdown(r) {
  let defectMap = {};
  let totalDetailedDefects = 0;
  let totalGeneralDefects = Number(r.defectQty || 0);

  const addDefect = (name, qty) => {
    const q = Number(qty);
    if (!isNaN(q) && q > 0) {
      defectMap[name] = (defectMap[name] || 0) + q;
      totalDetailedDefects += q;
    }
  };

  // 1. Leader Form Items (반장 일보 스크랩)
  if (r.leaderFormItems && Array.isArray(r.leaderFormItems)) {
    r.leaderFormItems.forEach(item => {
       addDefect('[반장] 스크랩A', item.scrapA);
       addDefect('[반장] 스크랩B', item.scrapB);
       addDefect('[반장] 스크랩C', item.scrapC);
       addDefect('[반장] 스크랩D', item.scrapD);
       addDefect('[반장] 센터 불량', item.scrapCenter);
       addDefect('[반장] 사이드 불량', item.scrapSide);
    });
  }

  // 2. inspQtyTable (검사포장 공정)
  if (r.inspQtyTable) {
    [1, 2, 3, 4].forEach(c => {
      addDefect('[검사/압출] 스카치', r.inspQtyTable[`ext_scorch_${c}`]);
      addDefect('[검사/압출] 기스', r.inspQtyTable[`ext_scratch_${c}`]);
      addDefect('[검사/압출] 오염', r.inspQtyTable[`ext_contam_${c}`]);
      addDefect('[검사/압출] 기장', r.inspQtyTable[`ext_len_${c}`]);
      addDefect('[검사/압출] 클립', r.inspQtyTable[`ext_clip_${c}`]);
      addDefect('[검사/압출] 기타', r.inspQtyTable[`ext_oth_${c}`]);
      
      addDefect('[검사/조인트] 빠짐', r.inspQtyTable[`j_drop_${c}`]);
      addDefect('[검사/조인트] 미성형', r.inspQtyTable[`j_lack_${c}`]);
      addDefect('[검사/조인트] 밀림', r.inspQtyTable[`j_push_${c}`]);
      addDefect('[검사/조인트] 기포', r.inspQtyTable[`j_bubble_${c}`]);
      addDefect('[검사/조인트] 씹힘', r.inspQtyTable[`j_chew_${c}`]);
      addDefect('[검사/조인트] 오버', r.inspQtyTable[`j_overflow_${c}`]);
      addDefect('[검사/조인트] 변형', r.inspQtyTable[`j_deform_${c}`]);
      addDefect('[검사/조인트] 이물', r.inspQtyTable[`j_foreign_${c}`]);
      addDefect('[검사/조인트] 틀어짐', r.inspQtyTable[`j_twist_${c}`]);
      addDefect('[검사/조인트] 기타', r.inspQtyTable[`j_oth_${c}`]);

      addDefect('[검사/후가공] 사상과다', r.inspQtyTable[`p_trim_over_${c}`]);
      addDefect('[검사/후가공] 사상미달', r.inspQtyTable[`p_trim_under_${c}`]);
      addDefect('[검사/후가공] 본드오염', r.inspQtyTable[`p_bond_contam_${c}`]);
      addDefect('[검사/후가공] 표면오염', r.inspQtyTable[`p_ext_contam_${c}`]);
      addDefect('[검사/후가공] 클립누락', r.inspQtyTable[`p_clip_miss_${c}`]);
      addDefect('[검사/후가공] 클립홀', r.inspQtyTable[`p_clip_hole_${c}`]);
      addDefect('[검사/후가공] 물구멍', r.inspQtyTable[`p_drain_hole_${c}`]);
      addDefect('[검사/후가공] 이종클립', r.inspQtyTable[`p_wrong_clip_${c}`]);
      addDefect('[검사/후가공] 커팅불량', r.inspQtyTable[`p_cut_miss_${c}`]);
      addDefect('[검사/후가공] 본드불량', r.inspQtyTable[`p_bond_miss_${c}`]);
      addDefect('[검사/후가공] 기장과다', r.inspQtyTable[`p_len_excess_${c}`]);
      addDefect('[검사/후가공] 피치불량', r.inspQtyTable[`p_clip_pitch_${c}`]);
      addDefect('[검사/후가공] 기타', r.inspQtyTable[`p_oth_${c}`]);
    });
  }

  // 3. jointQtyTable (조인트 공정)
  if (r.jointQtyTable) {
    ['frt_p', 'frt_q', 'rr_r', 'rr_s_lh', 'rr_s_rh'].forEach(pos => {
      addDefect('[조인트] 쪼개짐', r.jointQtyTable[`split_${pos}`]);
      addDefect('[조인트] 밀림', r.jointQtyTable[`push_${pos}`]);
      addDefect('[조인트] 미성형', r.jointQtyTable[`lack_${pos}`]);
      addDefect('[조인트] 오버', r.jointQtyTable[`over_${pos}`]);
      addDefect('[조인트] 기포', r.jointQtyTable[`bubble_${pos}`]);
      addDefect('[조인트] 스크랩', r.jointQtyTable[`scrap_${pos}`]);
      addDefect('[조인트] 인서트 불량', r.jointQtyTable[`insert_${pos}`]);
      addDefect('[조인트] 기타', r.jointQtyTable[`oth_${pos}`]);
    });
  }

  // 4. postQtyTable (후가공 공정)
  if (r.postQtyTable) {
    ['fl', 'fr', 'rl', 'rr'].forEach(pos => {
      addDefect('[후가공] 조인트 빠짐', r.postQtyTable[`j_drop_${pos}`]);
      addDefect('[후가공] 미성형', r.postQtyTable[`j_lack_${pos}`]);
      addDefect('[후가공] 단차', r.postQtyTable[`j_step_${pos}`]);
      addDefect('[후가공] 기포', r.postQtyTable[`j_bubble_${pos}`]);
      addDefect('[후가공] 씹힘', r.postQtyTable[`j_chew_${pos}`]);
      addDefect('[후가공] 스크랩', r.postQtyTable[`j_scrap_${pos}`]);
      addDefect('[후가공] 사상 불량', r.postQtyTable[`p_trim_${pos}`]);
      addDefect('[후가공] 오염', r.postQtyTable[`p_poll_${pos}`]);
      addDefect('[후가공] 기타', r.postQtyTable[`p_oth_${pos}`]);
    });
  }
  
  // 5. dtCrewQty (클립머신 등)
  if (r.dtCrewQty) {
    ['LH', 'RH'].forEach(id => {
      addDefect('[클립머신] 종합 불량', r.dtCrewQty[`불량합계_${id}`]);
    });
  }
  if (r.dtCrewQtyB) {
    ['LH2', 'RH2', 'LH3', 'RH3', 'LH4', 'RH4'].forEach(id => {
      addDefect('[클립머신] 종합 불량', r.dtCrewQtyB[`불량합계_${id}`]);
    });
  }

  let unclassified = totalGeneralDefects - totalDetailedDefects;
  if (unclassified > 0) {
    defectMap['[공통] 기타 (상세 미지정)'] = unclassified;
  } else if (unclassified < 0) {
    // Should theoretically not happen, but just in case
    defectMap['[공통] 기타 (상세 미지정)'] = 0;
  }

  return defectMap;
}

export function buildStatsUpdate(oldReport, newReport) {
  const updates = {};
  
  let oldTarget = 0, oldActual = 0, oldDefect = 0;
  let newTarget = 0, newActual = 0, newDefect = 0;
  let oldDefects = {};
  let newDefects = {};

  const isOldValid = (oldReport && oldReport.status !== '반려' && oldReport.status !== '임시저장');
  const isNewValid = (newReport && newReport.status !== '반려' && newReport.status !== '임시저장');

  if (isOldValid) {
    oldTarget = Number(oldReport.targetQty || 0);
    oldActual = Number(oldReport.actualQty || 0);
    oldDefect = Number(oldReport.defectQty || 0);
    oldDefects = extractDefectBreakdown(oldReport);
  }

  if (isNewValid) {
    newTarget = Number(newReport.targetQty || 0);
    newActual = Number(newReport.actualQty || 0);
    newDefect = Number(newReport.defectQty || 0);
    newDefects = extractDefectBreakdown(newReport);
  }

  const diffTarget = newTarget - oldTarget;
  const diffActual = newActual - oldActual;
  const diffDefect = newDefect - oldDefect;

  if (diffTarget !== 0) updates['totalTargetQty'] = diffTarget;
  if (diffActual !== 0) updates['totalActualQty'] = diffActual;
  if (diffDefect !== 0) updates['totalDefectQty'] = diffDefect;

  if (!isOldValid && isNewValid) {
    updates['totalReports'] = 1;
  } else if (isOldValid && !isNewValid) {
    updates['totalReports'] = -1;
  }

  const allKeys = new Set([...Object.keys(oldDefects), ...Object.keys(newDefects)]);
  const defectBreakdowns = {};
  allKeys.forEach(k => {
    const diff = (newDefects[k] || 0) - (oldDefects[k] || 0);
    if (diff !== 0) defectBreakdowns[k] = diff;
  });

  if (Object.keys(defectBreakdowns).length > 0) {
    updates.defectBreakdowns = defectBreakdowns;
  }

  // 차종별-품목별 상세 누적
  updates.items = {};

  const addCombo = (report, mult) => {
    if (!report) return;
    const car = report.carModel || '기타';
    const item = report.itemCode || report.itemName || '기타';
    const key = `${car}::${item}`.replace(/[\.\/\[\]]/g, '_');
    
    if (!updates.items[key]) updates.items[key] = {};
    const combo = updates.items[key];
    
    const act = Number(report.actualQty || 0) * mult;
    const def = Number(report.defectQty || 0) * mult;
    if (act !== 0) combo.actualQty = (combo.actualQty || 0) + act;
    if (def !== 0) combo.defectQty = (combo.defectQty || 0) + def;
    
    const defects = extractDefectBreakdown(report);
    if (Object.keys(defects).length > 0) {
      if (!combo.defects) combo.defects = {};
      Object.entries(defects).forEach(([k, v]) => {
        const dk = k.replace(/[\.\/]/g, '_');
        combo.defects[dk] = (combo.defects[dk] || 0) + (v * mult);
      });
    }
  };

  if (isOldValid) addCombo(oldReport, -1);
  if (isNewValid) addCombo(newReport, 1);

  // Remove empty items
  Object.keys(updates.items).forEach(k => {
    if (Object.keys(updates.items[k]).length === 0) delete updates.items[k];
  });
  if (Object.keys(updates.items).length === 0) delete updates.items;

  return updates;
}
