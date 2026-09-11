const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

// For 4001
code = code.replace(/value="\${d\['cut_FRT_초'\]  \|\| '326'}"/g, 'value="${d[\'cut_FRT_초\']  || \'\'}"');
code = code.replace(/value="\${d\['cut_FRT_중'\]  \|\| '326'}"/g, 'value="${d[\'cut_FRT_중\']  || \'\'}"');
code = code.replace(/value="\${d\['cut_FRT_종'\]  \|\| '326'}"/g, 'value="${d[\'cut_FRT_종\']  || \'\'}"');

// For 4004
code = code.replace(/value="\${d\['cut_FRT_초'\] \|\| '326'}"/g, 'value="${d[\'cut_FRT_초\'] || \'\'}"');
code = code.replace(/value="\${d\['cut_FRT_중'\] \|\| '326'}"/g, 'value="${d[\'cut_FRT_중\'] || \'\'}"');
code = code.replace(/value="\${d\['cut_FRT_종'\] \|\| '326'}"/g, 'value="${d[\'cut_FRT_종\'] || \'\'}"');

code = code.replace(/value="\${d\['cut_RR_초'\]  \|\| '326'}"/g, 'value="${d[\'cut_RR_초\']  || \'\'}"');
code = code.replace(/value="\${d\['cut_RR_중'\]  \|\| '326'}"/g, 'value="${d[\'cut_RR_중\']  || \'\'}"');
code = code.replace(/value="\${d\['cut_RR_종'\]  \|\| '326'}"/g, 'value="${d[\'cut_RR_종\']  || \'\'}"');

fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
