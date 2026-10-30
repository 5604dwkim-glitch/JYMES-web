# JYMES Project Architecture Rules

## ⚠️ 핵심 구조적 한계 (Critical Structural Limitation)
이 프로젝트는 React 컴포넌트 내부에 거대한 바닐라 HTML 문자열을 렌더링하고(`Section5Renderer.js`), 이를 최상단 부모 컴포넌트(`LegacyFormWrapper.jsx`)가 `querySelectorAll`과 `startsWith` 같은 광범위하고 모호한 DOM 셀렉터로 전체 스캔하여 이벤트를 강제 바인딩하는 구형(Legacy) 구조를 가지고 있습니다.
이로 인해 홈페이지 레이아웃, CSS 클래스, 또는 DOM 태그 구조를 아주 조금만 변경해도, 기존에 정상 작동하던 다른 일보 양식들의 치수 입력칸이나 팝업이 심각하게 망가지는 **사이드 이펙트(Side-effect)**가 상시 발생할 위험이 있습니다.

## 🛠️ 작업 시 필수 준수 사항 (Mandatory Guidelines for AI)

AI 에이전트(Antigravity)는 이 프로젝트에서 코드를 수정하거나 기능을 추가할 때 **반드시 아래의 모든 원칙(1~16)을 최우선으로 준수**해야 합니다.
> 최상위 목표: **각 양식(일보)을 수정·추가하거나 새 순번의 양식을 추가해도, 기존 양식은 절대 영향을 받지 않아야 한다.**

1. **절대 기존의 광범위 셀렉터(Global Selector)에 의존 금지**: 
   새로운 치수 항목이나 팝업 기능을 추가할 때, `LegacyFormWrapper`의 `id.startsWith('dim_')` 같은 뭉뚱그려진 조건문에 묻어가려고 하지 마세요. 레이아웃이 변하면 바로 고장납니다.
2. **독립적인 데이터 속성(`data-*`) 명찰 사용 (격리 코딩)**:
   치수 양식이나 입력칸의 규격, 동작을 지정할 때는 반드시 HTML 태그 안에 `data-wheel-parsed-spec="745"`와 같이 **명시적인 커스텀 속성**을 직접 부여하세요. 컴포넌트의 위치나 부모 태그가 바뀌더라도 자기 자신의 속성값만 보고 독립적으로 안전하게 작동해야 합니다.
3. **DOM 구조 변경 시 샌드박싱(Sandboxing)**:
   새로운 버튼, 메뉴, 혹은 뷰포트를 추가할 때, 기존의 테이블 구조나 공통 CSS 클래스를 덮어쓰거나 훼손하지 않도록 각별히 주의하세요. 철저히 격리된 `div`를 사용해야 합니다.
4. **점진적 리팩토링 (Boy Scout Rule)**:
   특정 양식(예: 1001번)에 버그가 접수되어 코드를 수정하게 된다면, 해당 양식의 코드 블록만큼은 기존의 낡은 스캔 방식에서 벗어나 명시적인 `data-*` 속성 방식으로 고쳐서, 훗날 다른 양식과 간섭이 일어나지 않도록 **방어 코드**를 세워두세요.
5. **관심사 분리 및 거대 컴포넌트 분할 (Separation of Concerns)**:
   거대한 폼 코드 매핑(`FORM_CODE_MAP`) 등 정적 데이터와 설정값은 UI 컴포넌트 내부에 하드코딩하지 말고 반드시 `src/constants/` 내부의 전용 파일에서 관리하세요. 또한 `LegacyFormWrapper.jsx` 같은 비대한 컴포넌트를 유지보수할 기회가 생기면, 렌더링 블록을 독립적인 리액트 하위 컴포넌트로 잘게 쪼개는 작업을 점진적으로 병행하세요.
6. **임시 스크립트 중앙 관리 (Script Management)**:
   데이터베이스 마이그레이션이나 일회성 땜질을 위해 작성된 패치 스크립트(`.cjs`, `.mjs`)를 프로젝트 루트 디렉토리에 방치하지 마세요. 작성된 스크립트는 역할에 따라 반드시 `scripts/archive/` 또는 `scripts/utils/` 폴더 내부에 위치시켜 프로젝트의 최상단 구조를 깨끗하게 유지하세요.

7. **불필요한 승인 요청 최소화 (Minimize Authorization Requests)**:
   사용자가 명확한 작업 지시를 내렸다면, Planning Mode나 중간 확인 절차로 인해 작업 흐름이 끊기지 않도록 불필요한 계획 승인 요청을 최소화하고 즉시 코드를 수정 및 실행하세요.

---

## 🧱 양식 간 간섭 차단 원칙 (Form Isolation Rules)

8. **양식별 코드 격리 (Form Module Isolation)**:
   새 양식(새 순번)을 추가할 때 `Section5Renderer.js` / `QtySectionRenderer.js` / `LegacyFormWrapper.jsx`에 `else if (formCode === XXXX)` 분기를 계속 덧붙이지 마세요. 새 양식의 렌더링·계산 로직은 `src/components/DynamicForms/forms/f{코드}/` 형태의 **전용 파일**에 작성하고, 공통 렌더러에서는 한 줄 위임(호출)만 하세요.
   - 양식 코드 매핑은 현재 `src/constants/formMappings.js`(입력 화면용)와 `src/constants/formCodes.js`(배지·금형관리용) **두 곳에 중복**되어 있습니다. 새 양식 추가 시 **양쪽 모두 등록**하고, 이후 리팩토링 기회가 생기면 단일 소스로 통합하세요.

9. **공유 분기 분리 후 수정 (Copy-on-Modify)**:
   `formCode === 4011 || formCode === 4014`처럼 여러 양식이 함께 쓰는 분기에서 **한 양식만** 바꿔야 한다면, 공유 블록을 직접 고치지 마세요. 해당 양식을 조건에서 빼내 별도 블록으로 복제한 뒤 수정해야 나머지 양식이 보호됩니다. 반대로 새 양식을 기존 OR 조건이나 `[...].includes(formCode)` 목록에 끼워 넣는 것도 금지합니다.

10. **ID·저장 키 네임스페이스 (ID Prefix Rule)**:
    새로 만드는 입력칸의 `id`/`name`/저장 키는 반드시 **`f{코드}_`** 접두사로 시작하세요. (예: `f5001_od_1`)
    기존 광범위 접두사 `dim_`, `qty_`, `qtyd_`, `def_`, `lotNo_`, `dtc_`, `dtcb_`, `vulc_` 등으로 시작하면 `LegacyFormWrapper`의 `startsWith` 스캔에 자동으로 걸려 의도하지 않은 계산·저장·이벤트 로직이 적용됩니다. 새 접두사를 만들기 전에 반드시 `startsWith('` 로 전역 검색하여 충돌 여부를 확인하세요.

11. **저장 데이터 하위 호환 (Backward-Compatible Data)**:
    Firestore에 이미 저장된 일보의 필드명·키 구조를 **변경·삭제하지 마세요.** (과거 일보 조회, 통계, 엑셀이 깨집니다.) 구조 변경이 필요하면 **새 필드를 추가**하고, 읽는 쪽에서는 `새필드 ?? 옛필드` 형태의 fallback으로 처리하세요. 일괄 변환이 불가피하면 마이그레이션 스크립트를 `scripts/archive/`에 남기세요.

12. **CSS 스코프 한정 (Scoped CSS)**:
    양식 전용 스타일은 `[data-form-code="1001"] .xxx` 처럼 해당 양식 루트로 범위를 한정하거나 인라인 스타일을 사용하세요. `src/index.css`에 `table`, `td`, `th`, `input`, `select` 같은 **전역 태그 셀렉터를 추가·수정하는 것을 금지**합니다. 공통 클래스(`.card`, `.form-control`, `.touch-chip` 등)의 기존 정의도 수정하지 마세요.

13. **이벤트 바인딩 범위·해제 (Scoped Event Binding)**:
    양식 전용 이벤트는 `document`나 `container` 전체가 아니라 **해당 양식 루트 요소 내부**에서만 `querySelector` 하세요. React 쪽에서 붙인 리스너는 `useEffect` cleanup으로 해제하고, 재렌더 시 중복 바인딩되지 않도록 `data-bound="1"` 같은 표식을 확인하세요.

14. **사전 영향 분석 및 결과 보고 (Impact Analysis & Report)**:
    수정 전에 변경하려는 함수·셀렉터·ID 접두사·저장 키가 **어떤 양식 코드에서 사용되는지** 전역 검색으로 먼저 확인하세요. 작업 완료 보고 시에는 반드시 다음을 명시합니다.
    - 의도적으로 변경된 양식 코드
    - 영향이 없음을 확인한 양식 (스냅샷 검증 결과 포함)

15. **회귀 검증 필수 (Golden-Master Snapshot Test)**:
    양식 관련 코드를 수정한 뒤에는 반드시 아래 순서로 검증하세요.
    1. `npm run test:forms` — 전체 양식의 렌더링 HTML을 `tests/form-snapshots/{코드}.html` 기준선과 비교합니다. **수정 대상이 아닌 양식의 결과가 바뀌면 작업을 멈추고 원인을 해결**해야 합니다.
    2. 의도한 양식만 변경되었음을 확인한 뒤 `npm run test:forms:update -- {코드}` 로 **해당 양식의 기준선만** 갱신하세요. (코드 없이 전체 갱신하는 것은 기준선 최초 생성 때만 허용)
    3. 새 양식 추가 시 위 명령으로 신규 기준선이 자동 생성되며, 기존 양식은 전부 "변경 없음"이어야 합니다.
    4. `npm run lint` 및 `npm run build` 통과를 확인하세요.
    - 검증 도구: `scripts/utils/form-snapshot.mjs` (9xxx 반장·지게차·지원 양식은 별도 렌더러이므로 대상 외 — 수동 확인)

16. **입력 화면 외 연동 경로 확인 (Downstream Consumers)**:
    일보 데이터는 입력 화면 외에도 다음 경로에서 소비됩니다. 저장 키나 데이터 구조를 건드렸다면 해당 경로도 반드시 확인하세요.
    - 상세 조회: `LegacyDetailModal.jsx` / 목록: `ReportList.jsx`
    - 대시보드·분석: `Dashboard.jsx`, `LegacyDashboardWrapper.jsx`, `LegacyAnalyticsWrapper.jsx`, `LeaderMonthlyDashboard.jsx`
    - 통계 집계: `src/services/statsAggregator.js` / 저장: `src/services/firestore.js`
    - 엑셀·인쇄: `src/utils/qPointExcelExport.js`, `src/utils/printWorker.jsx`

---

## ✅ 새 양식(순번) 추가 체크리스트

- [ ] `formMappings.js`와 `formCodes.js` 양쪽에 코드 등록 (원칙 8)
- [ ] 로직은 `forms/f{코드}/` 전용 파일에 작성, 기존 OR 조건·공유 블록에 끼워 넣지 않음 (원칙 8·9)
- [ ] 모든 새 ID·저장 키는 `f{코드}_` 접두사 사용, 기존 접두사와 충돌 없음 확인 (원칙 10)
- [ ] 동작 지정은 `data-*` 속성으로, CSS는 `[data-form-code]` 범위로 한정 (원칙 2·12)
- [ ] `npm run test:forms` 결과 기존 양식 전부 "변경 없음" (원칙 15)
- [ ] 상세조회·통계·엑셀·인쇄에서 새 양식 데이터 표시 확인 (원칙 16)
- [ ] 완료 보고에 영향 양식 / 무영향 확인 양식 명시 (원칙 14)
