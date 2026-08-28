export const FORM_CODE_MAP = {
  // ── 제네시스(Genesis) ──────────────────────────────────
  // JG1(스윙도어)
  'JG1_인벨트_소재준비': 1001,
  'JG1_인벨트_조인트': 1002,
  'JG1_인벨트_후가공': 1003,
  'JG1_인벨트_검사포장': 1004,
  "JG1_RR C PART'G_조인트": 1011,
  "JG1_RR C PART'G_후가공": 1012,
  "JG1_RR C PART'G_검사포장": 1013,
  "JG1_G/RUN 'E'_소재준비": 1021,
  "JG1_G/RUN 'E'_조인트": 1022,
  "JG1_G/RUN 'E'_후가공": 1023,
  "JG1_G/RUN 'E'_검사포장": 1024,
  // JG1S(코치도어)
  'JG1S_인벨트_소재준비': 1031,
  'JG1S_인벨트_조인트': 1032,
  'JG1S_인벨트_후가공': 1033,
  'JG1S_인벨트_검사포장': 1034,
  "JG1S_G/RUN 'E'_소재준비": 1041,
  "JG1S_G/RUN 'E'_조인트": 1042,
  "JG1S_G/RUN 'E'_후가공": 1043,
  "JG1S_G/RUN 'E'_검사포장": 1044,

  // ── 스텔란티스(Stellantis) ────────────────────────────
  // DT CREW
  'DT CREW_D/SIDE_클립머신': 2001,
  'DT CREW_D/SIDE_소재준비': 2002,
  'DT CREW_D/SIDE_조인트': 2003,
  'DT CREW_D/SIDE_후가공': 2004,
  'DT CREW_D/SIDE_검사포장': 2005,
  // DT QUAD
  'DT QUAD_D/SIDE_클립머신': 2011,
  'DT QUAD_D/SIDE_소재준비': 2012,
  'DT QUAD_D/SIDE_조인트': 2013,
  'DT QUAD_D/SIDE_후가공': 2014,
  'DT QUAD_D/SIDE_검사포장': 2015,
  // DS CREW
  'DS CREW_D/SIDE_소재준비(A)': 2021,
  'DS CREW_D/SIDE_소재준비(C)': 2022,
  'DS CREW_D/SIDE_소재준비(D)': 2023,
  'DS CREW_D/SIDE_조인트': 2024,
  'DS CREW_D/SIDE_조인트(D)': 2025,
  'DS CREW_D/SIDE_후가공': 2026,
  'DS CREW_D/SIDE_검사포장': 2027,
  // DS STD
  'DS STD_D/SIDE_소재준비(A)': 2031,
  'DS STD_D/SIDE_소재준비(C)': 2032,
  'DS STD_D/SIDE_조인트': 2033,
  'DS STD_D/SIDE_후가공': 2034,
  'DS STD_D/SIDE_검사포장': 2035,
  // KM/KX
  'KM/KX_HOOD SURROUND_클립머신': 2041,
  'KM/KX_HOOD SURROUND_조인트': 2042,
  'KM/KX_HOOD SURROUND_후가공': 2043,
  'KM/KX_HOOD SURROUND_검사포장': 2044,

  // ── 현대(HMC) ─────────────────────────────────────────
  // NE1a
  'NE1a_D/SIDE_소재준비': 3001,
  'NE1a_D/SIDE_조인트': 3002,
  'NE1a_D/SIDE_후가공': 3003,
  'NE1a_D/SIDE_검사포장': 3004,
  // ME1a
  "ME1a_PART'G_소재준비": 3011,
  "ME1a_PART'G_조인트": 3012,
  "ME1a_PART'G_후가공": 3013,
  "ME1a_PART'G_검사포장": 3014,

  // ── 기아(KMC) ─────────────────────────────────────────
  // OV1K
  'OV1K_PTG_소재준비': 4001,
  'OV1K_PTG_조인트': 4002,
  'OV1K_PTG_후가공': 4003,
  'OV1K_PTG_검사포장': 4004,
  'OV1K_FRUNK_소재준비': 4011,
  'OV1K_FRUNK_조인트': 4012,
  'OV1K_FRUNK_후가공': 4013,
  'OV1K_FRUNK_검사포장': 4014,
  // LQ2a
  'LQ2a_HOOD SIDE_소재준비': 4021,
  'LQ2a_HOOD SIDE_조인트': 4022,
  'LQ2a_HOOD SIDE_후가공': 4023,
  'LQ2a_HOOD SIDE_검사포장': 4024,
  // MV1a
  'MV1a_PTG_소재준비': 4031,
  'MV1a_PTG_조인트': 4032,
  'MV1a_PTG_후가공': 4033,
  'MV1a_PTG_검사포장': 4034,

  // ── GM(지엠) ──────────────────────────────────────────
  '9BQC_G/RUN_소재준비': 5001,
  '9BQC_G/RUN_조인트': 5002,
  '9BQC_G/RUN_후가공': 5003,
  '9BQC_G/RUN_검사포장': 5004,

  // ── 르노(Renault) ─────────────────────────────────────
  'P417_UPR_소재준비': 6001,
  'P417_UPR_조인트': 6002,
  'P417_UPR_후가공': 6003,
  'P417_UPR_검사포장': 6004,
};

export const getCurrentFormCode = (carModel, part, process) => {
  if (!carModel || !process) return 0;
  let p = part || '';
  if (p && p.startsWith(carModel + ' ')) {
    p = p.replace(carModel + ' ', '').trim();
  }
  const lookupKey = `${carModel}_${p}_${process}`.replace('__', '_');
  return FORM_CODE_MAP[lookupKey] || 9999;
};
