import { store } from './LegacyFormWrapper.jsx';

  export function getDtCrewQtyHTML(ed, container) {
    const carName = container.querySelector('#carModelValue')?.value || 'DT CREW';
    const g = (id) => ed?.dtCrewQty?.[id] || '';
    const gb = (id) => ed?.dtCrewQtyB?.[id] || '';
    const isQuad = (carName === 'DT QUAD');
    const totalLenSpec = isQuad ? '509±5mm' : '779±5mm';
    return `
      <!-- 6. 치수확인 카드 -->
      <div class="card">
        <label style="font-size: 14px; font-weight: 800; color: var(--accent-blue); margin-bottom: 14px; display: block;">
          📐 <span class="sec-num"></span> 치수확인
        </label>

        <!-- <span class="sec-num"></span> ${carName} 'A' 클립머신 치수 -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--accent-blue);">
              🔹 A. ${carName} \'A\' 클립머신
            </span>
            <span style="font-size: 11px; background: rgba(217,119,6,0.12); color: var(--accent-blue); padding: 3px 8px; border-radius: 4px; font-weight: 700;">
              📋 치수 검사 (1호기)
            </span>
          </div>

          <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 8px; background: #ffffff;">
            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">
              <colgroup>
                <col style="width:22%">
                <col style="width:19.5%"><col style="width:19.5%">
                <col style="width:19.5%"><col style="width:19.5%">
              </colgroup>
              <thead>
                <tr>
                  <th style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-main); padding:8px 4px; font-weight:800;">구분</th>
                  <th colspan="2" style="border:1px solid var(--border-color); background:rgba(2,132,199,0.08); color: var(--accent-blue); padding:8px 4px; font-weight:800;">LH</th>
                  <th colspan="2" style="border:1px solid var(--border-color); background:rgba(5,150,105,0.08); color: var(--accent-blue); padding:8px 4px; font-weight:800;">RH</th>
                </tr>
              </thead>
              <tbody>
                <!-- 전장길이 -->
                <tr>
                  <td rowspan="4" style="border:1px solid var(--border-color); background:#f1f5f9; color:var(--text-main); font-weight:800; vertical-align:middle; padding:6px 4px;">전장길이</td>
                  <td colspan="4" style="border:1px solid var(--border-color); background:#fef3c7; color:#92400e; font-weight:800; padding:6px; font-size:12px;">${totalLenSpec}</td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">초 (LH)</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_LH_초" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="${g('len_LH_초')}"></td>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">초 (RH)</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_RH_초" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="${g('len_RH_초')}"></td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">중 (LH)</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_LH_중" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="${g('len_LH_중')}"></td>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">중 (RH)</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_RH_중" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="${g('len_RH_중')}"></td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">종 (LH)</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_LH_종" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="${g('len_LH_종')}"></td>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">종 (RH)</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_RH_종" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="${g('len_RH_종')}"></td>
                </tr>

                <!-- 끝단 클립 -->
                <tr>
                  <td rowspan="4" style="border:1px solid var(--border-color); background:#f1f5f9; color:var(--text-main); font-weight:800; vertical-align:middle; padding:6px 4px;">끝단 클립</td>
                  <td style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-weight:700; padding:5px 2px; font-size:11px;">121±1</td>
                  <td style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-weight:700; padding:5px 2px; font-size:11px;">28±1</td>
                  <td style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-weight:700; padding:5px 2px; font-size:11px;">28±1</td>
                  <td style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-weight:700; padding:5px 2px; font-size:11px;">121±1</td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH1_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="초" value="${g('clip_LH1_초')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH2_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="초" value="${g('clip_LH2_초')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH1_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="초" value="${g('clip_RH1_초')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH2_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="초" value="${g('clip_RH2_초')}"></td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH1_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="중" value="${g('clip_LH1_중')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH2_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="중" value="${g('clip_LH2_중')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH1_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="중" value="${g('clip_RH1_중')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH2_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="중" value="${g('clip_RH2_중')}"></td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH1_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="종" value="${g('clip_LH1_종')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH2_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="종" value="${g('clip_LH2_종')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH1_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="종" value="${g('clip_RH1_종')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH2_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="종" value="${g('clip_RH2_종')}"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- <span class="sec-num"></span> ${carName} 'B' 클립머신 치수 -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--accent-purple);">
              🔹 B. ${carName} \'B\' 클립머신
            </span>
            <span style="font-size: 11px; background: rgba(124,58,237,0.12); color: var(--accent-purple); padding: 3px 8px; border-radius: 4px; font-weight: 700;">
              📋 치수 검사 (${carName} 'B')
            </span>
          </div>

          <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 8px; background: #ffffff;">
            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">
              <colgroup>
                ${isQuad ? `
                  <col style="width:34%">
                  <col style="width:33%"><col style="width:33%">
                ` : `
                  <col style="width:20%">
                  <col style="width:20%"><col style="width:20%">
                  <col style="width:20%"><col style="width:20%">
                `}
              </colgroup>
              <thead>
                <tr>
                  <th rowspan="2" style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-main); padding:8px 4px; font-weight:800; vertical-align:middle;">구분</th>
                  <th colspan="${isQuad ? '1' : '2'}" style="border:1px solid var(--border-color); background:rgba(2,132,199,0.08); color: var(--accent-blue); padding:6px 4px; font-weight:800;">LH</th>
                  <th colspan="${isQuad ? '1' : '2'}" style="border:1px solid var(--border-color); background:rgba(5,150,105,0.08); color: var(--accent-blue); padding:6px 4px; font-weight:800;">RH</th>
                </tr>
                <tr>
                  <th style="border:1px solid var(--border-color); background:rgba(2,132,199,0.05); color: var(--accent-blue); padding:4px; font-size:11px; font-weight:700;">${isQuad ? '2호' : '3호'}</th>
                  ${isQuad ? '' : `<th style="border:1px solid var(--border-color); background:rgba(2,132,199,0.05); color: var(--accent-blue); padding:4px; font-size:11px; font-weight:700;">4호</th>`}
                  <th style="border:1px solid var(--border-color); background:rgba(5,150,105,0.05); color: var(--accent-blue); padding:4px; font-size:11px; font-weight:700;">${isQuad ? '3호' : '2호'}</th>
                  ${isQuad ? '' : `<th style="border:1px solid var(--border-color); background:rgba(5,150,105,0.05); color: var(--accent-blue); padding:4px; font-size:11px; font-weight:700;">4호</th>`}
                </tr>
              </thead>
              <tbody>
                <!-- 전장길이 (초.중.종) -->
                <tr>
                  <td rowspan="4" style="border:1px solid var(--border-color); background:#f1f5f9; color:var(--text-main); font-weight:800; vertical-align:middle; padding:6px 4px;">전장길이<br><span style="font-size:10px; color:var(--text-muted); font-weight:normal;">(초.중.종)</span></td>
                  <td colspan="${isQuad ? '2' : '4'}" style="border:1px solid var(--border-color); background:#fef3c7; color:#92400e; font-weight:800; padding:6px; font-size:12px;">${isQuad ? '2463±10mm' : '2699±6mm'}</td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH3_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="초" value="${gb('len_LH3_초')}"></td>
                  ${isQuad ? '' : `<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH4_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="초" value="${gb('len_LH4_초')}"></td>`}
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH2_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="초" value="${gb('len_RH2_초')}"></td>
                  ${isQuad ? '' : `<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH4_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="초" value="${gb('len_RH4_초')}"></td>`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH3_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="중" value="${gb('len_LH3_중')}"></td>
                  ${isQuad ? '' : `<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH4_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="중" value="${gb('len_LH4_중')}"></td>`}
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH2_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="중" value="${gb('len_RH2_중')}"></td>
                  ${isQuad ? '' : `<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH4_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="중" value="${gb('len_RH4_중')}"></td>`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH3_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="종" value="${gb('len_LH3_종')}"></td>
                  ${isQuad ? '' : `<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH4_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="종" value="${gb('len_LH4_종')}"></td>`}
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH2_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="종" value="${gb('len_RH2_종')}"></td>
                  ${isQuad ? '' : `<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH4_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="종" value="${gb('len_RH4_종')}"></td>`}
                </tr>

                <!-- 끝단 클립 (초.중.종) -->
                <tr>
                  <td rowspan="7" style="border:1px solid var(--border-color); background:#f1f5f9; color:var(--text-main); font-weight:800; vertical-align:middle; padding:6px 4px;">끝단 클립<br><span style="font-size:10px; color:var(--text-muted); font-weight:normal;">(초.중.종)</span></td>
                  <td colspan="${isQuad ? '1' : '2'}" style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-weight:700; padding:5px 2px; font-size:11px;">(좌측) 28±1</td>
                  <td colspan="${isQuad ? '1' : '2'}" style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-weight:700; padding:5px 2px; font-size:11px;">(우측) 28±1</td>
                </tr>
                <!-- 초물 (좌/우) -->
                <tr>
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH3_초좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_LH3_초좌')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH4_초좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_LH4_초좌')}"></td>`}
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH2_초좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_RH2_초좌')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH4_초좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_RH4_초좌')}"></td>`}
                </tr>
                <tr>
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH3_초우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_LH3_초우')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH4_초우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_LH4_초우')}"></td>`}
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH2_초우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_RH2_초우')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH4_초우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_RH4_초우')}"></td>`}
                </tr>
                <!-- 중물 (좌/우) -->
                <tr>
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH3_중좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_LH3_중좌')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH4_중좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_LH4_중좌')}"></td>`}
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH2_중좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_RH2_중좌')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH4_중좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_RH4_중좌')}"></td>`}
                </tr>
                <tr>
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH3_중우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_LH3_중우')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH4_중우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_LH4_중우')}"></td>`}
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH2_중우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_RH2_중우')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH4_중우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_RH4_중우')}"></td>`}
                </tr>
                <!-- 종물 (좌/우) -->
                <tr>
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH3_종좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_LH3_종좌')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH4_종좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_LH4_종좌')}"></td>`}
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH2_종좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_RH2_종좌')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH4_종좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(좌)" value="${gb('clip_RH4_종좌')}"></td>`}
                </tr>
                <tr>
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH3_종우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_LH3_종우')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH4_종우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_LH4_종우')}"></td>`}
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH2_종우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_RH2_종우')}"></td>
                  ${isQuad ? '' : `<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH4_종우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="(우)" value="${gb('clip_RH4_종우')}"></td>`}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 8. 생산실적 카드 (A, B 분리 입력) -->
      <div class="card" style="margin-top: 16px;">
        <label style="font-size: 14px; font-weight: 800; color: var(--accent-blue); margin-bottom: 14px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 (${carName} 'A' / 'B' 분리 입력)
        </label>

        <!-- <span class="sec-num"></span> ${carName} 'A' 클립머신 생산실적 (1호기) -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--accent-blue);">
              🔹 A. ${carName} \'A\' 클립머신 생산실적 (1호기)
            </span>
            <span style="font-size: 11px; background: rgba(217,119,6,0.12); color: var(--accent-blue); padding: 3px 8px; border-radius: 4px; font-weight: 700;">
              📋 실적 및 불량 (A 설비)
            </span>
          </div>
          <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 8px; background: #ffffff;">
            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">
              <thead>
                <tr>
                  <th style="border:1px solid var(--border-color); background:#f8fafc; padding:8px; font-weight:800;">구분</th>
                  <th colspan="2" style="border:1px solid var(--border-color); background:rgba(2,132,199,0.08); color: var(--accent-blue); padding:8px; font-weight:800;">LH</th>
                  <th colspan="2" style="border:1px solid var(--border-color); background:rgba(5,150,105,0.08); color: var(--accent-blue); padding:8px; font-weight:800;">RH</th>
                </tr>
              </thead>
              <tbody>
                ${[
                  {id:'정품수량', label:'정품수량', bg:'#ecfdf5', color:'#047857', bold: true, readonly: false},
                  {id:'불량합계', label:'불량 합계 (자동집계)', bg:'#fff1f2', color:'#be123c', bold: true, readonly: true},
                  {id:'길이미달', label:'길이미달', bg:'#f8fafc', color:'#be123c'},
                  {id:'길이초과', label:'길이 초과', bg:'#f8fafc', color:'#be123c'},
                  {id:'끝단부불량', label:'끝단부불량', bg:'#f8fafc', color:'#be123c'},
                  {id:'클립홀찢어짐', label:'클립홀찢어짐', bg:'#f8fafc', color:'#be123c'},
                  {id:'클립간격불량', label:'클립간격불량', bg:'#f8fafc', color:'#be123c'},
                  {id:'드레인홀불량', label:'드레인홀불량', bg:'#f8fafc', color:'#be123c'},
                  {id:'스코치', label:'스코치', bg:'#f8fafc', color:'#be123c'},
                  {id:'기타', label:'기타', bg:'#f8fafc', color:'var(--text-main)'},
                ].map(row => `
                <tr>
                  <td style="border:1px solid var(--border-color); background:${row.bg}; color:${row.color}; font-weight:${row.bold ? '800' : '600'}; text-align:center; padding:6px 4px; font-size:11px;">${row.label}</td>
                  <td colspan="2" style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_${row.id}_LH" class="form-control" style="font-size:12px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="LH" value="${g(row.id+'_LH')}" ${row.readonly ? 'readonly' : ''}></td>
                  <td colspan="2" style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_${row.id}_RH" class="form-control" style="font-size:12px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="RH" value="${g(row.id+'_RH')}" ${row.readonly ? 'readonly' : ''}></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- <span class="sec-num"></span> ${carName} 'B' 클립머신 생산실적 -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--accent-purple);">
              🔹 B. ${carName} \'B\' 클립머신 생산실적
            </span>
            <span style="font-size: 11px; background: rgba(124,58,237,0.12); color: var(--accent-purple); padding: 3px 8px; border-radius: 4px; font-weight: 700;">
              📋 실적 및 불량 ${isQuad ? '(2호 / 3호)' : '(3호 / 4호 / 2호 / 4호)'}
            </span>
          </div>
          <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 8px; background: #ffffff;">
            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">
              <colgroup>
                ${isQuad ? `
                  <col style="width:34%">
                  <col style="width:33%"><col style="width:33%">
                ` : `
                  <col style="width:20%">
                  <col style="width:20%"><col style="width:20%">
                  <col style="width:20%"><col style="width:20%">
                `}
              </colgroup>
              <thead>
                <tr>
                  <th rowspan="2" style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-main); padding:8px 4px; font-weight:800; vertical-align:middle;">구분</th>
                  <th colspan="${isQuad ? '1' : '2'}" style="border:1px solid var(--border-color); background:rgba(2,132,199,0.08); color: var(--accent-blue); padding:6px 4px; font-weight:800;">LH</th>
                  <th colspan="${isQuad ? '1' : '2'}" style="border:1px solid var(--border-color); background:rgba(5,150,105,0.08); color: var(--accent-blue); padding:6px 4px; font-weight:800;">RH</th>
                </tr>
                <tr>
                  <th style="border:1px solid var(--border-color); background:rgba(2,132,199,0.05); color: var(--accent-blue); padding:4px; font-size:11px; font-weight:700;">${isQuad ? '2호' : '3호'}</th>
                  ${isQuad ? '' : `<th style="border:1px solid var(--border-color); background:rgba(2,132,199,0.05); color: var(--accent-blue); padding:4px; font-size:11px; font-weight:700;">4호</th>`}
                  <th style="border:1px solid var(--border-color); background:rgba(5,150,105,0.05); color: var(--accent-blue); padding:4px; font-size:11px; font-weight:700;">${isQuad ? '3호' : '2호'}</th>
                  ${isQuad ? '' : `<th style="border:1px solid var(--border-color); background:rgba(5,150,105,0.05); color: var(--accent-blue); padding:4px; font-size:11px; font-weight:700;">4호</th>`}
                </tr>
              </thead>
              <tbody>
                ${[
                  {id:'정품수량', label:'정품수량', bg:'#ecfdf5', color:'#047857', bold: true, readonly: false},
                  {id:'불량합계', label:'불량 합계', bg:'#fff1f2', color:'#be123c', bold: true, readonly: true},
                  {id:'길이미달', label:'길이미달', bg:'#f8fafc', color:'#be123c'},
                  {id:'길이초과', label:'길이 초과', bg:'#f8fafc', color:'#be123c'},
                  {id:'끝단부불량', label:'끝단부불량', bg:'#f8fafc', color:'#be123c'},
                  {id:'클립홀찢어짐', label:'클립홀찢어짐', bg:'#f8fafc', color:'#be123c'},
                  {id:'클립간격불량', label:'클립간격불량', bg:'#f8fafc', color:'#be123c'},
                  {id:'드레인홀불량', label:'드레인홀불량', bg:'#f8fafc', color:'#be123c'},
                  {id:'스코치', label:'스코치', bg:'#f8fafc', color:'#be123c'},
                  {id:'기타', label:'기타', bg:'#f8fafc', color:'var(--text-main)'},
                ].map(row => `
                <tr>
                  <td style="border:1px solid var(--border-color); background:${row.bg}; color:${row.color}; font-weight:${row.bold ? '800' : '600'}; text-align:center; padding:6px 4px; font-size:11px;">${row.label}</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_${row.id}_LH3" class="form-control" style="font-size:11px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="${isQuad ? '2호' : '3호'}" value="${gb(row.id+'_LH3') || gb(row.id+'_LH')}" ${row.readonly ? 'readonly' : ''}></td>
                  ${isQuad ? '' : `<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_${row.id}_LH4" class="form-control" style="font-size:11px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="4호" value="${gb(row.id+'_LH4')}" ${row.readonly ? 'readonly' : ''}></td>`}
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_${row.id}_RH2" class="form-control" style="font-size:11px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="${isQuad ? '3호' : '2호'}" value="${gb(row.id+'_RH2') || gb(row.id+'_RH')}" ${row.readonly ? 'readonly' : ''}></td>
                  ${isQuad ? '' : `<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_${row.id}_RH4" class="form-control" style="font-size:11px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="4호" value="${gb(row.id+'_RH4')}" ${row.readonly ? 'readonly' : ''}></td>`}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 숨겨진 일반 필드 (저장 호환) -->
        <input type="hidden" id="targetQty" value="0">
        <input type="hidden" id="actualQty" value="0">
        <input type="hidden" id="defectQty" value="0">
      </div>
    `;
  }

  export function getKmKxClipQtyHTML(ed, container) {
    const g = (id) => ed?.kmkxClipQty?.[id] || ed?.dtCrewQty?.[id] || '';

    return `
      <!-- 6. 치수확인 카드 -->
      <div class="card">
        <label style="font-size: 14px; font-weight: 800; color: var(--accent-blue); margin-bottom: 14px; display: block;">
          📐 <span class="sec-num"></span> 치수확인
        </label>

        <!-- 1. 단면 길이(mm) -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
            단면 길이(mm)
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #ffffff; font-weight: 700;">
                  <th rowspan="2" style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">구분</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">MIDDLE</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                </tr>
                <tr style="background: #ffffff; font-weight: 700;">
                  <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">700±5</td>
                  <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">1086±5</td>
                  <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">700±5</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_초')}" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_초')}" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_초')}" /></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_중')}" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_중')}" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_중')}" /></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_종')}" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_종')}" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_종')}" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. 양 끝단 홀 간격(mm) -->
        <div>
          <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
            양 끝단 홀 간격(mm)
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #ffffff; font-weight: 700;">
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">MIDDLE</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                </tr>
                <tr style="background: #ffffff; font-weight: 700;">
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">(좌측)</td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                </tr>
                <tr style="background: #ffffff; font-weight: 700;">
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">(우측)</td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                </tr>
              </thead>
              <tbody>
                <!-- 초 -->
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">초</td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_초_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_초_좌')}" placeholder="좌" /></td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_초_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_초_좌')}" placeholder="좌" /></td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_초_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_초_좌')}" placeholder="좌" /></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_초_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_초_우')}" placeholder="우" /></td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_초_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_초_우')}" placeholder="우" /></td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_초_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_초_우')}" placeholder="우" /></td>
                </tr>

                <!-- 중 -->
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">중</td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_중_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_중_좌')}" placeholder="좌" /></td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_중_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_중_좌')}" placeholder="좌" /></td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_중_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_중_좌')}" placeholder="좌" /></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_중_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_중_우')}" placeholder="우" /></td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_중_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_중_우')}" placeholder="우" /></td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_중_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_중_우')}" placeholder="우" /></td>
                </tr>

                <!-- 종 -->
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">종</td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_종_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_종_좌')}" placeholder="좌" /></td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_종_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_종_좌')}" placeholder="좌" /></td>
                  <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_종_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_종_좌')}" placeholder="좌" /></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_종_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_종_우')}" placeholder="우" /></td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_종_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_종_우')}" placeholder="우" /></td>
                  <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_종_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_종_우')}" placeholder="우" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 8. 생산실적 카드 -->
      <div class="card" style="margin-top: 16px;">
        <label style="font-size: 14px; font-weight: 800; color: var(--accent-blue); margin-bottom: 14px; display: block;">
          📊 <span class="sec-num"></span> 생산실적
        </label>
        <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 8px; background: #ffffff;">
          <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">
            <thead>
              <tr>
                <th style="border:1px solid var(--border-color); background:#f8fafc; padding:8px; font-weight:800; width:25%;">구분</th>
                <th style="border:1px solid var(--border-color); background:rgba(2,132,199,0.08); color: var(--accent-blue); padding:8px; font-weight:800; width:25%;">LH</th>
                <th style="border:1px solid var(--border-color); background:rgba(124,58,237,0.08); color:var(--accent-purple); padding:8px; font-weight:800; width:25%;">MIDDLE</th>
                <th style="border:1px solid var(--border-color); background:rgba(5,150,105,0.08); color: var(--accent-blue); padding:8px; font-weight:800; width:25%;">RH</th>
              </tr>
            </thead>
            <tbody>
              ${[
                {id:'정품수량', label:'정품수량', bg:'#ecfdf5', color:'#047857', bold: true, readonly: false},
                {id:'불량합계', label:'불량 합계 (자동집계)', bg:'#fff1f2', color:'#be123c', bold: true, readonly: true},
                {id:'길이미달', label:'길이미달', bg:'#f8fafc', color:'#be123c'},
                {id:'길이초과', label:'길이 초과', bg:'#f8fafc', color:'#be123c'},
                {id:'끝단부불량', label:'끝단부불량', bg:'#f8fafc', color:'#be123c'},
                {id:'클립홀찢어짐', label:'클립홀찢어짐', bg:'#f8fafc', color:'#be123c'},
                {id:'클립간격불량', label:'클립간격불량', bg:'#f8fafc', color:'#be123c'},
                {id:'드레인홀불량', label:'드레인홀불량', bg:'#f8fafc', color:'#be123c'},
                {id:'스코치', label:'스코치', bg:'#f8fafc', color:'#be123c'},
                {id:'기타', label:'기타', bg:'#f8fafc', color:'var(--text-main)'},
              ].map(row => `
              <tr>
                <td style="border:1px solid var(--border-color); background:${row.bg}; color:${row.color}; font-weight:${row.bold ? '800' : '600'}; text-align:center; padding:6px 4px; font-size:11px;">${row.label}</td>
                <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_${row.id}_LH" class="form-control" style="font-size:12px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="LH" value="${g(row.id+'_LH')}" ${row.readonly ? 'readonly' : ''}></td>
                <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_${row.id}_MID" class="form-control" style="font-size:12px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="MID" value="${g(row.id+'_MID')}" ${row.readonly ? 'readonly' : ''}></td>
                <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_${row.id}_RH" class="form-control" style="font-size:12px; padding:4px; text-align:center; ${row.readonly ? 'background:#ffe4e6; font-weight:800; color:#be123c;' : ''}" placeholder="RH" value="${g(row.id+'_RH')}" ${row.readonly ? 'readonly' : ''}></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- 숨겨진 일반 필드 (저장 호환) -->
        <input type="hidden" id="targetQty" value="0">
        <input type="hidden" id="actualQty" value="0">
        <input type="hidden" id="defectQty" value="0">
      </div>
    `;
  }

  export function getDtCrewPostQtyHTML(ed, container) {
    const q = ed && ed.dtCrewPostQty ? ed.dtCrewPostQty : {};
    const prod = q.prod || {};
    const ext = q.ext || {};
    const joint = q.joint || {};
    const post = q.post || {};

    const extItems = [
      { id: 'scorch', label: '스 코 치' },
      { id: 'scratch', label: '외 면 흠' },
      { id: 'coat', label: '오염 / 코팅불량' },
      { id: 'len', label: '길 이 불 량' },
      { id: 'clip_omit', label: '소재클립 누락' },
      { id: 'oth', label: '기 타 ( )' }
    ];

    const jointItems = [
      { id: 'drop', label: '떨어짐 / 찢어짐' },
      { id: 'lack', label: '양 부 족' },
      { id: 'push', label: '밀림 / 크랙' },
      { id: 'bubble', label: '기 포' },
      { id: 'chew', label: '씹힘 / 삽입불량' },
      { id: 'overflow', label: '넘침 / 오버랩' },
      { id: 'deform', label: '후 변 형' },
      { id: 'foreign', label: '이 물 질' },
      { id: 'twist', label: '꼬 임' },
      { id: 'oth', label: '기 타' }
    ];

    const postItems = [
      { id: 'oversand', label: '과 사 상' },
      { id: 'undersand', label: '미 사 상' },
      { id: 'bond_contam', label: '본 드 오 염' },
      { id: 'ext_contam', label: '외 면 오 염' },
      { id: 'clip_half', label: '클립누락 / 반클' },
      { id: 'clip_hole_omit', label: '클 립 홀 누 락' },
      { id: 'drain_bad', label: '드 레 인 홀 불 량' },
      { id: 'clip_diff', label: '클 립 이 종' },
      { id: 'cut_omit', label: '절 단 누 락' },
      { id: 'bond_omit', label: '본드누락 / 접착불량' },
      { id: 'len_over', label: '길 이 초 과' },
      { id: 'clip_gap_bad', label: '클립간격불량' },
      { id: 'oth', label: '기 타' }
    ];

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 및 불량 현황
        </label>
        <div style="overflow-x: auto;">
          <table id="dtCrewPostQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <!-- 1. 제품수량 섹션 -->
            <thead>
              <tr style="background: #ffffff; font-weight: 700; color: #000;">
                <th colspan="4" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 70%;">구 분</th>
                <th style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 15%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 15%;">RH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowspan="3" colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; width: 24%;">제품수량</td>
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000; width: 46%;">작 업 수</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_pqty_work_LH" readonly class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; background: #f1f5f9;" value="${prod.work_LH ?? ''}" placeholder="0" />
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_pqty_work_RH" readonly class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; background: #f1f5f9;" value="${prod.work_RH ?? ''}" placeholder="0" />
                </td>
              </tr>
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">정 품 수</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_pqty_good_LH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; color: var(--accent-blue);" value="${prod.good_LH ?? ''}" placeholder="0" />
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_pqty_good_RH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; color: var(--accent-blue);" value="${prod.good_RH ?? ''}" placeholder="0" />
                </td>
              </tr>
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">불 량 수</td>
                <td id="dtc_pqty_bad_LH" style="border: 1px solid #000; padding: 6px; font-weight: 700; color: var(--accent-rose);">0</td>
                <td id="dtc_pqty_bad_RH" style="border: 1px solid #000; padding: 6px; font-weight: 700; color: var(--accent-rose);">0</td>
              </tr>

              <!-- 2. 불량유형별 섹션 -->
              <tr style="background: #e2e8f0; font-weight: 700; color: #000;">
                <td colspan="4" style="border: 1px solid #000; padding: 6px; font-size: 12px;">구 분</td>
                <td style="border: 1px solid #000; padding: 6px; font-size: 12px;">LH</td>
                <td style="border: 1px solid #000; padding: 6px; font-size: 12px;">RH</td>
              </tr>

              <!-- <span class="sec-num"></span> 외관부 -->
              ${extItems.map((item, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="31" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; font-size: 12px; width: 10%;">불량유형별</td>` : ''}
                  ${idx === 0 ? `<td rowspan="6" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; font-size: 11px; width: 14%;">외관부</td>` : ''}
                  ${idx === 0 ? `
                    <td rowspan="6" style="border: 1px solid #000; padding: 6px 2px; background: #fdf2f8; vertical-align: middle; width: 22%;">
                      <div style="display: flex; flex-direction: column; gap: 4px; justify-content: center; align-items: center;">
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">LH 불량수</span>
                        <span id="dtc_pdef_ext_sum_LH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                        <hr style="width: 80%; border: 0; border-top: 1px solid #cbd5e1; margin: 2px 0;" />
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">RH 불량수</span>
                        <span id="dtc_pdef_ext_sum_RH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                      </div>
                    </td>
                  ` : ''}
                  <td style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000; width: 24%;">${item.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_ext_${item.id}_LH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${ext[item.id]?.lh ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_ext_${item.id}_RH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${ext[item.id]?.rh ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}

              <!-- <span class="sec-num"></span> 조인트부 항목들 -->
              ${jointItems.map((item, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="11" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; font-size: 11px;">조인트부</td>` : ''}
                  ${idx === 0 ? `
                    <td rowspan="11" style="border: 1px solid #000; padding: 6px 2px; background: #fdf2f8; vertical-align: middle;">
                      <div style="display: flex; flex-direction: column; gap: 4px; justify-content: center; align-items: center;">
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">LH 불량수</span>
                        <span id="dtc_pdef_j_sum_LH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                        <hr style="width: 80%; border: 0; border-top: 1px solid #cbd5e1; margin: 2px 0;" />
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">RH 불량수</span>
                        <span id="dtc_pdef_j_sum_RH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                      </div>
                    </td>
                  ` : ''}
                  <td style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000;">${item.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_j_${item.id}_LH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${joint[item.id]?.lh ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_j_${item.id}_RH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${joint[item.id]?.rh ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}
              <!-- 조인트부 불량수 하단 행 -->
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td style="border: 1px solid #000; padding: 5px;">불 량 수</td>
                <td id="dtc_pdef_j_row_sum_LH" style="border: 1px solid #000; padding: 5px; color: var(--accent-rose);">0</td>
                <td id="dtc_pdef_j_row_sum_RH" style="border: 1px solid #000; padding: 5px; color: var(--accent-rose);">0</td>
              </tr>

              <!-- <span class="sec-num"></span> 후가공부 항목들 -->
              ${postItems.map((item, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="14" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; font-size: 11px;">후가공부</td>` : ''}
                  ${idx === 0 ? `
                    <td rowspan="14" style="border: 1px solid #000; padding: 6px 2px; background: #fdf2f8; vertical-align: middle;">
                      <div style="display: flex; flex-direction: column; gap: 4px; justify-content: center; align-items: center;">
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">LH 불량수</span>
                        <span id="dtc_pdef_post_sum_LH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                        <hr style="width: 80%; border: 0; border-top: 1px solid #cbd5e1; margin: 2px 0;" />
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">RH 불량수</span>
                        <span id="dtc_pdef_post_sum_RH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                      </div>
                    </td>
                  ` : ''}
                  <td style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000;">${item.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_post_${item.id}_LH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${post[item.id]?.lh ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_post_${item.id}_RH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${post[item.id]?.rh ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}
              <!-- 후가공부 불량수 하단 행 -->
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td style="border: 1px solid #000; padding: 5px;">불 량 수</td>
                <td id="dtc_pdef_post_row_sum_LH" style="border: 1px solid #000; padding: 5px; color: var(--accent-rose);">0</td>
                <td id="dtc_pdef_post_row_sum_RH" style="border: 1px solid #000; padding: 5px; color: var(--accent-rose);">0</td>
              </tr>

              <!-- 3. 최하단 불량합계 -->
              <tr style="background: #e2e8f0; font-weight: 800;">
                <td colspan="4" style="border: 1px solid #000; padding: 7px; font-size: 12px; color: var(--accent-rose);">불량합계</td>
                <td id="dtc_pdef_total_sum_LH" style="border: 1px solid #000; padding: 7px; font-size: 12px; color: var(--accent-rose);">0</td>
                <td id="dtc_pdef_total_sum_RH" style="border: 1px solid #000; padding: 7px; font-size: 12px; color: var(--accent-rose);">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <input type="hidden" id="targetQty" value="0" />
        <input type="hidden" id="actualQty" value="0" />
        <input type="hidden" id="defectQty" value="0" />
      </div>
    `;
  }

  export function getKmKxPostQtyHTML(ed, container) {
    const q = ed && ed.dtCrewPostQty ? ed.dtCrewPostQty : {};
    const prod = q.prod || {};
    const ext = q.ext || {};
    const joint = q.joint || {};
    const post = q.post || {};

    const extItems = [
      { id: 'scorch', label: '스 코 치' },
      { id: 'scratch', label: '외 면 흠' },
      { id: 'coat', label: '오염 / 코팅불량' },
      { id: 'len', label: '길 이 불 량' },
      { id: 'clip_omit', label: '소재클립 누락' },
      { id: 'oth', label: '기 타 ( )' }
    ];

    const jointItems = [
      { id: 'drop', label: '떨어짐 / 찢어짐' },
      { id: 'lack', label: '양 부 족' },
      { id: 'push', label: '밀림 / 크랙' },
      { id: 'bubble', label: '기 포' },
      { id: 'chew', label: '씹힘 / 삽입불량' },
      { id: 'overflow', label: '넘침 / 오버랩' },
      { id: 'deform', label: '후 변 형' },
      { id: 'foreign', label: '이 물 질' },
      { id: 'twist', label: '꼬 임' },
      { id: 'oth', label: '기 타' }
    ];

    const postItems = [
      { id: 'oversand', label: '과 사 상' },
      { id: 'undersand', label: '미 사 상' },
      { id: 'bond_contam', label: '본 드 오 염' },
      { id: 'ext_contam', label: '외 면 오 염' },
      { id: 'clip_half', label: '클립누락 / 반클' },
      { id: 'clip_hole_omit', label: '클 립 홀 누 락' },
      { id: 'drain_bad', label: '드 레 인 홀 불 량' },
      { id: 'clip_diff', label: '클 립 이 종' },
      { id: 'cut_omit', label: '절 단 누 락' },
      { id: 'bond_omit', label: '본드누락 / 접착불량' },
      { id: 'len_over', label: '길 이 초 과' },
      { id: 'clip_gap_bad', label: '클립간격불량' },
      { id: 'oth', label: '기 타' }
    ];

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 및 불량 현황
        </label>
        <div style="overflow-x: auto;">
          <table id="dtCrewPostQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <!-- 1. 제품수량 섹션 -->
            <thead>
              <tr style="background: #ffffff; font-weight: 700; color: #000;">
                <th colspan="4" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 75%;">구 분</th>
                <th style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 25%;">HOOD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowspan="3" colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; width: 24%;">제품수량</td>
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000; width: 51%;">작 업 수</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_pqty_work_LH" readonly class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; background: #f1f5f9;" value="${prod.work_LH ?? ''}" placeholder="0" />
                </td>
              </tr>
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">정 품 수</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_pqty_good_LH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; color: var(--accent-blue);" value="${prod.good_LH ?? ''}" placeholder="0" />
                </td>
              </tr>
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">불 량 수</td>
                <td id="dtc_pqty_bad_LH" style="border: 1px solid #000; padding: 6px; font-weight: 700; color: var(--accent-rose);">0</td>
              </tr>

              <!-- 2. 불량유형별 섹션 -->
              <tr style="background: #e2e8f0; font-weight: 700; color: #000;">
                <td colspan="4" style="border: 1px solid #000; padding: 6px; font-size: 12px;">구 분</td>
                <td style="border: 1px solid #000; padding: 6px; font-size: 12px;">HOOD</td>
              </tr>

              <!-- <span class="sec-num"></span> 외관부 -->
              ${extItems.map((item, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="31" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; font-size: 12px; width: 10%;">불량유형별</td>` : ''}
                  ${idx === 0 ? `<td rowspan="6" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; font-size: 11px; width: 14%;">외관부</td>` : ''}
                  ${idx === 0 ? `
                    <td rowspan="6" style="border: 1px solid #000; padding: 6px 2px; background: #fdf2f8; vertical-align: middle; width: 22%;">
                      <div style="display: flex; flex-direction: column; gap: 4px; justify-content: center; align-items: center;">
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">불량수</span>
                        <span id="dtc_pdef_ext_sum_LH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                      </div>
                    </td>
                  ` : ''}
                  <td style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000; width: 29%;">${item.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_ext_${item.id}_LH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${ext[item.id]?.lh ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}

              <!-- <span class="sec-num"></span> 조인트부 항목들 -->
              ${jointItems.map((item, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="11" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; font-size: 11px;">조인트부</td>` : ''}
                  ${idx === 0 ? `
                    <td rowspan="11" style="border: 1px solid #000; padding: 6px 2px; background: #fdf2f8; vertical-align: middle;">
                      <div style="display: flex; flex-direction: column; gap: 4px; justify-content: center; align-items: center;">
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">불량수</span>
                        <span id="dtc_pdef_j_sum_LH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                      </div>
                    </td>
                  ` : ''}
                  <td style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000;">${item.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_j_${item.id}_LH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${joint[item.id]?.lh ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}
              <!-- 조인트부 불량수 하단 행 -->
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td style="border: 1px solid #000; padding: 5px;">불 량 수</td>
                <td id="dtc_pdef_j_row_sum_LH" style="border: 1px solid #000; padding: 5px; color: var(--accent-rose);">0</td>
              </tr>

              <!-- <span class="sec-num"></span> 후가공부 항목들 -->
              ${postItems.map((item, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="14" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; font-size: 11px;">후가공부</td>` : ''}
                  ${idx === 0 ? `
                    <td rowspan="14" style="border: 1px solid #000; padding: 6px 2px; background: #fdf2f8; vertical-align: middle;">
                      <div style="display: flex; flex-direction: column; gap: 4px; justify-content: center; align-items: center;">
                        <span style="font-weight: 700; font-size: 11px; color: #475569;">불량수</span>
                        <span id="dtc_pdef_post_sum_LH" style="font-weight: 800; font-size: 13px; color: var(--accent-rose);">0</span>
                      </div>
                    </td>
                  ` : ''}
                  <td style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000;">${item.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_pdef_post_${item.id}_LH" class="form-control dtc-post-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${post[item.id]?.lh ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}
              <!-- 후가공부 불량수 하단 행 -->
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td style="border: 1px solid #000; padding: 5px;">불 량 수</td>
                <td id="dtc_pdef_post_row_sum_LH" style="border: 1px solid #000; padding: 5px; color: var(--accent-rose);">0</td>
              </tr>

              <!-- 3. 최하단 불량합계 -->
              <tr style="background: #e2e8f0; font-weight: 800;">
                <td colspan="4" style="border: 1px solid #000; padding: 7px; font-size: 12px; color: var(--accent-rose);">불량합계</td>
                <td id="dtc_pdef_total_sum_LH" style="border: 1px solid #000; padding: 7px; font-size: 12px; color: var(--accent-rose);">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <input type="hidden" id="targetQty" value="0" />
        <input type="hidden" id="actualQty" value="0" />
        <input type="hidden" id="defectQty" value="0" />
      </div>
    `;
  }

  export function getDtCrewJointQtyHTML(ed, defaultPlan = 300, isFixedLhRh = false, container) {
    const q = ed && ed.dtCrewJointQty ? ed.dtCrewJointQty : {};
    const q1 = q.tbl1 || {};
    const q2 = q.tbl2 || {};
    const defs1 = q1.defects || {};
    const defs2 = q2.defects || {};
    const planVal1 = q1.plan !== undefined && q1.plan !== '' ? q1.plan : defaultPlan;
    const planVal2 = q2.plan !== undefined && q2.plan !== '' ? q2.plan : defaultPlan;

    const defectKeys = [
      { id: 'tear', label: '떨어짐/찢어짐' },
      { id: 'lack', label: '양 부 족' },
      { id: 'push', label: '밀림 / 크랙' },
      { id: 'bubble', label: '기 포' },
      { id: 'chew', label: '씹힘/삽입불량' },
      { id: 'overflow', label: '넘침/오버랩' },
      { id: 'deform', label: '후 변 형' },
      { id: 'foreign', label: '이 물 질' },
      { id: 'twist', label: '꼬 임' },
      { id: 'oth', label: '기 타' }
    ];

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 및 폐기 불량현황 입력
        </label>
        <div style="overflow-x: auto;">
          <table id="dtCrewJointQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 22%;">구분</th>
                <th colspan="3" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 39%;">
                  ${isFixedLhRh ? `
                    <span style="font-weight: 800; font-size: 13px; color: var(--accent-blue);">LH</span>
                    <input type="hidden" id="dtc_jqty1_lh_fixed" value="true" />
                  ` : `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 12px;">
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="dtc_jqty1_lh" ${q1.lh ? 'checked' : ''} style="width: 14px; height: 14px;" /> LH
                      </label>
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="dtc_jqty1_rh" ${q1.rh ? 'checked' : ''} style="width: 14px; height: 14px;" /> RH
                      </label>
                    </div>
                  `}
                </th>
                <th colspan="3" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 39%;">
                  ${isFixedLhRh ? `
                    <span style="font-weight: 800; font-size: 13px; color: var(--accent-blue);">RH</span>
                    <input type="hidden" id="dtc_jqty2_rh_fixed" value="true" />
                  ` : `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 12px;">
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="dtc_jqty2_lh" ${q2.lh ? 'checked' : ''} style="width: 14px; height: 14px;" /> LH
                      </label>
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="dtc_jqty2_rh" ${q2.rh ? 'checked' : ''} style="width: 14px; height: 14px;" /> RH
                      </label>
                    </div>
                  `}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 생산량 -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">생산량</td>
                <td style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">계획</td>
                <td colspan="3" style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_plan_1" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${planVal1}" placeholder="${defaultPlan}" />
                </td>
                <td colspan="3" style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_plan_2" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${planVal2}" placeholder="${defaultPlan}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">실적</td>
                <td colspan="3" style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_act_1" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.act ?? ''}" placeholder="0" />
                </td>
                <td colspan="3" style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_act_2" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q2.act ?? ''}" placeholder="0" />
                </td>
              </tr>

              <!-- 폐기 불량현황 -->
              <tr style="background: #e2e8f0; font-weight: 700; color: #000;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px;">폐기 불량현황</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">A</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">B</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">C</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">A</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">B</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">C</td>
              </tr>

              <!-- 10개 불량 항목 -->
              ${defectKeys.map(dk => `
                <tr>
                  <td colspan="2" style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000;">${dk.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_A" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.a ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_B" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.b ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_C" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.c ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_2_A" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs2[dk.id]?.a ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_2_B" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs2[dk.id]?.b ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_2_C" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs2[dk.id]?.c ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}

              <!-- 불량합계 -->
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">불량합계</td>
                <td id="dtc_jdef_sum_1_A" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_1_B" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_1_C" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_2_A" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_2_B" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_2_C" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <input type="hidden" id="targetQty" value="0" />
        <input type="hidden" id="actualQty" value="0" />
        <input type="hidden" id="defectQty" value="0" />
      </div>
    `;
  }

  export function getKmKxJointQtyHTML(ed, defaultPlan = 300, container) {
    const q = ed && ed.dtCrewJointQty ? ed.dtCrewJointQty : {};
    const q1 = q.tbl1 || {};
    const q2 = q.tbl2 || {};
    const defs1 = q1.defects || {};
    const defs2 = q2.defects || {};
    const planVal1 = q1.plan !== undefined && q1.plan !== '' ? q1.plan : defaultPlan;
    const planVal2 = q2.plan !== undefined && q2.plan !== '' ? q2.plan : defaultPlan;

    const defectKeys = [
      { id: 'tear', label: '떨어짐/찢어짐' },
      { id: 'lack', label: '양 부 족' },
      { id: 'push', label: '밀림 / 크랙' },
      { id: 'bubble', label: '기 포' },
      { id: 'chew', label: '씹힘/삽입불량' },
      { id: 'overflow', label: '넘침/오버랩' },
      { id: 'deform', label: '후 변 형' },
      { id: 'foreign', label: '이 물 질' },
      { id: 'twist', label: '꼬 임' },
      { id: 'oth', label: '기 타' }
    ];

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 및 폐기 불량현황 입력
        </label>
        <div style="overflow-x: auto;">
          <table id="dtCrewJointQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 22%;">구분</th>
                <th colspan="3" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 39%;">
                  <span style="font-weight: 800; font-size: 13px; color: var(--accent-blue);">1호기</span>
                  <input type="hidden" id="dtc_jqty1_lh" value="true" />
                </th>
                <th colspan="3" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 39%;">
                  <span style="font-weight: 800; font-size: 13px; color: var(--accent-blue);">2호기</span>
                  <input type="hidden" id="dtc_jqty2_rh" value="true" />
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 생산량 -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">생산량</td>
                <td style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">계획</td>
                <td colspan="3" style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_plan_1" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${planVal1}" placeholder="${defaultPlan}" />
                </td>
                <td colspan="3" style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_plan_2" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${planVal2}" placeholder="${defaultPlan}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">실적</td>
                <td colspan="3" style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_act_1" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.act ?? ''}" placeholder="0" />
                </td>
                <td colspan="3" style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_act_2" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q2.act ?? ''}" placeholder="0" />
                </td>
              </tr>

              <!-- 폐기 불량현황 -->
              <tr style="background: #e2e8f0; font-weight: 700; color: #000;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px;">폐기 불량현황</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">LH</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">MIDDLE</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">RH</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">LH</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">MIDDLE</td>
                <td style="border: 1px solid #000; padding: 6px; width: 13%;">RH</td>
              </tr>

              <!-- 10개 불량 항목 -->
              ${defectKeys.map(dk => `
                <tr>
                  <td colspan="2" style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000;">${dk.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_A" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.a ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_B" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.b ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_C" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.c ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_2_A" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs2[dk.id]?.a ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_2_B" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs2[dk.id]?.b ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_2_C" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs2[dk.id]?.c ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}

              <!-- 불량합계 -->
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">불량합계</td>
                <td id="dtc_jdef_sum_1_A" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_1_B" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_1_C" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_2_A" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_2_B" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_2_C" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <input type="hidden" id="targetQty" value="0" />
        <input type="hidden" id="actualQty" value="0" />
        <input type="hidden" id="defectQty" value="0" />
      </div>
    `;
  }

  export function getDtCrewEndJointQtyHTML(ed, container) {
    const q = ed && ed.dtCrewJointQty ? ed.dtCrewJointQty : {};
    const q1 = q.tbl1 || {};
    const defs1 = q1.defects || {};

    const defectKeys = [
      { id: 'tear', label: '떨어짐/찢어짐' },
      { id: 'lack', label: '양 부 족' },
      { id: 'push', label: '밀림 / 크랙' },
      { id: 'bubble', label: '기 포' },
      { id: 'chew', label: '씹힘/삽입불량' },
      { id: 'overflow', label: '넘침/오버랩' },
      { id: 'deform', label: '후 변 형' },
      { id: 'foreign', label: '이 물 질' },
      { id: 'twist', label: '꼬 임' },
      { id: 'oth', label: '기 타' }
    ];

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 및 폐기 불량현황 입력
        </label>
        <div style="overflow-x: auto;">
          <table id="dtCrewJointEndQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #e2e8f0; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px; font-size: 12px; width: 28%;">구분</th>
                <th style="border: 1px solid #000; padding: 6px; width: 18%;">1호</th>
                <th style="border: 1px solid #000; padding: 6px; width: 18%;">2호</th>
                <th style="border: 1px solid #000; padding: 6px; width: 18%;">3호</th>
                <th style="border: 1px solid #000; padding: 6px; width: 18%;">4호</th>
              </tr>
            </thead>
            <tbody>
              <!-- 생산량 -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">생산량</td>
                <td style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">계획</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_plan_1_1" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.plan_1 ?? q1.plan ?? 300}" placeholder="300" />
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_plan_1_2" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.plan_2 ?? q1.plan ?? 300}" placeholder="300" />
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_plan_1_3" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.plan_3 ?? q1.plan ?? 300}" placeholder="300" />
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_plan_1_4" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.plan_4 ?? q1.plan ?? 300}" placeholder="300" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700; color: #000;">실적</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_act_1_1" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.act_1 ?? q1.act ?? ''}" placeholder="0" />
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_act_1_2" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.act_2 ?? ''}" placeholder="0" />
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_act_1_3" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.act_3 ?? ''}" placeholder="0" />
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <input type="number" id="dtc_jqty_act_1_4" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q1.act_4 ?? ''}" placeholder="0" />
                </td>
              </tr>

              <!-- 폐기 불량현황 -->
              <tr style="background: #f1f5f9; font-weight: 700; color: #000;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px;">폐기 불량현황</td>
                <td style="border: 1px solid #000; padding: 6px; width: 18%;">1호</td>
                <td style="border: 1px solid #000; padding: 6px; width: 18%;">2호</td>
                <td style="border: 1px solid #000; padding: 6px; width: 18%;">3호</td>
                <td style="border: 1px solid #000; padding: 6px; width: 18%;">4호</td>
              </tr>

              <!-- 10개 불량 항목 -->
              ${defectKeys.map(dk => `
                <tr>
                  <td colspan="2" style="border: 1px solid #000; padding: 5px; background: #ffffff; font-weight: 700; color: #000;">${dk.label}</td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_1" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.h1 ?? defs1[dk.id]?.a ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_2" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.h2 ?? defs1[dk.id]?.b ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_3" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.h3 ?? defs1[dk.id]?.c ?? ''}" placeholder="0" /></td>
                  <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="dtc_jdef_${dk.id}_1_4" class="form-control dtc-jqty-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${defs1[dk.id]?.h4 ?? ''}" placeholder="0" /></td>
                </tr>
              `).join('')}

              <!-- 불량합계 -->
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">불량합계</td>
                <td id="dtc_jdef_sum_1_1" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_1_2" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_1_3" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="dtc_jdef_sum_1_4" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <input type="hidden" id="targetQty" value="0" />
        <input type="hidden" id="actualQty" value="0" />
        <input type="hidden" id="defectQty" value="0" />
      </div>
    `;
  }

  export function getDtCrewPrepQtyHTML(ed, container) {
    const q = ed?.dtCrewPrepQty || ed?.qtyData || {};
    const formCode = getCurrentFormCode();
    const lhHeader = (formCode === 2023) ? 'LH D' : 'LH A';
    const rhHeader = (formCode === 2023) ? 'RH D' : 'RH A';
    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
          📊 <span class="sec-num"></span> 생산실적
        </label>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px 2px; width: 35%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 32.5%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">${lhHeader}</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 32.5%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">${rhHeader}</th>
              </tr>
            </thead>
            <tbody>
              <!-- 생산량 -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #e2e8f0; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle; width: 20%;">생산량</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; width: 15%;">계획</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_LH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_LH_A ?? q.targetQty ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_RH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_RH_A ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">실적</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_LH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_LH_A ?? q.actualQty ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_RH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_RH_A ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 압출소재 불량 -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 6px 4px; background: #e2e8f0; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">압출소재<br>불량</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">스 코 치</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_LH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_LH_A ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_RH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_RH_A ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">외면오염</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_LH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_LH_A ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_RH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_RH_A ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">기타[ ]</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_other_LH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_other_LH_A ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_other_RH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_other_RH_A ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 공정간불량 -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 6px 4px; background: #e2e8f0; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">공정간불량</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">길이불량</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_LH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_LH_A ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_RH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_RH_A ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">단면불량</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_sec_LH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_sec_LH_A ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_sec_RH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_sec_RH_A ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">기타[ ]</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_other_LH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_other_LH_A ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_other_RH_A" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_other_RH_A ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 불량 합계 -->
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #e2e8f0; font-weight: 700; color: #000; font-size: 12px;">불량 합계</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; color: var(--accent-rose); font-size: 12px;"><span id="def_sum_LH_A">0</span></td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; color: var(--accent-rose); font-size: 12px;"><span id="def_sum_RH_A">0</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <input type="hidden" id="targetQty" value="0" />
        <input type="hidden" id="actualQty" value="0" />
        <input type="hidden" id="defectQty" value="0" />
      </div>
    `;
  }

  export function getForm4011QtyHTML(ed, container) {
    const q = ed && ed.qtyTable ? ed.qtyTable : {};
    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 (Production Results)
        </label>
        <input type="hidden" id="targetQty" value="${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="${ed ? ed.defectQty : '0'}" />
        <div style="overflow-x: auto;">
          <table id="jg1QtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 30%;">구 분(Division)</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 70%;">Frunk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle; width: 16%;">생산량(Q,TY)</td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; width: 13%;">계획</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_FL ?? '300'}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">실적</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">압출소재불량<br>(Extrusion Badness)</td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">스코치(Scortch)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">외면흠 (Scratch)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scratch_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">후로킹 (Flock,g)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_flock_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">오염 (Contamination)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">공정간불량<br>(Process Badness)</td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">길이 (Length)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">컷팅 (Cutting)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_cut_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">찍힘/변형</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_deform_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_deform_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">기타불량<br>(Etc Badness)</td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">조인트 (Joint)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_etc_joint_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.etc_joint_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">기타 (Etc)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_etc_other_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.etc_other_FL ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">합계</td>
                <td style="border: 1px solid #000; padding: 2px; font-weight: bold; background: #f8f9fa;"><span id="def_sum_FL">0</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  export function getStandardQtyHTML(ed, container) {
    const q = ed && ed.qtyTable ? ed.qtyTable : {};
    const processValue = container ? container.querySelector('#processValue') : null;
    const curProc = processValue ? processValue.value : '';
    const sectionTitleLabel = curProc === '검사포장' ? '📊 <span class="sec-num"></span> 생산실적(검사)' : '📊 <span class="sec-num"></span> 생산실적 (Production Results)';

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          ${sectionTitleLabel}
        </label>

        <input type="hidden" id="targetQty" value="${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="${ed ? ed.defectQty : '0'}" />

        <div style="overflow-x: auto;">
          <table id="jg1QtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 30%;">
                  구 분(Division)
                </th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 17.5%;">FRT LH</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 17.5%;">FRT RH</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 17.5%;">RR LH</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 17.5%;">RR RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 생산량(Q,TY) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle; width: 16%;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; width: 14%;">
                  계획
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_RR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  실적
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_RR ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 2. 압출소재불량(Extrusion Badness) -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">
                  압출소재불량<br>(Extrusion Badness)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  스코치(Scortch)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_RR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  외면흠 (Scratch)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scratch_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scratch_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scratch_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scratch_RR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  후로킹 (Flock,g)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_flock_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_flock_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_flock_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_flock_RR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  오염 (Contamination)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_RR ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 3. 공정간불량(Process Badness) -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">
                  공정간불량<br>(Process Badness)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  길이 (Length)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_RR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  컷팅 (Cutting)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_cut_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_cut_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_cut_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_cut_RR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  기타 (The others)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_oth_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_oth_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_oth_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_oth_FR ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_oth_RL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_oth_RL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_oth_RR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_oth_RR ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 4. 불량합계(Total) -->
              <tr style="background: #fffde7; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; color: var(--accent-rose);">
                  불량합계(Total)
                </td>
                <td id="def_sum_FL" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="def_sum_FR" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="def_sum_RL" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="def_sum_RR" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  export function getJointQtyHTML(ed, container) {
    const q = ed && ed.jointQtyTable ? ed.jointQtyTable : {};
    const cols = [
      { id: 'frt_p', label: 'FRT(P)_L/R' },
      { id: 'frt_q', label: 'FRT(Q)_L/R' },
      { id: 'rr_r', label: 'RR(R)_L/R' },
      { id: 'rr_s_lh', label: 'RR(S)_LH' },
      { id: 'rr_s_rh', label: 'RR(S)_RH' }
    ];

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 (Production Results - 조인트)
        </label>

        <input type="hidden" id="targetQty" value="${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="${ed ? ed.defectQty : '0'}" />

        <div style="overflow-x: auto;">
          <table id="jointQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                ${cols.map(c => `<th style="border: 1px solid #000; padding: 6px; width: 16%;">${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <!-- 1. 생산량 (Q,TY) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  계획(P)
                </td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="jqty_plan_${c.id}" class="form-control jqty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q['plan_' + c.id] ?? ''}" placeholder="0" />
                  </td>
                `).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  실적(O)
                </td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="jqty_act_${c.id}" class="form-control jqty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; color: var(--accent-blue);" value="${q['act_' + c.id] ?? ''}" placeholder="0" />
                  </td>
                `).join('')}
              </tr>

              <!-- 2. 공정간불량 (Process Badness) -->
              <tr>
                <td rowspan="8" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  공정간불량<br>(Process<br>Badness)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  떨어짐(Split)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_split_${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['split_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  밀림(Push)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_push_${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['push_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  양부족<br><span style="font-size: 9px; font-weight: normal;">(lack of quantity)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_lack_${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['lack_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  넘침(overflowing)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_over_${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['over_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  기포 (Air bubbles)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_bubble_${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['bubble_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  찌꺼기(worthless)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_scrap_${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['scrap_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  삽입불량(Bad insert)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_insert_${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['insert_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  기타(The others)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_oth_${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['oth_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>

              <!-- 3. 불량합계 (Total) -->
              <tr style="background: #fffde7; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; color: var(--accent-rose);">
                  불량합계(Total)
                </td>
                ${cols.map(c => `<td id="jdef_sum_${c.id}" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  export function getPostQtyHTML(ed, container) {
    const q = ed && ed.postQtyTable ? ed.postQtyTable : {};
    const cols = [
      { id: 'fl', label: 'FRT LH' },
      { id: 'fr', label: 'FRT RH' },
      { id: 'rl', label: 'RR LH' },
      { id: 'rr', label: 'RR RH' }
    ];

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 (Production Results - 후가공)
        </label>

        <input type="hidden" id="targetQty" value="${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="${ed ? ed.defectQty : '0'}" />

        <div style="overflow-x: auto;">
          <table id="postQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분</th>
                ${cols.map(c => `<th style="border: 1px solid #000; padding: 6px; width: 20%;">${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <!-- 1. 생산량 (the amount of production) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  생산량<br>(the amount of<br>production)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  계획
                </td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="pqty_plan_${c.id}" class="form-control pqty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="${q['plan_' + c.id] ?? ''}" placeholder="0" />
                  </td>
                `).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  실적
                </td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="pqty_act_${c.id}" class="form-control pqty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; color: var(--accent-blue);" value="${q['act_' + c.id] ?? ''}" placeholder="0" />
                  </td>
                `).join('')}
              </tr>

              <!-- 2. 조인트 불량 (Poor joint) -->
              <tr>
                <td rowspan="7" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  조인트<br>불량<br>(Poor joint)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  떨어짐<br><span style="font-size: 9px; font-weight: normal;">(Dropped)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_j_drop_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['j_drop_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  양부족<br><span style="font-size: 9px; font-weight: normal;">(lack of quantity)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_j_lack_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['j_lack_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  단차<br><span style="font-size: 9px; font-weight: normal;">(a step difference)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_j_step_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['j_step_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  기포<br><span style="font-size: 9px; font-weight: normal;">(Air bubbles)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_j_bubble_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['j_bubble_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  씹힘<br><span style="font-size: 9px; font-weight: normal;">(Chewing)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_j_chew_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['j_chew_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  찌꺼기<br><span style="font-size: 9px; font-weight: normal;">(worthless)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_j_scrap_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['j_scrap_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  기타(etc)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_j_oth_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['j_oth_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>

              <!-- 3. 조인트 불량 합계 (Sum Defects) -->
              <tr style="background: #fffde7; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">
                  불량 합계(Sum Defects)
                </td>
                ${cols.map(c => `<td id="pdef_j_sum_${c.id}" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>`).join('')}
              </tr>

              <!-- 4. 후가공 불량 (Bad post-processing) -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  후가공<br>불량<br>(Bad post-<br>processing)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  사상불량<br><span style="font-size: 9px; font-weight: normal;">(trimming N.G)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_p_trim_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['p_trim_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  오염<br><span style="font-size: 9px; font-weight: normal;">(Pollution)</span>
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_p_poll_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['p_poll_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  기타(etc)
                </td>
                ${cols.map(c => `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="pdef_p_oth_${c.id}" class="form-control pqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="${q['p_oth_' + c.id] ?? ''}" placeholder="0" /></td>`).join('')}
              </tr>

              <!-- 5. 후가공 불량 합계 (Sum Defects) -->
              <tr style="background: #fffde7; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">
                  불량 합계(Sum Defects)
                </td>
                ${cols.map(c => `<td id="pdef_p_sum_${c.id}" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  export function getKmKxInspQtyHTML(ed, container) {
    const inspData = ed && ed.inspQtyTable ? ed.inspQtyTable : {};
    const cols = [1, 2];
    const colWidth = '36%';
    const labelWidth = '28%';

    const allWorkers = store.getWorkers();
    let postWorkers = allWorkers.filter(w => w.process && w.process.includes('후가공'));
    if (postWorkers.length === 0) {
      postWorkers = allWorkers;
    }

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
          📊 <span class="sec-num"></span> 검사실적
        </label>

        <input type="hidden" id="targetQty" value="${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="${ed ? ed.defectQty : '0'}" />

        <div style="overflow-x: auto;">
          <table id="inspQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px 2px; width: ${labelWidth}; font-size: 12px;">구 분</th>
                ${cols.map(c => `
                  <th style="border: 1px solid #000; padding: 6px 2px; width: ${colWidth};">
                    <span style="font-weight: 800; font-size: 13px; color: var(--accent-blue);">HOOD</span>
                    <input type="hidden" id="insp_lh_${c}" value="true" />
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <!-- 작업자 -->
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #ffffff;">작업자</td>
                ${cols.map(c => {
                  const selWorker = inspData[`worker_${c}`] || '';
                  const options = postWorkers.map(w => `<option value="${w.name}" ${selWorker === w.name ? 'selected' : ''}>${w.name}</option>`).join('');
                  const customOpt = (selWorker && !postWorkers.some(w => w.name === selWorker)) ? `<option value="${selWorker}" selected>${selWorker}</option>` : '';
                  return `
                    <td style="border: 1px solid #000; padding: 2px;">
                      <select id="insp_worker_${c}" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px 2px; background:transparent; font-weight: 600;">
                        <option value="">작업자 선택</option>
                        ${options}
                        ${customOpt}
                      </select>
                    </td>
                  `;
                }).join('')}
              </tr>

              <!-- 제품수량 (3행) -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 4px; font-weight: 700; background: #ffffff; vertical-align: middle; width: 12%;">제 품<br>수 량</td>
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #ffffff; text-align: center; width: 16%;">검 사 수</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="insp_inspect_qty_${c}" min="0" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent; color: var(--accent-blue);" value="${inspData[`inspect_qty_${c}`] || ''}" placeholder="자동합산" />
                  </td>
                `).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #ffffff; text-align: center;">정 품 수</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="insp_good_qty_${c}" min="0" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent; color: var(--accent-blue);" value="${inspData[`good_qty_${c}`] || ''}" placeholder="0" />
                  </td>
                `).join('')}
              </tr>
              <tr style="background: #e2e8f0;">
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #e2e8f0; text-align: center;">불량합계</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px; background: #e2e8f0;">
                    <input type="number" id="insp_total_defect_${c}" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent; color: var(--accent-rose);" value="${inspData[`total_defect_${c}`] || ''}" />
                  </td>
                `).join('')}
              </tr>

              <!-- 압출소재불량 (7행) -->
              ${[
                { label: '스 코 치', key: 'scorch' },
                { label: '외 면 흠', key: 'scratch' },
                { label: '오염/코팅불량', key: 'contam' },
                { label: '길 이 불 량', key: 'len' },
                { label: '소재클립누락', key: 'clip' },
                { label: '기 타', key: 'oth' }
              ].map((row, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="7" style="border: 1px solid #000; padding: 4px; font-weight: 700; background: #ffffff; vertical-align: middle;">압 출<br>소 재<br>불 량</td>` : ''}
                  <td style="border: 1px solid #000; padding: 4px 2px; background: #ffffff; text-align: center;">${row.label}</td>
                  ${cols.map(c => `
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="number" min="0" id="insp_ext_${row.key}_${c}" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px 2px; background:transparent;" value="${inspData[`ext_${row.key}_${c}`] || ''}" />
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
              <tr style="background: #f1f5f9;">
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #f1f5f9; text-align: center;">소 계</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px; background: #f1f5f9;">
                    <input type="number" id="insp_ext_subtotal_${c}" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent;" value="${inspData[`ext_subtotal_${c}`] || ''}" />
                  </td>
                `).join('')}
              </tr>

              <!-- 조인트불량 (11행) -->
              ${[
                { label: '떨어짐/찢어짐', key: 'drop' },
                { label: '양 부 족', key: 'lack' },
                { label: '밀림 / 크랙', key: 'push' },
                { label: '기 포', key: 'bubble' },
                { label: '씹힘/삽입불량', key: 'chew' },
                { label: '넘침/오버랩', key: 'overflow' },
                { label: '후 변 형', key: 'deform' },
                { label: '이 물 질', key: 'foreign' },
                { label: '꼬 임', key: 'twist' },
                { label: '기 타', key: 'oth' }
              ].map((row, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="11" style="border: 1px solid #000; padding: 4px; font-weight: 700; background: #ffffff; vertical-align: middle;">조 인 트<br>불 량</td>` : ''}
                  <td style="border: 1px solid #000; padding: 4px 2px; background: #ffffff; text-align: center;">${row.label}</td>
                  ${cols.map(c => `
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="number" min="0" id="insp_j_${row.key}_${c}" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px 2px; background:transparent;" value="${inspData[`j_${row.key}_${c}`] || ''}" />
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
              <tr style="background: #f1f5f9;">
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #f1f5f9; text-align: center;">불 량 수</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px; background: #f1f5f9;">
                    <input type="number" id="insp_j_subtotal_${c}" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent;" value="${inspData[`j_subtotal_${c}`] || ''}" />
                  </td>
                `).join('')}
              </tr>

              <!-- 후가공불량 (14행) -->
              ${[
                { label: '과 사 상', key: 'trim_over' },
                { label: '미 사 상', key: 'trim_under' },
                { label: '본 드 오 염', key: 'bond_contam' },
                { label: '외 면 오 염', key: 'ext_contam' },
                { label: '클립누락/반클', key: 'clip_miss' },
                { label: '클립홀누락', key: 'clip_hole' },
                { label: '드레인홀불량', key: 'drain_hole' },
                { label: '클립이종', key: 'wrong_clip' },
                { label: '절 단 누 락', key: 'cut_miss' },
                { label: '본드누락/접착불량', key: 'bond_miss' },
                { label: '길 이 초 과', key: 'len_excess' },
                { label: '클립간격불량', key: 'clip_pitch' },
                { label: '기 타', key: 'oth' }
              ].map((row, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="14" style="border: 1px solid #000; padding: 4px; font-weight: 700; background: #ffffff; vertical-align: middle;">후 가 공<br>불 량</td>` : ''}
                  <td style="border: 1px solid #000; padding: 4px 2px; background: #ffffff; text-align: center;">${row.label}</td>
                  ${cols.map(c => `
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="number" min="0" id="insp_p_${row.key}_${c}" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px 2px; background:transparent;" value="${inspData[`p_${row.key}_${c}`] || ''}" />
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
              <tr style="background: #f1f5f9;">
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #f1f5f9; text-align: center;">불 량 수</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px; background: #f1f5f9;">
                    <input type="number" id="insp_p_subtotal_${c}" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent;" value="${inspData[`p_subtotal_${c}`] || ''}" />
                  </td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  export function getInspQtyHTML(ed, colCount = 4, autoInspectQty = false, container) {
    const inspData = ed && ed.inspQtyTable ? ed.inspQtyTable : {};
    const cols = Array.from({ length: colCount }, (_, i) => i + 1);
    const colWidth = colCount === 2 ? '36%' : '18%';
    const labelWidth = colCount === 2 ? '28%' : '28%';

    const allWorkers = store.getWorkers();
    let postWorkers = allWorkers.filter(w => w.process && w.process.includes('후가공'));
    if (postWorkers.length === 0) {
      postWorkers = allWorkers;
    }

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
          📊 <span class="sec-num"></span> 검사실적
        </label>

        <input type="hidden" id="targetQty" value="${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="${ed ? ed.defectQty : '0'}" />

        <div style="overflow-x: auto;">
          <table id="inspQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px 2px; width: ${labelWidth}; font-size: 12px;">구 분</th>
                ${cols.map(c => `
                  <th style="border: 1px solid #000; padding: 4px 2px; width: ${colWidth};">
                    <label style="margin-right: 4px; font-weight: 700; cursor: pointer;">
                      <input type="checkbox" id="insp_lh_${c}" ${inspData[`lh_${c}`] ? 'checked' : ''} /> LH
                    </label>
                    <label style="font-weight: 700; cursor: pointer;">
                      <input type="checkbox" id="insp_rh_${c}" ${inspData[`rh_${c}`] ? 'checked' : ''} /> RH
                    </label>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <!-- 작업자 -->
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #ffffff;">작업자</td>
                ${cols.map(c => {
                  const selWorker = inspData[`worker_${c}`] || '';
                  const options = postWorkers.map(w => `<option value="${w.name}" ${selWorker === w.name ? 'selected' : ''}>${w.name}</option>`).join('');
                  const customOpt = (selWorker && !postWorkers.some(w => w.name === selWorker)) ? `<option value="${selWorker}" selected>${selWorker}</option>` : '';
                  return `
                    <td style="border: 1px solid #000; padding: 2px;">
                      <select id="insp_worker_${c}" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px 2px; background:transparent; font-weight: 600;">
                        <option value="">작업자 선택</option>
                        ${options}
                        ${customOpt}
                      </select>
                    </td>
                  `;
                }).join('')}
              </tr>

              <!-- 제품수량 (3행) -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 4px; font-weight: 700; background: #ffffff; vertical-align: middle; width: 12%;">제 품<br>수 량</td>
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #ffffff; text-align: center; width: 16%;">검 사 수</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="insp_inspect_qty_${c}" min="0" ${autoInspectQty ? 'readonly' : ''} class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent; ${autoInspectQty ? 'color: var(--accent-blue);' : ''}" value="${inspData[`inspect_qty_${c}`] || ''}" placeholder="${autoInspectQty ? '자동합산' : ''}" />
                  </td>
                `).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #ffffff; text-align: center;">정 품 수</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="insp_good_qty_${c}" min="0" ${autoInspectQty ? '' : 'readonly'} class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent; color: var(--accent-blue);" value="${inspData[`good_qty_${c}`] || ''}" placeholder="${autoInspectQty ? '0' : ''}" />
                  </td>
                `).join('')}
              </tr>
              <tr style="background: #e2e8f0;">
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #e2e8f0; text-align: center;">불량합계</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px; background: #e2e8f0;">
                    <input type="number" id="insp_total_defect_${c}" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent; color: var(--accent-rose);" value="${inspData[`total_defect_${c}`] || ''}" />
                  </td>
                `).join('')}
              </tr>

              <!-- 압출소재불량 (7행) -->
              ${[
                { label: '스 코 치', key: 'scorch' },
                { label: '외 면 흠', key: 'scratch' },
                { label: '오염/코팅불량', key: 'contam' },
                { label: '길 이 불 량', key: 'len' },
                { label: '소재클립누락', key: 'clip' },
                { label: '기 타', key: 'oth' }
              ].map((row, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="7" style="border: 1px solid #000; padding: 4px; font-weight: 700; background: #ffffff; vertical-align: middle;">압 출<br>소 재<br>불 량</td>` : ''}
                  <td style="border: 1px solid #000; padding: 4px 2px; background: #ffffff; text-align: center;">${row.label}</td>
                  ${cols.map(c => `
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="number" min="0" id="insp_ext_${row.key}_${c}" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px 2px; background:transparent;" value="${inspData[`ext_${row.key}_${c}`] || ''}" />
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
              <tr style="background: #f1f5f9;">
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #f1f5f9; text-align: center;">소 계</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px; background: #f1f5f9;">
                    <input type="number" id="insp_ext_subtotal_${c}" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent;" value="${inspData[`ext_subtotal_${c}`] || ''}" />
                  </td>
                `).join('')}
              </tr>

              <!-- 조인트불량 (11행) -->
              ${[
                { label: '떨어짐/찢어짐', key: 'drop' },
                { label: '양 부 족', key: 'lack' },
                { label: '밀림 / 크랙', key: 'push' },
                { label: '기 포', key: 'bubble' },
                { label: '씹힘/삽입불량', key: 'chew' },
                { label: '넘침/오버랩', key: 'overflow' },
                { label: '후 변 형', key: 'deform' },
                { label: '이 물 질', key: 'foreign' },
                { label: '꼬 임', key: 'twist' },
                { label: '기 타', key: 'oth' }
              ].map((row, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="11" style="border: 1px solid #000; padding: 4px; font-weight: 700; background: #ffffff; vertical-align: middle;">조 인 트<br>불 량</td>` : ''}
                  <td style="border: 1px solid #000; padding: 4px 2px; background: #ffffff; text-align: center;">${row.label}</td>
                  ${cols.map(c => `
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="number" min="0" id="insp_j_${row.key}_${c}" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px 2px; background:transparent;" value="${inspData[`j_${row.key}_${c}`] || ''}" />
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
              <tr style="background: #f1f5f9;">
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #f1f5f9; text-align: center;">불 량 수</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px; background: #f1f5f9;">
                    <input type="number" id="insp_j_subtotal_${c}" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent;" value="${inspData[`j_subtotal_${c}`] || ''}" />
                  </td>
                `).join('')}
              </tr>

              <!-- 후가공불량 (14행) -->
              ${[
                { label: '과 사 상', key: 'trim_over' },
                { label: '미 사 상', key: 'trim_under' },
                { label: '본 드 오 염', key: 'bond_contam' },
                { label: '외 면 오 염', key: 'ext_contam' },
                { label: '클립누락/반클', key: 'clip_miss' },
                { label: '클립홀누락', key: 'clip_hole' },
                { label: '드레인홀불량', key: 'drain_hole' },
                { label: '클립이종', key: 'wrong_clip' },
                { label: '절 단 누 락', key: 'cut_miss' },
                { label: '본드누락/접착불량', key: 'bond_miss' },
                { label: '길 이 초 과', key: 'len_excess' },
                { label: '클립간격불량', key: 'clip_pitch' },
                { label: '기 타', key: 'oth' }
              ].map((row, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="14" style="border: 1px solid #000; padding: 4px; font-weight: 700; background: #ffffff; vertical-align: middle;">후 가 공<br>불 량</td>` : ''}
                  <td style="border: 1px solid #000; padding: 4px 2px; background: #ffffff; text-align: center;">${row.label}</td>
                  ${cols.map(c => `
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="number" min="0" id="insp_p_${row.key}_${c}" class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px 2px; background:transparent;" value="${inspData[`p_${row.key}_${c}`] || ''}" />
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
              <tr style="background: #f1f5f9;">
                <td style="border: 1px solid #000; padding: 4px 2px; font-weight: 700; background: #f1f5f9; text-align: center;">불 량 수</td>
                ${cols.map(c => `
                  <td style="border: 1px solid #000; padding: 2px; background: #f1f5f9;">
                    <input type="number" id="insp_p_subtotal_${c}" readonly class="form-control" style="width:100%; border:none; text-align:center; font-size:11px; font-weight:700; padding:4px 2px; background:transparent;" value="${inspData[`p_subtotal_${c}`] || ''}" />
                  </td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }


  export function getForm4001QtyHTML(ed, container) {
    const q = ed && ed.qtyTable ? ed.qtyTable : {};
    const processValue = container ? container.querySelector('#processValue') : null;
    const curProc = processValue ? processValue.value : '';
    const sectionTitleLabel = curProc === '검사포장' ? '📊 <span class="sec-num"></span> 생산실적(검사)' : '📊 <span class="sec-num"></span> 생산실적 (Production Results)';

    return `
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          ${sectionTitleLabel}
        </label>

        <input type="hidden" id="targetQty" value="${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="${ed ? ed.defectQty : '0'}" />

        <div style="overflow-x: auto;">
          <table id="jg1QtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 30%;">
                  구 분(Division)
                </th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 35%;">LH</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 35%;">RH</th>
                
              </tr>
            </thead>
            <tbody>
              <!-- 1. 생산량(Q,TY) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle; width: 16%;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; width: 14%;">
                  계획
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.plan_FR ?? ''}" placeholder="0" /></td>
                
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  실적
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.act_FR ?? ''}" placeholder="0" /></td>
                
              </tr>

              <!-- 2. 압출소재불량(Extrusion Badness) -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">
                  압출소재불량<br>(Extrusion Badness)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  스코치(Scortch)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scorch_FR ?? ''}" placeholder="0" /></td>
                
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  외면흠 (Scratch)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scratch_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_scratch_FR ?? ''}" placeholder="0" /></td>
                
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  후로킹 (Flock,g)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_flock_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_flock_FR ?? ''}" placeholder="0" /></td>
                
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  오염 (Contamination)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.ext_contam_FR ?? ''}" placeholder="0" /></td>
                
              </tr>

              <!-- 3. 공정간불량(Process Badness) -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">
                  공정간불량<br>(Process Badness)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  길이 (Length)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_len_FR ?? ''}" placeholder="0" /></td>
                
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  컷팅 (Cutting)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_cut_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_cut_FR ?? ''}" placeholder="0" /></td>
                
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  기타 (The others)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_oth_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_oth_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_oth_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${q.proc_oth_FR ?? ''}" placeholder="0" /></td>
                
              </tr>

              <!-- 4. 불량합계(Total) -->
              <tr style="background: #fffde7; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; color: var(--accent-rose);">
                  불량합계(Total)
                </td>
                <td id="def_sum_FL" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="def_sum_FR" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="def_sum_RL" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="def_sum_RR" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
