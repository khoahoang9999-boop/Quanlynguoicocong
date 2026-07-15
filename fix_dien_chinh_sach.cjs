const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const dienChinhSachHookRegex = /const listDienChinhSach = useMemo\(\(\) => \{[\s\S]*?return \['Tất cả', \.\.\.Array\.from\(list\)\];\s*\}, \[data\]\);/;

const newDienChinhSachHook = `const listDienChinhSach = useMemo(() => {
    const list = new Set<string>([
      'Lão thành cách mạng',
      'Cán bộ tiền khởi nghĩa',
      'Liệt sĩ',
      'Bà mẹ Việt Nam anh hùng',
      'Anh hùng Lực lượng vũ trang nhân dân',
      'Anh hùng Lao động trong thời kỳ kháng chiến',
      'Thương binh',
      'Bệnh binh',
      'Người hoạt động kháng chiến bị nhiễm chất độc hóa học',
      'Người hoạt động cách mạng, kháng chiến, bảo vệ Tổ quốc, làm nghĩa vụ quốc tế bị địch bắt tù, đày',
      'Người hoạt động kháng chiến giải phóng dân tộc, bảo vệ Tổ quốc, làm nghĩa vụ quốc tế',
      'Người có công giúp đỡ cách mạng'
    ]);
    data.forEach(item => {
      if (item.dienChinhSach) {
        list.add(item.dienChinhSach);
      }
    });
    return ['Tất cả', ...Array.from(list)];
  }, [data]);`;

code = code.replace(dienChinhSachHookRegex, newDienChinhSachHook);
fs.writeFileSync('src/App.tsx', code);
