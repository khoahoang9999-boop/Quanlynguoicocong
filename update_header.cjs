const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update header
code = code.replace(
  'Bản đồ thông tin người có công với cách mạng',
  'Hệ thống bản đồ số người có công với cách mạng xã Hàm Yên'
);

// Update description
code = code.replace(
  'Quản lý số hóa dữ liệu địa lý • Xã Hàm Yên, tỉnh Tuyên Quang',
  'Quản lý hồ sơ • Bản đồ số • Tra cứu • Hỗ trợ người có công'
);

// Update button text
code = code.replace(
  '<span>Đồng bộ Sheets</span>',
  '<span>Đồng bộ dữ liệu</span>'
);

fs.writeFileSync('src/App.tsx', code);
