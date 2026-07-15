const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Replace state
code = code.replace(
  /const \[selectedNamDuLieu, setSelectedNamDuLieu\] = useState<string>\('Tất cả'\);/,
  `const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');`
);

// 2. Remove listNamDuLieu
code = code.replace(/const listNamDuLieu = useMemo\(\(\) => \{[\s\S]*?\}, \[data\]\);/, '');

// 3. Update filter logic
code = code.replace(
  /const matchNamDuLieu = selectedNamDuLieu === 'Tất cả' \|\| \(item\.namDuLieu \|\| '2026'\) === selectedNamDuLieu;/,
  `const matchStartDate = !startDate || (() => {
        // Try parsing assuming YYYY-MM-DD, or fallback to year only
        let itemDateStr = item.namDuLieu || '';
        // Convert DD/MM/YYYY to YYYY-MM-DD if needed
        if (itemDateStr.includes('/')) {
            const parts = itemDateStr.split('/');
            if (parts.length === 3) {
               itemDateStr = \`\${parts[2]}-\${parts[1]}-\${parts[0]}\`;
            }
        }
        const itemDate = new Date(itemDateStr);
        if (isNaN(itemDate.getTime())) return true; // Can't parse, so don't filter out
        const sDate = new Date(startDate);
        return itemDate >= sDate;
      })();
      const matchEndDate = !endDate || (() => {
        let itemDateStr = item.namDuLieu || '';
        if (itemDateStr.includes('/')) {
            const parts = itemDateStr.split('/');
            if (parts.length === 3) {
               itemDateStr = \`\${parts[2]}-\${parts[1]}-\${parts[0]}\`;
            }
        }
        const itemDate = new Date(itemDateStr);
        if (isNaN(itemDate.getTime())) return true;
        const eDate = new Date(endDate);
        // Compare strictly to the end of the day or just directly. Since itemDate might be 00:00:00, <= eDate works for exact matches
        return itemDate <= eDate;
      })();`
);

// 4. Update return match
code = code.replace(
  /return matchSearch && matchDien && matchTinhTrang && matchNamDuLieu;/,
  `return matchSearch && matchDien && matchTinhTrang && matchStartDate && matchEndDate;`
);

// 5. Update dependencies array of useMemo
code = code.replace(
  /\[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, selectedNamDuLieu\]/,
  `[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, startDate, endDate]`
);

// 6. Update JSX Filters
const oldFilterJSX = `<div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Năm dữ liệu</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedNamDuLieu}
                    onChange={(e) => setSelectedNamDuLieu(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                  >
                    {listNamDuLieu.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>`;

const newFilterJSX = `<div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Từ ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"
                  />
                </div>
              </div>`;

code = code.replace(oldFilterJSX, newFilterJSX);

// 7. Fix clear filters
code = code.replace(
  /selectedNamDuLieu !== 'Tất cả'/,
  `startDate !== '' || endDate !== ''`
);
code = code.replace(
  /setSelectedNamDuLieu\('Tất cả'\);/,
  `setStartDate('');\n                    setEndDate('');`
);

fs.writeFileSync('src/App.tsx', code);
