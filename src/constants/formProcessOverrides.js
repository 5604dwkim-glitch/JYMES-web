/**
 * 차종/부품별 "생산공정 선택" 칩 목록 재정의 (기본 공정 목록을 쓰지 않는 차종 전용).
 *
 * - LegacyFormWrapper.renderProcessChips 가 한 줄로 위임 호출합니다. (GEMINI.md 원칙 8)
 * - 여기에 정의된 공정명은 반드시 formMappings.js / formCodes.js 의 FORM_CODE_MAP 키
 *   (`{차종}_{부품}_{공정명}`)와 글자 하나까지 동일해야 양식 고유 번호가 매핑됩니다.
 */

// GM 9BQC / G/RUN : 양식 고유 번호 5001 ~ 5014 (아래 순서 = 번호 순서)
export const GM_9BQC_GRUN_PROCESSES = [
  '소재준비-글라스본딩',   // 5001
  '소재준비-정치절단',     // 5002
  '소재준비-단컷팅',       // 5003
  '조인트-FRT',            // 5004
  '조인트-RR R부',         // 5005
  '조인트-RR Fixed',       // 5006
  '후가공-D/V',            // 5007
  '후가공-글라스',         // 5008
  '후가공-FRT',            // 5009
  '후가공-RR',             // 5010
  '검사포장-FRT',          // 5011
  '검사포장-RR R부',       // 5012
  '검사포장-RR',           // 5013
  '검사포장-길이'          // 5014
];

/**
 * 해당 차종/부품에 전용 공정 목록이 있으면 복사본을 반환하고, 없으면 null (기본 목록 사용).
 */
export function getProcessListOverride(carCode, partName) {
  if (carCode === '9BQC' && (!partName || partName === 'G/RUN')) {
    return [...GM_9BQC_GRUN_PROCESSES];
  }
  return null;
}
