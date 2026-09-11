const curLots = {'lotNo_LH_FRT_A_초물': '2023'};
const r = {key: 'FRT_A'};
console.log(`value="${curLots[`lotNo_LH_${r.key}_초물`] || ''}"`);
