const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/return data\.filter\(\(item\) => \{/g, 'return (data || []).filter((item) => {');
code = code.replace(/const conSong = data\.filter/g, 'const conSong = (data || []).filter');
code = code.replace(/const dangCongTac = data\.filter/g, 'const dangCongTac = (data || []).filter');
code = code.replace(/const daMat = data\.filter/g, 'const daMat = (data || []).filter');
fs.writeFileSync('src/App.tsx', code);
