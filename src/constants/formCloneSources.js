/**
 * 양식 복사본(Clone) 원본 매핑 — "복사 직후 상태"를 유지하기 위한 임시 위임 테이블.
 *
 * - 키: 복사본 양식 고유 번호 / 값: 렌더링 내용을 그대로 가져오는 원본 양식 번호
 * - 공통 렌더러(Section5 / Qty / LotTable / Downtime)는 `resolveFormCodeSource()` 로 한 번만 변환합니다. (GEMINI.md 원칙 8)
 * - 저장되는 formCode / 배지 / 목록 표시는 복사본 번호(예: 1051)를 그대로 사용하며,
 *   원본 양식(4011~4014)의 코드·렌더링에는 어떠한 변경도 없습니다.
 * - 복사본 양식을 개별 수정할 때는 `forms/f{코드}/` 전용 파일을 만들어 렌더러에서 먼저 위임하고,
 *   이 표에서 해당 항목을 삭제하세요.
 */
export const FORM_CLONE_SOURCE = {
  // 제네시스 JG1 - FRUNK : 기아 OV1K - FRUNK 복사본 (후가공 제외)
  1051: 4011, // JG1_FRUNK_소재준비
  1052: 4012, // JG1_FRUNK_조인트
  1054: 4014  // JG1_FRUNK_검사포장
};

export function resolveFormCodeSource(formCode) {
  return FORM_CLONE_SOURCE[formCode] ?? formCode;
}
