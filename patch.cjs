const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const hookStr = `  const listNamDuLieu = useMemo(() => {
    const list = new Set<string>();
    data.forEach(item => {
      list.add(item.namDuLieu || '2024');
    });
    return ['Tất cả', ...Array.from(list).sort().reverse()];
  }, [data]);

  // Compute filtered items`;
code = code.replace('// Compute filtered items', hookStr);
fs.writeFileSync('src/App.tsx', code);
