const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'src/components/DynamicForms/LeaderFormRenderer.js');
let content1 = fs.readFileSync(file1, 'utf8');

const regex1 = /\$\{\s*isHood\s*\?\s*`[\s\S]*?`\s*:\s*hasD\s*\?\s*`[\s\S]*?`\s*:\s*`[\s\S]*?`\s*\}/g;

const replacement1 = `\${isHood ? \`
                      <td style="border: 1px solid #000; padding: 4px;" colspan="4">
                        <div style="display: flex; gap: 8px;">
                          <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 10px; color: var(--text-muted); white-space: nowrap;" data-i18n="leader_center">센터:</span>
                            <input type="number" class="form-control leader-scrap-center" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapCenter || ''}" placeholder="0" />
                          </div>
                          <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 10px; color: var(--text-muted); white-space: nowrap;" data-i18n="leader_side">사이드:</span>
                            <input type="number" class="form-control leader-scrap-side" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapSide || ''}" placeholder="0" />
                          </div>
                        </div>
                      </td>
                    \` : hasD ? \`
                      <td style="border: 1px solid #000; padding: 4px;" colspan="4">
                        <div style="display: flex; gap: 4px;">
                          <input type="number" class="form-control leader-scrap-a" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapA || ''}" placeholder="A" />
                          <input type="number" class="form-control leader-scrap-b" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapB || ''}" placeholder="B" />
                          <input type="number" class="form-control leader-scrap-c" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapC || ''}" placeholder="C" />
                          <input type="number" class="form-control leader-scrap-d" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapD || ''}" placeholder="D" />
                        </div>
                      </td>
                    \` : \`
                      <td style="border: 1px solid #000; padding: 4px;" colspan="4">
                        <div style="display: flex; gap: 4px;">
                          <input type="number" class="form-control leader-scrap-a" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapA || ''}" placeholder="A" />
                          <input type="number" class="form-control leader-scrap-b" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapB || ''}" placeholder="B" />
                          <input type="number" class="form-control leader-scrap-c" data-seq="\${it.seq}" style="flex: 1; min-width: 0; padding: 4px; text-align: right;" value="\${it.scrapC || ''}" placeholder="C" />
                        </div>
                      </td>
                    \`}`;

content1 = content1.replace(regex1, replacement1);
fs.writeFileSync(file1, content1);

console.log('Fixed LeaderFormRenderer.js');
