const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/components/DynamicForms/FormTemplates.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const regexB = /<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">[\s\S]*?<\/table>/;
// Wait, regexB will match the FIRST table if we are not careful.
// We need to make sure we match the SECOND table which is Section B.
// We already replaced the first table, so it now matches the NEW table A if we use a greedy or first match!
// Let's split the file at "B. ${carName} 'B' 클립머신" and replace the table after that.

const parts = content.split("B. ${carName} 'B' 클립머신");
if (parts.length > 1) {
    const tableRegex = /<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">[\s\S]*?<\/table>/;
    const newTableB = `<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">
              <colgroup>
                \${isQuad ? \`
                  <col style="width:14%">
                  <col style="width:10%">
                  <col style="width:38%">
                  <col style="width:38%">
                \` : \`
                  <col style="width:14%">
                  <col style="width:10%">
                  <col style="width:19%">
                  <col style="width:19%">
                  <col style="width:19%">
                  <col style="width:19%">
                \`}
              </colgroup>
              <thead>
                <tr>
                  <th rowspan="2" colspan="2" style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-main); padding:8px 4px; font-weight:800; vertical-align:middle;">구분</th>
                  \${isQuad ? \`
                    <th colspan="1" style="border:1px solid var(--border-color); background:#eff6ff; color:#1d4ed8; padding:8px 4px; font-weight:800;">LH</th>
                    <th colspan="1" style="border:1px solid var(--border-color); background:#f0fdf4; color:#15803d; padding:8px 4px; font-weight:800;">RH</th>
                  \` : \`
                    <th colspan="2" style="border:1px solid var(--border-color); background:#eff6ff; color:#1d4ed8; padding:8px 4px; font-weight:800;">LH</th>
                    <th colspan="2" style="border:1px solid var(--border-color); background:#f0fdf4; color:#15803d; padding:8px 4px; font-weight:800;">RH</th>
                  \`}
                </tr>
                <tr>
                  \${isQuad ? \`
                    <th style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-size:11px; padding:4px;">3호</th>
                    <th style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-size:11px; padding:4px;">2호</th>
                  \` : \`
                    <th style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-size:11px; padding:4px;">3호</th>
                    <th style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-size:11px; padding:4px;">4호</th>
                    <th style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-size:11px; padding:4px;">2호</th>
                    <th style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-size:11px; padding:4px;">4호</th>
                  \`}
                </tr>
              </thead>
              <tbody>
                <!-- 전장길이 -->
                <tr>
                  <td rowspan="4" style="border:1px solid var(--border-color); background:#f1f5f9; color:var(--text-main); font-weight:800; vertical-align:middle; padding:6px 4px;">전장길이</td>
                  <td colspan="\${isQuad ? '3' : '5'}" style="border:1px solid var(--border-color); background:#fef9c3; color:#a16207; font-weight:800; padding:6px;">2699±6mm</td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">초</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH3_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_LH3_초')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH4_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_LH4_초')}"></td>\`}
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH2_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_RH2_초')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH4_초" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_RH4_초')}"></td>\`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">중</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH3_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_LH3_중')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH4_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_LH4_중')}"></td>\`}
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH2_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_RH2_중')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH4_중" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_RH4_중')}"></td>\`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">종</td>
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH3_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_LH3_종')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_LH4_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_LH4_종')}"></td>\`}
                  <td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH2_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_RH2_종')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px solid var(--border-color); padding:3px;"><input type="number" id="dtcb_len_RH4_종" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('len_RH4_종')}"></td>\`}
                </tr>

                <!-- 끝단 클립 -->
                <tr>
                  <td rowspan="7" style="border:1px solid var(--border-color); background:#f1f5f9; color:var(--text-main); font-weight:800; vertical-align:middle; padding:6px 4px;">끝단 클립</td>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">스펙</td>
                  <td colspan="\${isQuad ? '1' : '2'}" style="border:1px solid var(--border-color); background:#e0f2fe; color:#0369a1; font-weight:700; padding:5px 2px; font-size:11px;">(좌측) 28±1</td>
                  <td colspan="\${isQuad ? '1' : '2'}" style="border:1px solid var(--border-color); background:#d1fae5; color:#047857; font-weight:700; padding:5px 2px; font-size:11px;">(우측) 28±1</td>
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">초(좌)</td>
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH3_초좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH3_초좌')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH4_초좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH4_초좌')}"></td>\`}
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH2_초좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH2_초좌')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH4_초좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH4_초좌')}"></td>\`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">초(우)</td>
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH3_초우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH3_초우')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH4_초우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH4_초우')}"></td>\`}
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH2_초우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH2_초우')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH4_초우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH4_초우')}"></td>\`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">중(좌)</td>
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH3_중좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH3_중좌')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH4_중좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH4_중좌')}"></td>\`}
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH2_중좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH2_중좌')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH4_중좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH4_중좌')}"></td>\`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">중(우)</td>
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH3_중우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH3_중우')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH4_중우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH4_중우')}"></td>\`}
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH2_중우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH2_중우')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH4_중우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH4_중우')}"></td>\`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">종(좌)</td>
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH3_종좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH3_종좌')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_LH4_종좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH4_종좌')}"></td>\`}
                  <td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH2_종좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH2_종좌')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-bottom:none; padding:3px;"><input type="number" id="dtcb_clip_RH4_종좌" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH4_종좌')}"></td>\`}
                </tr>
                <tr>
                  <td style="border:1px solid var(--border-color); background:#f8fafc; color:var(--text-muted); font-size:11px; padding:4px;">종(우)</td>
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH3_종우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH3_종우')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_LH4_종우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_LH4_종우')}"></td>\`}
                  <td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH2_종우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH2_종우')}"></td>
                  \${isQuad ? '' : \`<td style="border:1px dashed #94a3b8; border-top:none; padding:3px; background:#f8fafc;"><input type="number" id="dtcb_clip_RH4_종우" class="form-control" style="font-size:11px; padding:3px; text-align:center;" placeholder="-" value="\${gb('clip_RH4_종우')}"></td>\`}
                </tr>
              </tbody>
            </table>`;
    
    parts[1] = parts[1].replace(tableRegex, newTableB);
    content = parts.join("B. ${carName} 'B' 클립머신");
    fs.writeFileSync(filePath, content);
    console.log('Section B fixed!');
}
