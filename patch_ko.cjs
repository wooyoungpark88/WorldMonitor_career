const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src', 'locales', 'en.json');
const koPath = path.join(__dirname, 'src', 'locales', 'ko.json');
const dtsPath = path.join(__dirname, 'src', 'locales', 'ko.d.ts');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Basic translations for the Care variant & overall headings
enData.app.title = "World Monitor";
enData.app.description = "소셜 임팩트 및 케어 기술 인사이트";

enData.header.world = "지정학";
enData.header.tech = "기술";
enData.header.finance = "금융";
enData.header.search = "검색";
enData.header.settings = "패널";
enData.header.sources = "소스";

enData.panels.map = "글로벌 맵";
enData.panels.careTech = "케어 테크";
enData.panels.impactFunding = "임팩트 & 펀딩";
enData.panels.publicProcurement = "공공 조달";
enData.panels.competitorIntelligence = "경쟁사 동향";
enData.panels.bos = "Business Opportunity Score (BOS)";
enData.panels.sroi = "SROI 요약 패널";
enData.panels.pricing = "프라이싱 벤치마크";

fs.writeFileSync(koPath, JSON.stringify(enData, null, 2), 'utf8');

// Write the declaration file 
const dtsContent = `declare const _default: Record<string, unknown>;\nexport default _default;\n`;
fs.writeFileSync(dtsPath, dtsContent, 'utf8');

console.log('Successfully generated Korean locale: ko.json');
