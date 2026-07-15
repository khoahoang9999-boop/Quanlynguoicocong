const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
  '<title>Bản đồ Người có công với Cách mạng - Xã Việt Thành</title>',
  '<title>Bản đồ Người có công với Cách mạng - Xã Hàm Yên</title>'
);

fs.writeFileSync('index.html', code);
