const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

const regex = /x:\s*\{\s*grid:\s*\{\s*display:false\s*\},.*?callback:\s*function\(val,\s*index\)\s*\{.*?return\s*index\s*===\s*0\s*\?.*?:\s*dayStr;\s*\}\s*\}\s*\}/s;

const newBlock = `x:{ 
                    grid:{ display:false }, 
                    ticks:{ 
                      maxRotation: 0,
                      minRotation: 0,
                      autoSkip: true,
                      font: { size: 10 },
                      color: function(context) {
                        if (chartPeriod === 'daily' && context.tick && typeof context.tick.value === 'number') {
                          const label = chartDataObj.labels[context.tick.value];
                          if (label) {
                            const d = new Date(label);
                            if (!isNaN(d.getTime()) && d.getDay() === 0) {
                              return '#ef4444'; // Red for Sunday
                            }
                          }
                        }
                        return '#64748b'; // Default text color
                      },
                      callback: function(val, index) {
                        const label = chartDataObj.labels[val];
                        if (chartPeriod !== 'daily' || !label) return label;
                        const d = new Date(label);
                        if (isNaN(d.getTime())) return label;
                        const days = ['일','월','화','수','목','금','토'];
                        const dayStr = \`\${d.getDate()}일\`;
                        const dowStr = \`(\${days[d.getDay()]})\`;
                        return index === 0 ? [\`\${d.getFullYear()}년 \${d.getMonth()+1}월 \${dayStr}\`, dowStr] : [dayStr, dowStr];
                      }
                    } 
                  }`;

content = content.replace(regex, newBlock);
fs.writeFileSync('src/components/Dashboard.jsx', content, 'utf8');
console.log('Dashboard updated with regex');
