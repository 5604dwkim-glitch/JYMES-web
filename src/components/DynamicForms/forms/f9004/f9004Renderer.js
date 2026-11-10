import { store, windowMock } from '../../LegacyFormWrapper.jsx';
import { i18n } from '../../../../constants/translations.js';

export const F9004_CHECKLIST_ITEMS = [
  { id: 'f9004_chk_mon', text: '온/습도 모니터링 장비는 정상작동중인가? (ON/OFF 유무)', refNote: 'F/Proof 작동요령서 참조' },
  { id: 'f9004_chk_alarm', text: '온/습도 경광등 및 경보음은 정상작동중인가? (F/proof 정상작동 여부)', refNote: 'F/Proof 작동요령서 참조' },
  { id: 'f9004_chk2', text: 'FMB(배합고무) 선입선출(FIFO) 준수 및 적재 구역 구분 상태' },
  { id: 'f9004_chk3', text: '원재료 LOT 식별표 부착 및 유효기간(사용기한) 경과품 유무 확인' },
  { id: 'f9004_chk4', text: '이물질·오염·직사광선 차단 및 비닐 커버 밀봉 보관 상태' },
  { id: 'f9004_chk5', text: '보관실 통로 정리정돈 및 안전·소방 시설 이상 유무' }
];

// 과거 저장된 일보 조회용 하위 호환 체크리스트 (원칙 11)
const F9004_LEGACY_CHECKLIST_ITEMS = [
  { id: 'f9004_chk1', text: '보관실 항온·항습기 가동 및 기준 온·습도 유지 상태' },
  { id: 'f9004_chk2', text: 'FMB(배합고무) 선입선출(FIFO) 준수 및 적재 구역 구분 상태' },
  { id: 'f9004_chk3', text: '원재료 LOT 식별표 부착 및 유효기간(사용기한) 경과품 유무 확인' },
  { id: 'f9004_chk4', text: '이물질·오염·직사광선 차단 및 비닐 커버 밀봉 보관 상태' },
  { id: 'f9004_chk5', text: '보관실 통로 정리정돈 및 안전·소방 시설 이상 유무' }
];

const F9004_IO_TYPES = ['입고', '불출(투입)', '반납', '재고점검', '보류·격리'];

const escapeHtml = (val) => String(val ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function parseEnvNumber(raw) {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const m = str.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const num = Number(m[0]);
  return Number.isFinite(num) ? num : null;
}

/**
 * FMB 보관실 관리 표준 기준 판정
 * - 온도: 20 ± 5℃ (15.0 ~ 25.0℃)
 * - 습도: 70% 이하 (0 ~ 70.0%)
 */
export function evaluateF9004EnvSpec(tempRaw, humRaw) {
  const t = parseEnvNumber(tempRaw);
  const h = parseEnvNumber(humRaw);
  const tempOk = t === null ? null : (t >= 15 && t <= 25);
  const humOk = h === null ? null : (h >= 0 && h <= 70);
  return { tempVal: t, humVal: h, tempOk, humOk };
}

function buildFmbStandardLeftBoxHTML(compact = false) {
  const cellPad = compact ? '4px 6px' : '6px 8px';
  const fontSize = compact ? '11.5px' : '12.5px';
  const ruleFont = compact ? '11.5px' : '12.5px';
  return `
    <div class="f9004-std-box" style="border: 1.5px solid #1e293b; border-radius: 6px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column; height: 100%; word-break: keep-all;">
      <div style="background: #ebf1de; border-bottom: 1.5px solid #1e293b; padding: ${compact ? '6px 10px' : '8px 12px'}; text-align: center; font-size: ${compact ? '13px' : '14px'}; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">
        FMB 보관실 관리 표준
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}; text-align: center; color: #0f172a; word-break: keep-all;">
        <thead>
          <tr style="background: #dbeef4; font-weight: 800;">
            <th style="border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; width: 19%; white-space: nowrap;">구분</th>
            <th style="border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; width: 22%; white-space: nowrap;">유효기간</th>
            <th style="border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; width: 41%; white-space: nowrap;">관리 기준</th>
            <th style="border-bottom: 1px solid #1e293b; padding: ${cellPad}; width: 18%; white-space: nowrap;">비고</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #ffffff; font-weight: 700;">
            <td style="border-bottom: 1.5px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; line-height: 1.35; white-space: nowrap;">조인트<br/>고무</td>
            <td style="border-bottom: 1.5px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; color: #dc2626; font-weight: 800; white-space: nowrap;">10일 이내</td>
            <td style="border-bottom: 1.5px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; text-align: left; line-height: 1.45;">
              <div>온도 : 20 ± 5℃ <span style="font-size: 11px; color: #475569; font-weight: 600;">(15~25℃)</span></div>
              <div>습도 : 70% 이하</div>
            </td>
            <td style="border-bottom: 1.5px solid #1e293b; padding: ${cellPad}; font-weight: 800; white-space: nowrap;">1회/일</td>
          </tr>
        </tbody>
      </table>
      <div style="padding: ${compact ? '7px 10px' : '10px 12px'}; font-size: ${ruleFont}; line-height: 1.65; color: #0f172a; font-weight: 600; flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px; background: #fcfdfd; word-break: keep-all;">
        <div>1. 연고무 <strong style="color: #1d4ed8; font-weight: 800;">중량 표준</strong>에 따른 작업실시</div>
        <div>2. FMB <strong style="color: #dc2626; font-weight: 800;">유효기간 준수</strong> (미준수품 반납)</div>
        <div>3. 보관실 <strong style="color: #1d4ed8; font-weight: 800;">점검 주기는 1회/일</strong> (시업전)</div>
        <div>4. 온습도 유지를 위해 <strong style="color: #1d4ed8; font-weight: 800;">DOOR 상시 닫음</strong></div>
      </div>
    </div>
  `;
}

function buildRowHTML(item, idx) {
  const curType = item?.f9004_type || '';
  const curRubber = item?.f9004_rubberName ?? item?.f9004_carModel ?? '';
  const curExpiry = item?.f9004_expiryDate ?? item?.f9004_compoundLot ?? '';
  const expiryInputType = curExpiry && !/^\d{4}-\d{2}-\d{2}$/.test(curExpiry) ? 'text' : 'date';
  const typeOptions = F9004_IO_TYPES.map((tp) => (
    `<option value="${escapeHtml(tp)}" ${curType === tp ? 'selected' : ''}>${escapeHtml(tp)}</option>`
  )).join('');

  return `
    <tr data-f9004-row="${idx}">
      <td data-f9004-col="no" style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">${idx + 1}</td>
      <td style="border: 1px solid #000; padding: 5px;">
        <select id="f9004_type_${idx}" name="f9004_type_${idx}" data-f9004-field="type" class="form-control" style="font-size: 12px; padding: 4px; height: auto;">
          <option value="">선택</option>
          ${typeOptions}
        </select>
      </td>
      <td style="border: 1px solid #000; padding: 5px;">
        <input type="text" id="f9004_rubber_${idx}" name="f9004_rubber_${idx}" data-f9004-field="rubberName" data-wheel-skip="1" class="form-control" value="${escapeHtml(curRubber)}" placeholder="예: 조인트 고무" style="font-size: 12px; padding: 4px 6px; height: auto; width: 100%;" />
      </td>
      <td style="border: 1px solid #000; padding: 5px;">
        <input type="${expiryInputType}" max="9999-12-31" id="f9004_expiry_${idx}" name="f9004_expiry_${idx}" data-f9004-field="expiryDate" data-wheel-skip="1" class="form-control" value="${escapeHtml(curExpiry)}" style="font-size: 12px; padding: 4px 6px; height: auto; width: 100%; text-align: center;" />
      </td>
      <td style="border: 1px solid #000; padding: 5px;">
        <input type="text" id="f9004_qty_${idx}" name="f9004_qty_${idx}" data-f9004-field="amount" data-wheel-skip="1" class="form-control" value="${escapeHtml(item?.f9004_amount || '')}" placeholder="예: 200kg / 2PLT" style="font-size: 12px; padding: 4px 6px; height: auto; width: 100%; text-align: center;" />
      </td>
    </tr>
  `;
}

export function renderFmbPaperForm(container, existingData, loggedInWorkerName) {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const dateParts = (existingData?.date || todayStr).split('-');

  let defaultStartTime = '08:00';
  let defaultEndTime = '17:00';
  if (existingData?.workHours) {
    const times = existingData.workHours.split('~').map((t) => t.trim());
    if (times[0]) defaultStartTime = times[0];
    if (times[1]) defaultEndTime = times[1];
  }

  const envData = existingData?.f9004_env || {};
  const chkData = existingData?.f9004_checks || {};
  const savedItems = Array.isArray(existingData?.f9004_items) && existingData.f9004_items.length > 0
    ? existingData.f9004_items
    : [];
  const rowCount = Math.max(5, savedItems.length);
  const initialRows = Array.from({ length: rowCount }, (_, i) => savedItems[i] || {});
  const workDetails = existingData?.workDetails || '';

  container.innerHTML = `
    <div data-form-code="9004" class="paper-form-container" style="font-family: 'Noto Sans KR', sans-serif; color: #000; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 820px; margin: 0 auto;">
      <!-- 양식 상단 배지 -->
      <div style="background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(13,148,136,0.14)); border: 1px solid #10b981; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">🏷️</span>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #047857; margin-bottom: 4px;">
              양식 고유번호: #9004
            </div>
            <div style="font-size: 13px; color: #1e293b; font-weight: 600;">
              [공통] 공통 - FMB보관실 공정 전용 양식
            </div>
          </div>
        </div>
      </div>

      <!-- 종이양식 헤더 (상단 공통 카드와 병행 시 자동 숨김) -->
      <div data-f9004-paper-header="1" style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px; margin: 0;">FMB보관실 작업일보</h2>
        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 13px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 60px; background: #f1f5f9; font-weight: 700;">작성</td>
            <td style="border: 1px solid #000; width: 60px; background: #f1f5f9; font-weight: 700;">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 40px; vertical-align: middle; font-weight: 700;">${escapeHtml(loggedInWorkerName || '작업자')}</td>
            <td style="border: 1px solid #000; height: 40px;"></td>
          </tr>
        </table>
      </div>

      <!-- 동기화용 숨김 날짜·시간 필드 -->
      <div data-f9004-paper-date="1" style="display: none; margin-bottom: 14px;">
        <input type="hidden" id="f9004_year" value="${escapeHtml(dateParts[0]?.substring(2) || '26')}" />
        <input type="hidden" id="f9004_month" value="${escapeHtml(dateParts[1] || '01')}" />
        <input type="hidden" id="f9004_day" value="${escapeHtml(dateParts[2] || '01')}" />
        <input type="hidden" id="f9004_startTime" value="${escapeHtml(defaultStartTime)}" />
        <input type="hidden" id="f9004_endTime" value="${escapeHtml(defaultEndTime)}" />
      </div>

      <!-- 1. 보관실 온·습도 및 일일 관리 점검표 -->
      <div class="f9004-env-split-wrap" style="margin-bottom: 20px; container-type: inline-size;">
        <style>
          [data-form-code="9004"] .f9004-env-split-grid {
            display: grid;
            grid-template-columns: 1.12fr 1fr;
            gap: 12px;
            align-items: stretch;
            margin-bottom: 12px;
          }
          [data-form-code="9004"] .f9004-temp-hum-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          body.mobile-preview-mode [data-form-code="9004"] .f9004-env-split-grid {
            grid-template-columns: 1fr;
          }
          @container (max-width: 640px) {
            [data-form-code="9004"] .f9004-env-split-grid {
              grid-template-columns: 1fr;
            }
          }
          @container (max-width: 340px) {
            [data-form-code="9004"] .f9004-temp-hum-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 768px) {
            [data-form-code="9004"] .f9004-env-split-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">1. 보관실 온·습도 및 선입선출 일일 점검표</h3>

        <div class="f9004-env-split-grid">
          <!-- 좌측(모바일 상단): FMB 보관실 관리 표준 -->
          ${buildFmbStandardLeftBoxHTML(false)}

          <!-- 우측(모바일 하단): 당일 온·습도 기록 입력란 -->
          <div class="f9004-env-input-box" style="border: 1.5px solid #1e293b; border-radius: 6px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column; word-break: keep-all;">
            <div style="background: #eff6ff; border-bottom: 1.5px solid #1e293b; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 14px; font-weight: 800; color: #0f172a; white-space: nowrap;">🌡️💧 당일 온·습도 기록</span>
              <span id="f9004_envStatusBadge" style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; white-space: nowrap;">시업전 1회/일</span>
            </div>

            <div style="padding: 12px; background: #f8fafc; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
              <div class="f9004-temp-hum-grid">
                <div style="min-width: 0;">
                  <label for="f9004_temp" style="display: block; font-size: 12px; font-weight: 800; color: #b91c1c; margin-bottom: 4px; white-space: nowrap;">🌡️ 당일 온도 (℃)</label>
                  <div style="position: relative;">
                    <input type="text" inputmode="decimal" id="f9004_temp" name="f9004_temp" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_temp || '')}" placeholder="예: 24.8" style="font-size: 16px; padding: 8px 28px 8px 10px; height: auto; font-weight: 800; text-align: right; color: #0f172a; background: #ffffff; width: 100%;" />
                    <span style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 800; color: #64748b; pointer-events: none;">℃</span>
                  </div>
                  <div id="f9004_tempHint" style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 4px;">기준: 20 ± 5℃ (15~25℃)</div>
                </div>

                <div style="min-width: 0;">
                  <label for="f9004_humidity" style="display: block; font-size: 12px; font-weight: 800; color: #0369a1; margin-bottom: 4px; white-space: nowrap;">💧 당일 습도 (%)</label>
                  <div style="position: relative;">
                    <input type="text" inputmode="decimal" id="f9004_humidity" name="f9004_humidity" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_humidity || '')}" placeholder="예: 60.7" style="font-size: 16px; padding: 8px 26px 8px 10px; height: auto; font-weight: 800; text-align: right; color: #0f172a; background: #ffffff; width: 100%;" />
                    <span style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 800; color: #64748b; pointer-events: none;">%</span>
                  </div>
                  <div id="f9004_humHint" style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 4px;">기준: 70% 이하</div>
                </div>
              </div>

              <div style="padding-top: 8px; border-top: 1px dashed #cbd5e1;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
                  <label for="f9004_envNote" style="font-size: 11.5px; font-weight: 800; color: #334155; margin: 0; white-space: nowrap;">🕒 점검 시각 / 환경 비고</label>
                  <button type="button" id="f9004_btnStampPreShift" data-f9004-now-btn="1" style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; border: 1px solid #93c5fd; background: #eff6ff; color: #1d4ed8; cursor: pointer; white-space: nowrap; flex-shrink: 0;">시업전 시각 자동기입</button>
                </div>
                <input type="text" id="f9004_envNote" name="f9004_envNote" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_envNote || '')}" placeholder="예: 07:50 시업전 점검 정상" style="font-size: 13px; padding: 6px 8px; height: auto; background: #ffffff; width: 100%;" />
              </div>
            </div>
          </div>
        </div>

        <table class="data-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 50px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px;">점검 항목</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 130px;">상태 (양호/불량)</th>
            </tr>
          </thead>
          <tbody>
            ${F9004_CHECKLIST_ITEMS.map((item, idx) => {
              const rawVal = chkData[item.id] ?? (item.id === 'f9004_chk_mon' ? chkData.f9004_chk1 : undefined);
              const isGood = rawVal !== false;
              const refBadge = item.refNote
                ? ` <span style="display: inline-block; margin-left: 6px; padding: 1px 6px; font-size: 11px; font-weight: 700; color: #0369a1; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; vertical-align: middle;">${escapeHtml(item.refNote)}</span>`
                : '';
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">${idx + 1}</td>
                  <td style="border: 1px solid #000; font-weight: 600; padding: 6px;"><span>${escapeHtml(item.text)}</span>${refBadge}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 6px;">
                    <div style="display: flex; justify-content: center; gap: 10px;">
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="radio" name="${item.id}" value="true" ${isGood ? 'checked' : ''} />
                        양호
                      </label>
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; color: #dc2626;">
                        <input type="radio" name="${item.id}" value="false" ${!isGood ? 'checked' : ''} />
                        불량
                      </label>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2. 금일 FMB 입고·불출 및 작업 내역 -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
          <h3 style="font-size: 14px; font-weight: 800; color: #000; margin: 0;">2. 금일 입고 · 불출 및 재고 관리 내역</h3>
          <button type="button" id="f9004_btnAddRow" class="btn btn-secondary btn-sm" style="font-size: 12px; font-weight: 700; padding: 4px 10px;">
            ➕ 내역 행 추가
          </button>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse; min-width: 480px;">
            <thead>
              <tr style="background: #f1f5f9; color: #000;">
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 42px; white-space: nowrap;">No</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 115px; white-space: nowrap;">구분</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; white-space: nowrap;">고무명</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 155px; white-space: nowrap;">유효기간</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 130px; white-space: nowrap;">수량</th>
              </tr>
            </thead>
            <tbody id="f9004_tbody">
              ${initialRows.map((item, idx) => buildRowHTML(item, idx)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. 특이사항 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">3. 금일 주요 작업 내용 및 특이사항</h3>
        <textarea id="f9004_workDetails" name="f9004_workDetails" class="form-control" rows="3" placeholder="유효기간 임박 원재료 현황, 항온항습 특이사항, 교대 전달사항 등을 입력하세요." style="font-size: 13px; resize: vertical; width: 100%; border: 1px solid #000; border-radius: 4px; padding: 8px;">${escapeHtml(workDetails)}</textarea>
      </div>

      <!-- 하단 저장·제출 버튼 -->
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
        <button type="button" id="f9004_btnDraftSave" class="btn btn-secondary" style="font-weight: 700; min-width: 120px;">
          📁 중간 저장
        </button>
        <button type="button" id="f9004_btnFinalSubmit" class="btn btn-primary" style="font-weight: 700; min-width: 120px;">
          ✅ 제출 (승인 대기)
        </button>
      </div>
    </div>
  `;

  const root = container.querySelector('[data-form-code="9004"]');
  if (!root) return;

  const tbody = root.querySelector('#f9004_tbody');
  const btnAddRow = root.querySelector('#f9004_btnAddRow');
  const btnDraftSave = root.querySelector('#f9004_btnDraftSave');
  const btnFinalSubmit = root.querySelector('#f9004_btnFinalSubmit');
  const tempInput = root.querySelector('#f9004_temp');
  const humInput = root.querySelector('#f9004_humidity');
  const envNoteInput = root.querySelector('#f9004_envNote');
  const tempHint = root.querySelector('#f9004_tempHint');
  const humHint = root.querySelector('#f9004_humHint');
  const envStatusBadge = root.querySelector('#f9004_envStatusBadge');
  const btnStampPreShift = root.querySelector('#f9004_btnStampPreShift');

  const setTranslatableText = (el, koText) => {
    if (!el) return;
    const doc = el.ownerDocument || document;
    el.replaceChildren(doc.createTextNode(koText));
    i18n.applyTranslations(el);
  };

  const updateEnvSpecFeedback = () => {
    const { tempOk, humOk } = evaluateF9004EnvSpec(tempInput?.value, humInput?.value);

    if (tempInput && tempHint) {
      if (tempOk === null) {
        tempInput.style.borderColor = '';
        tempHint.style.color = '#64748b';
        setTranslatableText(tempHint, '기준: 20 ± 5℃ (15~25℃)');
      } else if (tempOk) {
        tempInput.style.borderColor = '#10b981';
        tempHint.style.color = '#059669';
        setTranslatableText(tempHint, '적합 (15~25℃ 이내)');
      } else {
        tempInput.style.borderColor = '#ef4444';
        tempHint.style.color = '#dc2626';
        setTranslatableText(tempHint, '기준 이탈! (15~25℃)');
      }
    }

    if (humInput && humHint) {
      if (humOk === null) {
        humInput.style.borderColor = '';
        humHint.style.color = '#64748b';
        setTranslatableText(humHint, '기준: 70% 이하');
      } else if (humOk) {
        humInput.style.borderColor = '#10b981';
        humHint.style.color = '#059669';
        setTranslatableText(humHint, '적합 (70% 이하)');
      } else {
        humInput.style.borderColor = '#ef4444';
        humHint.style.color = '#dc2626';
        setTranslatableText(humHint, '기준 이탈! (70% 이하)');
      }
    }

    if (envStatusBadge) {
      if (tempOk === false || humOk === false) {
        envStatusBadge.style.background = '#fef2f2';
        envStatusBadge.style.color = '#dc2626';
        envStatusBadge.style.borderColor = '#fca5a5';
        setTranslatableText(envStatusBadge, '⚠️ 관리기준 이탈');
      } else if (tempOk === true && humOk === true) {
        envStatusBadge.style.background = '#ecfdf5';
        envStatusBadge.style.color = '#047857';
        envStatusBadge.style.borderColor = '#6ee7b7';
        setTranslatableText(envStatusBadge, '✅ 관리기준 적합');
      } else {
        envStatusBadge.style.background = '#e2e8f0';
        envStatusBadge.style.color = '#334155';
        envStatusBadge.style.borderColor = '#cbd5e1';
        setTranslatableText(envStatusBadge, '시업전 1회/일');
      }
    }
  };

  if (tempInput) tempInput.addEventListener('input', updateEnvSpecFeedback);
  if (humInput) humInput.addEventListener('input', updateEnvSpecFeedback);

  if (btnStampPreShift && envNoteInput) {
    btnStampPreShift.addEventListener('click', () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      envNoteInput.value = `${hh}:${mi} 시업전 점검`;
      envNoteInput.focus();
    });
  }

  if (btnAddRow && tbody) {
    btnAddRow.addEventListener('click', () => {
      const nextIdx = tbody.querySelectorAll('tr[data-f9004-row]').length;
      tbody.insertAdjacentHTML('beforeend', buildRowHTML({}, nextIdx));
      i18n.applyTranslations(tbody);
    });
  }

  i18n.applyTranslations(root);
  updateEnvSpecFeedback();

  const processFmbSave = (targetStatus) => {
    try {
      const yy = root.querySelector('#f9004_year')?.value || dateParts[0].substring(2);
      const mm = root.querySelector('#f9004_month')?.value || dateParts[1];
      const dd = root.querySelector('#f9004_day')?.value || dateParts[2];
      let fullDate = `20${yy}-${mm}-${dd}`;

      const formRoot = container.closest('form, [id="mobileWorkReportForm"]')?.parentElement || container.closest('[data-form-root]');
      const reportDateInput = formRoot?.querySelector('#reportDate')?.value;
      if (reportDateInput) fullDate = reportDateInput;

      const stFromOuter = formRoot?.querySelector('#startTimeInput')?.value;
      const etFromOuter = formRoot?.querySelector('#endTimeInput')?.value;
      const st = stFromOuter || root.querySelector('#f9004_startTime')?.value || '08:00';
      const et = etFromOuter || root.querySelector('#f9004_endTime')?.value || '17:00';
      const workHours = `${st} ~ ${et}`;

      const f9004_env = {
        f9004_temp: (root.querySelector('#f9004_temp')?.value || '').trim(),
        f9004_humidity: (root.querySelector('#f9004_humidity')?.value || '').trim(),
        f9004_envNote: (root.querySelector('#f9004_envNote')?.value || '').trim()
      };

      const f9004_checks = {};
      F9004_CHECKLIST_ITEMS.forEach((item) => {
        const checked = root.querySelector(`input[name="${item.id}"]:checked`);
        f9004_checks[item.id] = checked ? checked.value === 'true' : true;
      });

      const f9004_items = [];
      root.querySelectorAll('tr[data-f9004-row]').forEach((tr) => {
        const f9004_type = (tr.querySelector('[data-f9004-field="type"]')?.value || '').trim();
        const f9004_rubberName = (tr.querySelector('[data-f9004-field="rubberName"]')?.value || '').trim();
        const f9004_expiryDate = (tr.querySelector('[data-f9004-field="expiryDate"]')?.value || '').trim();
        const f9004_amount = (tr.querySelector('[data-f9004-field="amount"]')?.value || '').trim();
        if (f9004_type || f9004_rubberName || f9004_expiryDate || f9004_amount) {
          f9004_items.push({
            f9004_type,
            f9004_rubberName,
            f9004_expiryDate,
            f9004_amount
          });
        }
      });

      const workDetailsText = root.querySelector('#f9004_workDetails')?.value || '';
      const currentUserRole = store.getUserRole();
      const currentWorkerName = existingData?.workerName || currentUserRole?.workerName || loggedInWorkerName || '작업자';

      const reportData = {
        date: fullDate,
        workHours,
        shift: '주간',
        carModel: '공통',
        processName: 'FMB보관실',
        line: '1라인',
        workerName: currentWorkerName,
        workerId: existingData?.workerId || 'EMP001',
        itemCode: '공통',
        itemName: '공통',
        targetQty: 0,
        actualQty: 0,
        defectQty: 0,
        isFmbForm: true,
        formCode: 9004,
        f9004_env,
        f9004_checks,
        f9004_items,
        workDetails: workDetailsText,
        status: targetStatus,
        notes: targetStatus === '임시저장'
          ? `[FMB보관실] ${currentWorkerName} 중간 저장 (${workHours}).`
          : `[FMB보관실] ${currentWorkerName} 작성 완료 (${workHours}).`
      };

      if (existingData?.id) {
        store.updateReport(existingData.id, reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 작업일보가 중간 저장되었습니다.', 'info');
        } else {
          windowMock.showToast('✅ 작업일보가 등록 완료되었습니다.', 'success');
        }
      } else {
        store.addReport(reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 FMB보관실 작업일보 중간 저장 성공!', 'info');
        } else {
          windowMock.showToast('✅ FMB보관실 작업일보 등록 완료 성공!', 'success');
        }
      }

      if (windowMock.appInstance) {
        if (targetStatus === '임시저장') return;
        const userRoleInfo = store.getUserRole();
        if (userRoleInfo && userRoleInfo.role === 'worker') {
          windowMock.appInstance.switchTab('drafts');
        } else {
          windowMock.appInstance.switchTab('reports');
        }
      }
    } catch (err) {
      console.error('Error saving FMB storage report:', err);
      windowMock.showToast(`⚠️ 저장 중 오류가 발생했습니다: ${err.message}`, 'error');
    }
  };

  if (btnDraftSave) {
    btnDraftSave.addEventListener('click', () => processFmbSave('임시저장'));
  }
  if (btnFinalSubmit) {
    btnFinalSubmit.addEventListener('click', () => processFmbSave('승인 대기'));
  }
}

export function mountF9004InReportForm(container, existingData, loggedInWorkerName) {
  ['#leaderFormContainer', '#forkliftFormContainer', '#supportFormContainer'].forEach((sel) => {
    const el = container.querySelector(sel);
    if (el) el.style.display = 'none';
  });

  const hideOtherFixedBars = () => {
    ['standardFixedActionBar', 'leaderFixedActionBar', 'forkliftFixedActionBar'].forEach((barId) => {
      const barEl = document.getElementById(barId);
      if (barEl) barEl.style.display = 'none';
    });
  };
  hideOtherFixedBars();
  setTimeout(hideOtherFixedBars, 50);

  let fmbContainer = container.querySelector('#f9004FormContainer');
  if (!fmbContainer) {
    fmbContainer = document.createElement('div');
    fmbContainer.id = 'f9004FormContainer';
    const formEl = container.querySelector('#mobileWorkReportForm') || container;
    formEl.appendChild(fmbContainer);
  }
  if (fmbContainer._syncAbort) {
    fmbContainer._syncAbort.abort();
    fmbContainer._syncAbort = null;
  }
  fmbContainer.style.display = 'block';

  renderFmbPaperForm(fmbContainer, existingData, loggedInWorkerName);

  const paperHeader = fmbContainer.querySelector('[data-f9004-paper-header="1"]');
  if (paperHeader) paperHeader.style.display = 'none';

  const syncAbort = new AbortController();
  const syncDate = (val) => {
    const parts = String(val || '').split('-');
    if (parts.length === 3) {
      const fy = fmbContainer.querySelector('#f9004_year');
      const fm = fmbContainer.querySelector('#f9004_month');
      const fd = fmbContainer.querySelector('#f9004_day');
      if (fy) fy.value = parts[0].substring(2);
      if (fm) fm.value = parts[1];
      if (fd) fd.value = parts[2];
    }
  };

  const reportDate = container.querySelector('#reportDate');
  if (reportDate) {
    syncDate(reportDate.value);
    reportDate.addEventListener('change', (e) => syncDate(e.target.value), { signal: syncAbort.signal });
  }
  const stInput = container.querySelector('#startTimeInput');
  if (stInput) {
    const fSt = fmbContainer.querySelector('#f9004_startTime');
    if (fSt) {
      fSt.value = stInput.value;
      stInput.addEventListener('change', (e) => { fSt.value = e.target.value; }, { signal: syncAbort.signal });
    }
  }
  const etInput = container.querySelector('#endTimeInput');
  if (etInput) {
    const fEt = fmbContainer.querySelector('#f9004_endTime');
    if (fEt) {
      fEt.value = etInput.value;
      etInput.addEventListener('change', (e) => { fEt.value = e.target.value; }, { signal: syncAbort.signal });
    }
  }
  fmbContainer._syncAbort = syncAbort;
}

export function buildFmbDetailHTML(r) {
  const env = r?.f9004_env || {};
  const chkData = r?.f9004_checks || {};
  const items = Array.isArray(r?.f9004_items) ? r.f9004_items : [];
  const rowCount = Math.max(5, items.length);
  const statusClass = r?.status === '승인 완료' ? 'approved' : r?.status === '반려' ? 'rejected' : 'pending';

  return `
    <div class="print-report-sheet" data-form-code="9004" style="font-family: 'Noto Sans KR', sans-serif; color: #000; padding: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px; margin: 0;">FMB보관실 작업일보</h2>
          <div style="font-size: 13px; color: #475569; margin-top: 2px;">일보ID: ${escapeHtml(r?.id || '')} | 작성자: ${escapeHtml(r?.workerName || '')}</div>
        </div>
        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 13px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">작성</td>
            <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 35px; vertical-align: middle; font-weight: 700;">${escapeHtml(r?.workerName || '')}</td>
            <td style="border: 1px solid #000; height: 35px; vertical-align: middle;">${escapeHtml(r?.approver || '생산부장')}</td>
          </tr>
        </table>
      </div>

      <div style="background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(13,148,136,0.14)); border: 1px solid #10b981; border-radius: 3px; padding: 4px 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 13px;">🏷️</span>
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #047857;">
              양식 고유번호: #${escapeHtml(r?.formCode || 9004)}
            </div>
            <div style="font-size: 13px; color: #1e293b; font-weight: 600;">
              [공통] 공통 - FMB보관실 공정 전용 양식
            </div>
          </div>
        </div>
        <span class="status-badge ${statusClass}" style="font-size: 13px; font-weight: 700;">
          ${escapeHtml(r?.status || '')}
        </span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <div>작성일 : ${escapeHtml(r?.date || '')}</div>
        <div>근무시간 : ${escapeHtml(r?.workHours || '08:00 ~ 17:00')}</div>
      </div>

      <div style="margin-bottom: 14px; container-type: inline-size;">
        <style>
          [data-form-code="9004"] .f9004-detail-split-grid {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            gap: 10px;
            align-items: stretch;
            margin-bottom: 8px;
          }
          @media screen {
            body.mobile-preview-mode [data-form-code="9004"] .f9004-detail-split-grid {
              grid-template-columns: 1fr;
            }
            @container (max-width: 640px) {
              [data-form-code="9004"] .f9004-detail-split-grid {
                grid-template-columns: 1fr;
              }
            }
            @media (max-width: 768px) {
              [data-form-code="9004"] .f9004-detail-split-grid {
                grid-template-columns: 1fr;
              }
            }
          }
        </style>
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 6px;">1. 보관실 온·습도 및 선입선출 일일 점검표</div>
        ${(() => {
          const { tempOk, humOk } = evaluateF9004EnvSpec(env.f9004_temp, env.f9004_humidity);
          const judgeText = (tempOk === false || humOk === false)
            ? '관리기준 이탈'
            : (tempOk === true && humOk === true)
              ? '관리기준 적합'
              : '미입력';
          const judgeColor = (tempOk === false || humOk === false)
            ? '#dc2626'
            : (tempOk === true && humOk === true)
              ? '#059669'
              : '#64748b';
          return `
            <div class="f9004-detail-split-grid">
              ${buildFmbStandardLeftBoxHTML(true)}
              <div style="border: 1.5px solid #1e293b; border-radius: 6px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
                <div style="background: #eff6ff; border-bottom: 1.5px solid #1e293b; padding: 6px 10px; text-align: center; font-size: 13px; font-weight: 800; color: #0f172a;">
                  당일 온·습도 기록
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; flex: 1;">
                  <tbody>
                    <tr>
                      <th style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; background: #fef2f2; color: #991b1b; padding: 6px 8px; width: 38%; text-align: left;">당일 온도 (℃)</th>
                      <td style="border-bottom: 1px solid #cbd5e1; padding: 6px 10px; font-size: 14px; font-weight: 800; color: ${tempOk === false ? '#dc2626' : '#0f172a'};">
                        ${escapeHtml(env.f9004_temp ? `${env.f9004_temp} ℃` : '-')}
                      </td>
                    </tr>
                    <tr>
                      <th style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; background: #f0f9ff; color: #075985; padding: 6px 8px; text-align: left;">당일 습도 (%)</th>
                      <td style="border-bottom: 1px solid #cbd5e1; padding: 6px 10px; font-size: 14px; font-weight: 800; color: ${humOk === false ? '#dc2626' : '#0f172a'};">
                        ${escapeHtml(env.f9004_humidity ? `${env.f9004_humidity} %` : '-')}
                      </td>
                    </tr>
                    <tr>
                      <th style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; background: #f8fafc; color: #334155; padding: 6px 8px; text-align: left;">기준 판정</th>
                      <td style="border-bottom: 1px solid #cbd5e1; padding: 6px 10px; font-weight: 800; color: ${judgeColor};">${judgeText}</td>
                    </tr>
                    <tr>
                      <th style="border-right: 1px solid #cbd5e1; background: #f8fafc; color: #334155; padding: 6px 8px; text-align: left;">점검 시각 / 비고</th>
                      <td style="padding: 6px 10px; font-weight: 600; color: #334155;">${escapeHtml(env.f9004_envNote || '-')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `;
        })()}
        <table class="data-table print-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 45px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px;">점검 항목</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 100px;">상태</th>
            </tr>
          </thead>
          <tbody>
            ${((('f9004_chk1' in chkData) && !('f9004_chk_mon' in chkData)) ? F9004_LEGACY_CHECKLIST_ITEMS : F9004_CHECKLIST_ITEMS).map((item, idx) => {
              const isGood = chkData[item.id] !== false;
              const refBadge = item.refNote
                ? ` <span style="display: inline-block; margin-left: 6px; padding: 1px 6px; font-size: 10.5px; font-weight: 700; color: #0369a1; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; vertical-align: middle;">${escapeHtml(item.refNote)}</span>`
                : '';
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 700;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 4px; font-weight: 600;"><span>${escapeHtml(item.text)}</span>${refBadge}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 800; color: ${isGood ? '#059669' : '#dc2626'};">
                    ${isGood ? '양호 (O)' : '불량 (X)'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">2. 금일 입고 · 불출 및 재고 관리 내역</div>
        <table class="data-table print-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 42px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 105px;">구분</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px;">고무명</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 145px;">유효기간</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 120px;">수량</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: rowCount }, (_, idx) => {
              const row = items[idx] || {};
              const rubberName = row.f9004_rubberName ?? row.f9004_carModel ?? '';
              const expiryDate = row.f9004_expiryDate ?? row.f9004_compoundLot ?? '';
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 700;">${idx + 1}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px;">${escapeHtml(row.f9004_type || '')}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px;">${escapeHtml(rubberName)}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px;">${escapeHtml(expiryDate)}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px;">${escapeHtml(row.f9004_amount || '')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">3. 금일 주요 작업 내용 및 특이사항</div>
        <div style="border: 1px solid #000; padding: 10px; min-height: 90px; font-size: 12px; white-space: pre-wrap;">${escapeHtml(r?.workDetails || '입력된 내용 없음')}</div>
      </div>
    </div>
  `;
}
