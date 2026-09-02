const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

const badStr = `                        <input type="text" id="dim_cut_FRT_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="\${d['cut_FRT_초'] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(중)</span>
                        <input type="text" id="dim_cut_FRT_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="\${d['cut_FRT_중'] || ''}" />
                        <input type="text" id="dim_cut_FRT_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="\${d['cut_FRT_초'] || '326'}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(중)</span>
                        <input type="text" id="dim_cut_FRT_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="\${d['cut_FRT_중'] || '326'}" />
                      </div>`;

const goodStr = `                        <input type="text" id="dim_cut_FRT_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="\${d['cut_FRT_초'] || '326'}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(중)</span>
                        <input type="text" id="dim_cut_FRT_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="\${d['cut_FRT_중'] || '326'}" />
                      </div>`;

code = code.replace(badStr, goodStr);
fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
console.log('Fixed duplicate blocks');
