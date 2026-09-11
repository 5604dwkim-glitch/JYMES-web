const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/components/DynamicForms/FormTemplates.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The block for Section A is from <table ...> for A up to </table>
// I will use regex to find and replace the whole tables.

// 1. Replace Section A table
const regexA = /<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">[\s\S]*?<\/table>/;

const newTableA = `<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">
              <colgroup>
                <col style="width:14%">
                <col style="width:10%">
                <col style="width:19%">
                <col style="width:19%">
                <col style="width:19%">
                <col style="width:19%">
              </colgroup>
              <thead>
                <tr>
                  <th colspan="2" style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-main); padding:8px 4px; font-weight:800;">구분</th>
                  <th colspan="2" style="border:1px solid var(--border-color); background:#eff6ff; color:#1d4ed8; padding:8px 4px; font-weight:800;">LH</th>
                  <th colspan="2" style="border:1px solid var(--border-color); background:#f0fdf4; color:#15803d; padding:8px 4px; font-weight:800;">RH</th>
                </tr>
              </thead>
              <tbody>
                <!-- 전장길이 -->
                <tr>
                  <td rowspan="4" style="border:1px solid var(--border-color); background:#f1f5f9; color:var(--text-main); font-weight:800; vertical-align:middle; padding:6px 4px;">전장길이</td>
                  <td colspan="5" style="border:1px solid var(--border-color); background:#fef9c3; color:#a16207; font-weight:800; padding:6px;">779±5mm</td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">초</td>
                  <td colspan="2" style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_LH_초" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="\${g('len_LH_초')}"></td>
                  <td colspan="2" style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_RH_초" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="\${g('len_RH_초')}"></td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">중</td>
                  <td colspan="2" style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_LH_중" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="\${g('len_LH_중')}"></td>
                  <td colspan="2" style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_RH_중" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="\${g('len_RH_중')}"></td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">종</td>
                  <td colspan="2" style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_LH_종" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="\${g('len_LH_종')}"></td>
                  <td colspan="2" style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_len_RH_종" class="form-control" style="font-size:12px; padding:4px; text-align:center;" placeholder="-" value="\${g('len_RH_종')}"></td>
                </tr>

                <!-- 끝단 클립 -->
                <tr>
                  <td rowspan="4" style="border:1px solid var(--border-color); background:#f1f5f9; color:var(--text-main); font-weight:800; vertical-align:middle; padding:6px 4px;">끝단 클립</td>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">스펙</td>
                  <td style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-weight:700; padding:5px 2px; font-size:11px;">121±1</td>
                  <td style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-weight:700; padding:5px 2px; font-size:11px;">28±1</td>
                  <td style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-weight:700; padding:5px 2px; font-size:11px;">28±1</td>
                  <td style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-weight:700; padding:5px 2px; font-size:11px;">121±1</td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">초</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH1_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_LH1_초')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH2_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_LH2_초')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH1_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_RH1_초')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH2_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_RH2_초')}"></td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">중</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH1_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_LH1_중')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH2_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_LH2_중')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH1_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_RH1_중')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH2_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_RH2_중')}"></td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">종</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH1_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_LH1_종')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_LH2_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_LH2_종')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH1_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_RH1_종')}"></td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtc_clip_RH2_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${g('clip_RH2_종')}"></td>
                </tr>
              </tbody>
            </table>`;

content = content.replace(regexA, newTableA);

fs.writeFileSync(filePath, content);
console.log('Section A fixed!');
