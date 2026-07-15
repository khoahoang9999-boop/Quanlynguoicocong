const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '          {/* GLOBAL SEARCH BAR ON MAP */}',
  '          </div>\n\n          {/* GLOBAL SEARCH BAR ON MAP */}'
);

fs.writeFileSync('src/App.tsx', code);
