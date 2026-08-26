/**
 * 공유 유틸리티 함수 (순환 import 방지용)
 */

/**
 * 날짜/시간 문자열을 년월일시 형식으로 자동 포맷 (00년 00월 00일 00시)
 */
export function autoFormatDateTimeString(inputStr) {
  if (!inputStr) return '';
  const digits = inputStr.replace(/\D/g, '');
  if (!digits) return inputStr;

  let formatted = '';
  if (digits.length >= 2) formatted += digits.substring(0, 2) + '년 ';
  if (digits.length >= 4) formatted += digits.substring(2, 4) + '월 ';
  if (digits.length >= 6) formatted += digits.substring(4, 6) + '일 ';
  if (digits.length >= 8) formatted += digits.substring(6, 8) + '시';
  if (digits.length < 2) formatted = digits;

  return formatted.trim();
}
