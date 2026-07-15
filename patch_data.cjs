const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  'const [data, setData] = useState<NguoiCoCong[]>(() => {',
  `const [data, setData] = useState<NguoiCoCong[]>(() => {
    const saved = localStorage.getItem('saved_nguoi_co_cong_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : MOCK_DATA;
      } catch (e) {
        return MOCK_DATA;
      }
    }
    return MOCK_DATA;
  }); // original: `
);
code = code.replace(
  'const listNamDuLieu = useMemo(() => {',
  `const listNamDuLieu = useMemo(() => {
    const list = new Set<string>();
    (data || []).forEach(item => {`
);
code = code.replace(
  'const filteredData = useMemo(() => {\\n    return data.filter((item) => {',
  `const filteredData = useMemo(() => {\\n    return (data || []).filter((item) => {`
);
code = code.replace(
  'const total = data.length;',
  'const total = (data || []).length;'
);
fs.writeFileSync('src/App.tsx', code);
