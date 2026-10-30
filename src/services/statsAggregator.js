// ── 양식별 불량 키 → 표시 이름 매핑 (dtCrewPostQty / postQtyTable 공용) ──
const POST_EXT_MAP = [
  ['scorch', '[검사/압출] 스코치'], ['scratch', '[검사/압출] 외면흠'], ['coat', '[검사/압출] 오염'],
  ['len', '[검사/압출] 길이불량'], ['clip_omit', '[검사/압출] 클립'], ['oth', '[검사/압출] 기타']
];
const POST_JOINT_MAP = [
  ['drop', '[검사/조인트] 빠짐'], ['lack', '[검사/조인트] 미성형'], ['push', '[검사/조인트] 밀림'],
  ['bubble', '[검사/조인트] 기포'], ['chew', '[검사/조인트] 씹힘'], ['overflow', '[검사/조인트] 오버'],
  ['deform', '[검사/조인트] 변형'], ['foreign', '[검사/조인트] 이물'], ['twist', '[검사/조인트] 틀어짐'],
  ['oth', '[검사/조인트] 기타']
];
const POST_POST_MAP = [
  ['oversand', '[검사/후가공] 사상과다'], ['undersand', '[검사/후가공] 사상미달'],
  ['bond_contam', '[검사/후가공] 본드오염'], ['ext_contam', '[검사/후가공] 표면오염'],
  ['clip_half', '[검사/후가공] 클립누락'], ['clip_hole_omit', '[검사/후가공] 클립홀'],
  ['drain_bad', '[검사/후가공] 물구멍'], ['clip_diff', '[검사/후가공] 이종클립'],
  ['cut_omit', '[검사/후가공] 커팅불량'], ['bond_omit', '[검사/후가공] 본드불량'],
  ['len_over', '[검사/후가공] 길이초과'], ['clip_gap_bad', '[검사/후가공] 피치불량'],
  ['oth', '[검사/후가공] 기타']
];
// DT/DS CREW 조인트 표(dtCrewJointQty) 불량 키
const CREW_JOINT_MAP = [
  ['tear', '[조인트] 떨어짐'], ['lack', '[조인트] 미성형'], ['push', '[조인트] 밀림'],
  ['bubble', '[조인트] 기포'], ['chew', '[조인트] 씹힘'], ['overflow', '[조인트] 오버'],
  ['deform', '[조인트] 변형'], ['foreign', '[조인트] 이물'], ['twist', '[조인트] 꼬임'],
  ['oth', '[조인트] 기타']
];

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

  // 2. inspQtyTable (검사포장 공정 — 스텔란티스 DS계열 양식)
  if (r.inspQtyTable) {
    [1, 2, 3, 4].forEach(c => {
      addDefect('[검사/압출] 스코치',   r.inspQtyTable[`ext_scorch_${c}`]);
      addDefect('[검사/압출] 외면흠',     r.inspQtyTable[`ext_scratch_${c}`]);
      addDefect('[검사/압출] 오염',     r.inspQtyTable[`ext_contam_${c}`]);
      addDefect('[검사/압출] 길이불량',     r.inspQtyTable[`ext_len_${c}`]);
      addDefect('[검사/압출] 클립',     r.inspQtyTable[`ext_clip_${c}`]);
      addDefect('[검사/압출] 기타',     r.inspQtyTable[`ext_oth_${c}`]);
      
      addDefect('[검사/조인트] 빠짐',   r.inspQtyTable[`j_drop_${c}`]);
      addDefect('[검사/조인트] 미성형', r.inspQtyTable[`j_lack_${c}`]);
      addDefect('[검사/조인트] 밀림',   r.inspQtyTable[`j_push_${c}`]);
      addDefect('[검사/조인트] 기포',   r.inspQtyTable[`j_bubble_${c}`]);
      addDefect('[검사/조인트] 씹힘',   r.inspQtyTable[`j_chew_${c}`]);
      addDefect('[검사/조인트] 오버',   r.inspQtyTable[`j_overflow_${c}`]);
      addDefect('[검사/조인트] 변형',   r.inspQtyTable[`j_deform_${c}`]);
      addDefect('[검사/조인트] 이물',   r.inspQtyTable[`j_foreign_${c}`]);
      addDefect('[검사/조인트] 틀어짐', r.inspQtyTable[`j_twist_${c}`]);
      addDefect('[검사/조인트] 기타',   r.inspQtyTable[`j_oth_${c}`]);

      addDefect('[검사/후가공] 사상과다', r.inspQtyTable[`p_trim_over_${c}`]);
      addDefect('[검사/후가공] 사상미달', r.inspQtyTable[`p_trim_under_${c}`]);
      addDefect('[검사/후가공] 본드오염', r.inspQtyTable[`p_bond_contam_${c}`]);
      addDefect('[검사/후가공] 표면오염', r.inspQtyTable[`p_ext_contam_${c}`]);
      addDefect('[검사/후가공] 클립누락', r.inspQtyTable[`p_clip_miss_${c}`]);
      addDefect('[검사/후가공] 클립홀',   r.inspQtyTable[`p_clip_hole_${c}`]);
      addDefect('[검사/후가공] 물구멍',   r.inspQtyTable[`p_drain_hole_${c}`]);
      addDefect('[검사/후가공] 이종클립', r.inspQtyTable[`p_wrong_clip_${c}`]);
      addDefect('[검사/후가공] 커팅불량', r.inspQtyTable[`p_cut_miss_${c}`]);
      addDefect('[검사/후가공] 본드불량', r.inspQtyTable[`p_bond_miss_${c}`]);
      addDefect('[검사/후가공] 길이초과', r.inspQtyTable[`p_len_excess_${c}`]);
      addDefect('[검사/후가공] 피치불량', r.inspQtyTable[`p_clip_pitch_${c}`]);
      addDefect('[검사/후가공] 기타',     r.inspQtyTable[`p_oth_${c}`]);
    });
  }

  // 3. jointQtyTable (조인트 공정)
  if (r.jointQtyTable) {
    ['frt_p', 'frt_q', 'rr_r', 'rr_s_lh', 'rr_s_rh', 'frt_lh', 'frt_rh', 'rr_lh', 'rr_rh'].forEach(pos => {
      addDefect('[조인트] 씹힘',         r.jointQtyTable[`chew_${pos}`]);
      addDefect('[조인트] 이물',         r.jointQtyTable[`foreign_${pos}`]);
      addDefect('[조인트] 찢어짐',       r.jointQtyTable[`torn_${pos}`]);
      addDefect('[조인트] 쪼개짐',       r.jointQtyTable[`split_${pos}`]);
      addDefect('[조인트] 밀림',         r.jointQtyTable[`push_${pos}`]);
      addDefect('[조인트] 미성형',       r.jointQtyTable[`lack_${pos}`]);
      addDefect('[조인트] 오버',         r.jointQtyTable[`over_${pos}`]);
      addDefect('[조인트] 기포',         r.jointQtyTable[`bubble_${pos}`]);
      addDefect('[조인트] 스크랩',       r.jointQtyTable[`scrap_${pos}`]);
      addDefect('[조인트] 인서트불량',   r.jointQtyTable[`insert_${pos}`]);
      addDefect('[조인트] 기타',         r.jointQtyTable[`oth_${pos}`]);
    });
  }

  // 4. postQtyTable (후가공 공정)
  if (r.postQtyTable) {
    ['fl', 'fr', 'rl', 'rr'].forEach(pos => {
      addDefect('[후가공] 조인트빠짐', r.postQtyTable[`j_drop_${pos}`]);
      addDefect('[후가공] 미성형',     r.postQtyTable[`j_lack_${pos}`]);
      addDefect('[후가공] 단차',       r.postQtyTable[`j_step_${pos}`]);
      addDefect('[후가공] 기포',       r.postQtyTable[`j_bubble_${pos}`]);
      addDefect('[후가공] 씹힘',       r.postQtyTable[`j_chew_${pos}`]);
      addDefect('[후가공] 스크랩',     r.postQtyTable[`j_scrap_${pos}`]);
      addDefect('[후가공] 사상불량',   r.postQtyTable[`p_trim_${pos}`]);
      addDefect('[후가공] 오염',       r.postQtyTable[`p_poll_${pos}`]);
      addDefect('[후가공] 기타',       r.postQtyTable[`p_oth_${pos}`]);

      // 3003 계열 후가공 양식 (ext_/j_/post_ 접두 키)
      addDefect('[검사/조인트] 밀림',   r.postQtyTable[`j_push_${pos}`]);
      addDefect('[검사/조인트] 오버',   r.postQtyTable[`j_overflow_${pos}`]);
      addDefect('[검사/조인트] 변형',   r.postQtyTable[`j_deform_${pos}`]);
      addDefect('[검사/조인트] 이물',   r.postQtyTable[`j_foreign_${pos}`]);
      addDefect('[검사/조인트] 틀어짐', r.postQtyTable[`j_twist_${pos}`]);
      POST_EXT_MAP.forEach(([k, name]) => addDefect(name, r.postQtyTable[`ext_${k}_${pos}`]));
      POST_POST_MAP.forEach(([k, name]) => addDefect(name, r.postQtyTable[`post_${k}_${pos}`]));
    });
  }
  
  // 5. dtCrewQty (클립머신 Table A — LH/RH)
  // ★ 변경: 종합 불량 합계 대신 세부 항목 8종을 각각 집계
  if (r.dtCrewQty) {
    ['LH', 'RH'].forEach(id => {
      addDefect('[클립머신] 길이미달',    r.dtCrewQty[`길이미달_${id}`]);
      addDefect('[클립머신] 길이초과',    r.dtCrewQty[`길이초과_${id}`]);
      addDefect('[클립머신] 끝단부불량',  r.dtCrewQty[`끝단부불량_${id}`]);
      addDefect('[클립머신] 클립홀찢어짐', r.dtCrewQty[`클립홀찢어짐_${id}`]);
      addDefect('[클립머신] 클립간격불량', r.dtCrewQty[`클립간격불량_${id}`]);
      addDefect('[클립머신] 드레인홀불량', r.dtCrewQty[`드레인홀불량_${id}`]);
      addDefect('[클립머신] 스코치',      r.dtCrewQty[`스코치_${id}`]);
      addDefect('[클립머신] 기타',        r.dtCrewQty[`기타_${id}`]);
    });
  }

  // 6. qtyTable (동적 양식: NE1a 검사포장 — 3004 등)
  // ★ 변경: inspQtyTable 계열 이름으로 통합 (언더스코어 → 슬래시)
  if (r.qtyTable) {
    ['w1', 'w2', 'w3', 'w4'].forEach(c => {
      // 압출소재 불량 → [검사/압출] 통합
      addDefect('[검사/압출] 스코치',   r.qtyTable[`ext_scorch_${c}`]);
      addDefect('[검사/압출] 외면흠',     r.qtyTable[`ext_scratch_${c}`]);
      addDefect('[검사/압출] 오염',     r.qtyTable[`ext_contam_${c}`]);
      addDefect('[검사/압출] 길이불량',     r.qtyTable[`ext_len_${c}`]);
      addDefect('[검사/압출] 클립',     r.qtyTable[`ext_clip_${c}`]);
      addDefect('[검사/압출] 기타',     r.qtyTable[`ext_oth_${c}`]);

      // 조인트 불량 → [검사/조인트] 통합
      addDefect('[검사/조인트] 빠짐',   r.qtyTable[`j_tear_${c}`]);
      addDefect('[검사/조인트] 미성형', r.qtyTable[`j_lack_${c}`]);
      addDefect('[검사/조인트] 밀림',   r.qtyTable[`j_push_${c}`]);
      addDefect('[검사/조인트] 기포',   r.qtyTable[`j_bubble_${c}`]);
      addDefect('[검사/조인트] 씹힘',   r.qtyTable[`j_chew_${c}`]);
      addDefect('[검사/조인트] 오버',   r.qtyTable[`j_over_${c}`]);
      addDefect('[검사/조인트] 변형',   r.qtyTable[`j_deform_${c}`]);
      addDefect('[검사/조인트] 이물',   r.qtyTable[`j_foreign_${c}`]);
      addDefect('[검사/조인트] 틀어짐', r.qtyTable[`j_twist_${c}`]);
      addDefect('[검사/조인트] 기타',   r.qtyTable[`j_oth_${c}`]);

      // 후가공 불량 → [검사/후가공] 통합
      addDefect('[검사/후가공] 사상과다', r.qtyTable[`p_overtrim_${c}`]);
      addDefect('[검사/후가공] 사상미달', r.qtyTable[`p_undertrim_${c}`]);
      addDefect('[검사/후가공] 본드오염', r.qtyTable[`p_bcontam_${c}`]);
      addDefect('[검사/후가공] 표면오염', r.qtyTable[`p_econtam_${c}`]);
      addDefect('[검사/후가공] 클립누락', r.qtyTable[`p_cmiss_${c}`]);
      addDefect('[검사/후가공] 클립홀',   r.qtyTable[`p_chole_${c}`]);
      addDefect('[검사/후가공] 물구멍',   r.qtyTable[`p_drain_${c}`]);
      addDefect('[검사/후가공] 이종클립', r.qtyTable[`p_cdiff_${c}`]);
      addDefect('[검사/후가공] 커팅불량', r.qtyTable[`p_cutmiss_${c}`]);
      addDefect('[검사/후가공] 본드불량', r.qtyTable[`p_bmiss_${c}`]);
      addDefect('[검사/후가공] 길이초과', r.qtyTable[`p_lenover_${c}`]);
      addDefect('[검사/후가공] 피치불량', r.qtyTable[`p_cgap_${c}`]);
      addDefect('[검사/후가공] 기타',     r.qtyTable[`p_oth_${c}`]);
    });

    // 4001 계열 양식 등 FL/FR/RL/RR 분류
    ['FL', 'FR', 'RL', 'RR'].forEach(c => {
      addDefect('[검사/압출] 스코치',     r.qtyTable[`ext_scorch_${c}`]);
      addDefect('[검사/압출] 외면흠',       r.qtyTable[`ext_scratch_${c}`]);
      addDefect('[검사/압출] 후로킹불량', r.qtyTable[`ext_flock_${c}`]);
      addDefect('[검사/압출] 오염',       r.qtyTable[`ext_contam_${c}`]);
      addDefect('[검사/압출] 길이불량',       r.qtyTable[`ext_short_${c}`]);
      addDefect('[검사/압출] 단면불량',   r.qtyTable[`ext_cross_${c}`]);
      addDefect('[검사/압출] 기타',       r.qtyTable[`ext_etc_${c}`]);
      
      addDefect('[검사/후가공] 길이불량',     r.qtyTable[`proc_len_${c}`]);
      addDefect('[검사/후가공] 커팅불량', r.qtyTable[`proc_cut_${c}`]);
      addDefect('[검사/후가공] 기타',     r.qtyTable[`proc_oth_${c}`]);
    });

    // LH_A / RH_A 분류 양식
    ['LH_A', 'RH_A'].forEach(c => {
      addDefect('[검사/압출] 스코치',     r.qtyTable[`ext_scorch_${c}`]);
      addDefect('[검사/압출] 오염',       r.qtyTable[`ext_contam_${c}`]);
      addDefect('[검사/압출] 기타',       r.qtyTable[`ext_other_${c}`]);
      
      addDefect('[검사/후가공] 길이불량',     r.qtyTable[`proc_len_${c}`]);
      addDefect('[검사/후가공] 2차사상',  r.qtyTable[`proc_sec_${c}`]);
      addDefect('[검사/후가공] 기타',     r.qtyTable[`proc_other_${c}`]);
    });
  }

  // 7. dtCrewQtyB (클립머신 Table B — LH3/LH4/RH2/RH4)
  // ★ 변경: 종합 불량 합계 대신 세부 항목 8종을 각각 집계
  if (r.dtCrewQtyB) {
    ['LH3', 'LH4', 'RH2', 'RH4'].forEach(id => {
      addDefect('[클립머신] 길이미달',    r.dtCrewQtyB[`길이미달_${id}`]);
      addDefect('[클립머신] 길이초과',    r.dtCrewQtyB[`길이초과_${id}`]);
      addDefect('[클립머신] 끝단부불량',  r.dtCrewQtyB[`끝단부불량_${id}`]);
      addDefect('[클립머신] 클립홀찢어짐', r.dtCrewQtyB[`클립홀찢어짐_${id}`]);
      addDefect('[클립머신] 클립간격불량', r.dtCrewQtyB[`클립간격불량_${id}`]);
      addDefect('[클립머신] 드레인홀불량', r.dtCrewQtyB[`드레인홀불량_${id}`]);
      addDefect('[클립머신] 스코치',      r.dtCrewQtyB[`스코치_${id}`]);
      addDefect('[클립머신] 기타',        r.dtCrewQtyB[`기타_${id}`]);
    });
  }

  // 8. qtyTable 추가 양식 (3001 위치별 / 1013·4011 계열)
  if (r.qtyTable) {
    ['FL_A', 'FR_A', 'RL_A', 'RR_A', 'RL_C', 'RR_C', 'RL_D', 'RR_D'].forEach(c => {
      addDefect('[검사/압출] 스코치',     r.qtyTable[`ext_scorch_${c}`]);
      addDefect('[검사/압출] 외면흠',       r.qtyTable[`ext_scratch_${c}`]);
      addDefect('[검사/압출] 기타',       r.qtyTable[`ext_oth_${c}`]);
      addDefect('[검사/후가공] 커팅불량', r.qtyTable[`proc_cut_${c}`]);
      addDefect('[검사/후가공] 클립홀',   r.qtyTable[`proc_hole_${c}`]);
      addDefect('[검사/후가공] 기타',     r.qtyTable[`proc_oth_${c}`]);
    });
    ['FL', 'FR', 'RL', 'RR'].forEach(c => {
      // #1013 / #1024 / #1044
      addDefect('[검사/조인트] 불량',     r.qtyTable[`def_1013_joint_${c}`]);
      addDefect('[검사/후가공] 사상불량', r.qtyTable[`def_1013_trim_${c}`]);
      addDefect('[검사/압출] 외면흠',       r.qtyTable[`def_1013_blemish_${c}`]);
      addDefect('[검사/압출] 스코치',     r.qtyTable[`def_1013_scorch_${c}`]);
      addDefect('[검사/후가공] 클립누락', r.qtyTable[`def_1013_pad_${c}`]);
      addDefect('[검사/후가공] 길이불량',     r.qtyTable[`def_1013_len_${c}`]);
      addDefect('[검사/후가공] 기타',     r.qtyTable[`def_1013_etc_${c}`]);
      // #4011 계열
      addDefect('[검사/후가공] 찍힘변형', r.qtyTable[`proc_deform_${c}`]);
      addDefect('[검사/조인트] 불량',     r.qtyTable[`etc_joint_${c}`]);
      addDefect('[검사/후가공] 기타',     r.qtyTable[`etc_other_${c}`]);
    });
  }

  // 9. dtCrewPrepQty (스텔란티스 소재준비 — LH_A / RH_A)
  if (r.dtCrewPrepQty) {
    ['LH_A', 'RH_A'].forEach(c => {
      addDefect('[검사/압출] 스코치',   r.dtCrewPrepQty[`ext_scorch_${c}`]);
      addDefect('[검사/압출] 오염',     r.dtCrewPrepQty[`ext_contam_${c}`]);
      addDefect('[검사/압출] 기타',     r.dtCrewPrepQty[`ext_other_${c}`]);
      addDefect('[검사/후가공] 길이불량',   r.dtCrewPrepQty[`proc_len_${c}`]);
      addDefect('[검사/후가공] 2차사상', r.dtCrewPrepQty[`proc_sec_${c}`]);
      addDefect('[검사/후가공] 기타',   r.dtCrewPrepQty[`proc_other_${c}`]);
    });
  }

  // 10. dtCrewJointQty (스텔란티스 조인트 — 표1/표2, A·B·C / 1~4호)
  if (r.dtCrewJointQty) {
    ['tbl1', 'tbl2'].forEach(tbl => {
      const defs = r.dtCrewJointQty[tbl]?.defects;
      if (!defs) return;
      CREW_JOINT_MAP.forEach(([k, name]) => {
        const row = defs[k];
        if (!row) return;
        ['a', 'b', 'c', 'h1', 'h2', 'h3', 'h4'].forEach(col => addDefect(name, row[col]));
      });
    });
  }

  // 11. dtCrewPostQty (스텔란티스 후가공 / 3003 조인트 — 압출·조인트·후가공 불량)
  if (r.dtCrewPostQty) {
    const q = r.dtCrewPostQty;
    const addGroup = (group, map) => {
      if (!q[group]) return;
      map.forEach(([k, name]) => {
        addDefect(name, q[group][k]?.lh);
        addDefect(name, q[group][k]?.rh);
      });
    };
    addGroup('ext', POST_EXT_MAP);
    addGroup('joint', POST_JOINT_MAP);
    addGroup('post', POST_POST_MAP);
  }

  // 12. kmkxClipQty (KM/KX 클립머신 — LH/MID/RH)
  if (r.kmkxClipQty) {
    ['LH', 'MID', 'RH'].forEach(id => {
      addDefect('[클립머신] 길이미달',    r.kmkxClipQty[`길이미달_${id}`]);
      addDefect('[클립머신] 길이초과',    r.kmkxClipQty[`길이초과_${id}`]);
      addDefect('[클립머신] 끝단부불량',  r.kmkxClipQty[`끝단부불량_${id}`]);
      addDefect('[클립머신] 클립홀찢어짐', r.kmkxClipQty[`클립홀찢어짐_${id}`]);
      addDefect('[클립머신] 클립간격불량', r.kmkxClipQty[`클립간격불량_${id}`]);
      addDefect('[클립머신] 드레인홀불량', r.kmkxClipQty[`드레인홀불량_${id}`]);
      addDefect('[클립머신] 스코치',      r.kmkxClipQty[`스코치_${id}`]);
      addDefect('[클립머신] 기타',        r.kmkxClipQty[`기타_${id}`]);
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
    // 반장/지게차/출하지원 일보는 차종·품목과 무관하므로 '공통'으로 통일 (구버전 데이터가 특정 차종 통계에 섞이는 오류 방지)
    const isCommonForm = report.isLeaderForm || report.isForkliftForm || report.isSupportForm
      || ['반장 작업일보', '지게차작업', '출하지원'].includes(report.processName);
    const car = isCommonForm ? '공통' : (report.carModel || '기타');
    const item = isCommonForm ? '공통' : (report.itemCode || report.itemName || '기타');
    const proc = report.isLeaderForm ? '반장 작업일보'
      : report.isForkliftForm ? '지게차작업'
      : report.isSupportForm ? '출하지원'
      : (report.processName || '기타');
      const key = `${car}::${item}::${proc}`.replace(/[\.\\/\[\]]/g, '_');
    
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
        const dk = k.replace(/[\.\\/]/g, '_');
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
