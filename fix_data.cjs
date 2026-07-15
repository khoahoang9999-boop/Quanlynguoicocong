const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

code = code.replace(/let namDuLieu = '2026';/g, "let namDuLieu = '';");
code = code.replace(/namDuLieu === '2026'/g, "namDuLieu === ''");
code = code.replace(/namDuLieu \|\| '2026'/g, "namDuLieu || new Date().toISOString().split('T')[0]");

fs.writeFileSync('src/data.ts', code);
