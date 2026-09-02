const fs = require('fs');
let t = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const target1 = '      const reportData = {';
const replacement1 = `      const injSetData = Array.from(container.querySelectorAll('[id^="inj_"]')).reduce((acc, el) => {
        acc[el.id] = el.value;
        return acc;
      }, {});

      const reportData = {`;

t = t.replace(target1, replacement1);

const target2 = 'vulcData2: vulcData2,';
const replacement2 = `vulcData2: vulcData2,
        injSetData: injSetData,`;

t = t.replace(target2, replacement2);

fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', t);
console.log('Successfully updated LegacyFormWrapper.jsx');
