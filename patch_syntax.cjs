const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /  \}\);\ \/\/\ original:[\s\S]*?\}\n    return MOCK_DATA;\n  \}\);/g,
  '  });'
);
fs.writeFileSync('src/App.tsx', code);
