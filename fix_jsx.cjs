const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/\{<\/div>\n\n                  \/\* Clear Filters Indicator \*\/\}/g, '</div>\n\n                  {/* Clear Filters Indicator */}');

fs.writeFileSync('src/App.tsx', code);
