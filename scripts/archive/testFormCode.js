const FORM_CODE_MAP = { "JG1_G/RUN 'E'_조인트": 1022 };
const curCarCode = "JG1";
const curPart = "G/RUN 'E'";
const curProc = "조인트";
const lookupKey = `${curCarCode}_${curPart}_${curProc}`;
console.log(lookupKey);
console.log(FORM_CODE_MAP[lookupKey]);
