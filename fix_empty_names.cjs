const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

const regex = /return \{\n\s*id: `csv-\$\{idx\}-\$\{Date\.now\(\)\}`,/;
code = code.replace(regex, `if (!hoTen) return null;\n      return {\n        id: \`csv-\${idx}-\${Date.now()}\`,`);

code = code.replace(/}\);\n}/g, `}).filter(item => item !== null) as NguoiCoCong[];\n}`);

fs.writeFileSync('src/data.ts', code);
