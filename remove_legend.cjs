const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const legendRegex = /\s*\{\/\* Floating map legend panel - hidden on tiny screens \*\/\}\s*<div className="absolute bottom-5 right-5 bg-white\/95 backdrop-blur border border-slate-200 rounded-lg shadow-xl p-3 z-20 text-xs w-48 space-y-2 hidden sm:block">[\s\S]*?Bản đồ tự động căn chỉnh tiêu cự hiển thị\.\s*<\/div>\s*<\/div>/;

code = code.replace(legendRegex, '');

fs.writeFileSync('src/App.tsx', code);
