const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const topDirectionRegex = /\{\/\* Directions Toggle Button \*\/\}[\s\S]*?<\/button>/;
code = code.replace(topDirectionRegex, '');

fs.writeFileSync('src/App.tsx', code);
