const fs = require('fs');
const path = require('path');

const files = [
    'src/components/DynamicForms/FormTemplates.jsx',
    'src/components/DynamicForms/sections/Section5Renderer.js',
    'src/components/DynamicForms/LegacyFormWrapper.jsx'
];

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. 생산실적 및 불량 현황
    content = content.replace(/📊\s*<span class="sec-num"><\/span>\s*생산실적\s*\(.*?\)/g, '📊 <span class="sec-num"></span> 생산실적 및 불량 현황');
    content = content.replace(/📊\s*<span class="sec-num"><\/span>\s*생산실적\s*및\s*폐기\s*불량현황\s*입력/g, '📊 <span class="sec-num"></span> 생산실적 및 불량 현황');
    content = content.replace(/📊\s*<span class="sec-num"><\/span>\s*생산실적(?! 및 불량 현황)/g, '📊 <span class="sec-num"></span> 생산실적 및 불량 현황');
    content = content.replace(/📊\s*<span class="sec-num"><\/span>\s*생산실적\(\s*검사\s*\)/g, '📊 <span class="sec-num"></span> 생산실적 및 불량 현황');
    content = content.replace(/📊\s*<span class="sec-num"><\/span>\s*검사실적/g, '📊 <span class="sec-num"></span> 생산실적 및 불량 현황');
    
    // Fix any double "및 불량 현황" if the regex over-matched
    content = content.replace(/📊\s*<span class="sec-num"><\/span>\s*생산실적 및 불량 현황 및 불량 현황/g, '📊 <span class="sec-num"></span> 생산실적 및 불량 현황');

    // Handle string literals in code like:
    // const sectionTitleLabel = curProc === '검사포장' ? '📊 <span class="sec-num"></span> 생산실적(검사)' : '📊 <span class="sec-num"></span> 생산실적 (Production Results)';
    content = content.replace(/const sectionTitleLabel =[^;]+;/g, "const sectionTitleLabel = '📊 <span class=\"sec-num\"></span> 생산실적 및 불량 현황';");

    // 2. 치수확인 (이모지 통일, 불필요한 부가설명 제거)
    content = content.replace(/📏\s*<span class="sec-num"><\/span>\s*치수확인\s*\(전장 길이 측정[^\)]*\)/g, '📐 <span class="sec-num"></span> 치수확인');
    content = content.replace(/📏\s*<span class="sec-num"><\/span>\s*치수확인\s*\([^)]*\)/g, '📐 <span class="sec-num"></span> 치수확인');
    content = content.replace(/📐\s*<span class="sec-num"><\/span>\s*치수확인\s*\(KM\/KX HOOD SURROUND[^\)]*\)/g, '📐 <span class="sec-num"></span> 치수확인');
    // FRT, RR은 유지 (사용자 요청) -> 📐 <span class="sec-num"></span> 치수확인 (FRT), (RR)은 원래 포맷이므로 유지됨.

    // 3. LOT 번호 입력
    content = content.replace(/🔗\s*<span class="sec-num"><\/span>\s*조인트 고무 LOT 번호 입력/g, '🧪 <span class="sec-num"></span> 소재 LOT 번호 입력');
    content = content.replace(/🔢\s*<span class="sec-num"><\/span>\s*조인트 고무 LOT 번호 입력/g, '🧪 <span class="sec-num"></span> 소재 LOT 번호 입력');

    // 4. 설비 조건
    content = content.replace(/🌡️\s*<span class="sec-num"><\/span>\s*사출온도/g, '♨️ <span class="sec-num"></span> 설비 사출온도 입력');
    content = content.replace(/⚙️\s*<span class="sec-num"><\/span>\s*사출설정값/g, '♨️ <span class="sec-num"></span> 설비 사출설정값 입력');

    // 5. 작업 특이사항
    content = content.replace(/📝\s*<span class="sec-num"><\/span>\s*비가동 시간 & 원터치 특이사항 작성\s*\(최대 3건 입력 가능\)/g, '📝 <span class="sec-num"></span> 작업 특이사항');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    } else {
        console.log('No changes needed for', filePath);
    }
}

files.forEach(replaceInFile);
console.log('Done.');
