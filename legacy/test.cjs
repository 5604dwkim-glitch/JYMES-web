const fs = require('fs');

global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.window = { showToast: () => {} };
import('./js/store.js').then(async ({store, DEFAULT_LEADER_ITEMS, DEFAULT_ATTENDANCE}) => {
  const reports = store.getReports({});
  const r = reports.find(r => !r.isLeaderForm && r.workerName !== '장수미');
  
  if (!r) { console.log('No report found'); return; }
  
  const thStyle = 'border: 1px solid #000; padding: 4px; text-align: center;';
  const tdStyle = 'border: 1px solid #000; padding: 4px; text-align: center;';
  const td = (val) => '<td style=\"' + tdStyle + '\">' + (val !== undefined && val !== null ? val : '') + '</td>';
  const tdBold = (val, color) => '<td style=\"' + tdStyle + ' font-weight: 800; color: ' + (color || '#000') + ';\">' + (val !== undefined && val !== null ? val : '') + '</td>';
  
  const code = fs.readFileSync('js/components/reportList.js', 'utf8');
  
  let secIndex = 1;
  const matchRenderMaterial = code.match(/const renderMaterialLotsCard = \(num\) => \{([\s\S]*?)\};\n\n\s*\/\//);
  if (matchRenderMaterial) eval(matchRenderMaterial[0]);
  
  const matchRenderDim = code.match(/const renderDimensionsCard = \(num\) => \{([\s\S]*?)\};\n\n\s*\/\//);
  if (matchRenderDim) eval(matchRenderDim[0]);
  
  const matchRenderVulc = code.match(/const renderVulcanizationCard = \(num\) => \{([\s\S]*?)\};\n\n\s*\/\//);
  if (matchRenderVulc) eval(matchRenderVulc[0]);
  
  const matchRenderProd = code.match(/const renderProductionAndDefectsCard = \(num\) => \{([\s\S]*?)\};\n\n\s*\/\//);
  if (matchRenderProd) eval(matchRenderProd[0]);
  
  const matchRenderDowntime = code.match(/const renderDowntimeCard = \(num\) => \{([\s\S]*?)\};\n\n\s*\/\//);
  if (matchRenderDowntime) eval(matchRenderDowntime[0]);
  
  try {
    if (typeof renderMaterialLotsCard === 'function') renderMaterialLotsCard(secIndex++);
    if (typeof renderDimensionsCard === 'function') renderDimensionsCard(secIndex++);
    if (typeof renderVulcanizationCard === 'function') renderVulcanizationCard(secIndex++);
    if (typeof renderProductionAndDefectsCard === 'function') renderProductionAndDefectsCard(secIndex++);
    if (typeof renderDowntimeCard === 'function') renderDowntimeCard(secIndex++);
    console.log('ALL SUCCESS');
  } catch(e) {
    console.error('ERROR:', e.message);
  }
}).catch(console.error);
