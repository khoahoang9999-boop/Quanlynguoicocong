const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Replace states
code = code.replace(
  /const \[startDate, setStartDate\] = useState<string>\(''\);\n  const \[endDate, setEndDate\] = useState<string>\(''\);/,
  `const [selectedYear, setSelectedYear] = useState<string>('Tất cả');
  const [selectedMonth, setSelectedMonth] = useState<string>('Tất cả');`
);

// 2. Add listYears
code = code.replace(
  /\/\/ Compute filtered items/,
  `const listYears = useMemo(() => {
    const list = new Set<string>();
    (data || []).forEach(item => {
      const dStr = item.namDuLieu || '';
      const match = dStr.match(/\\b(20\\d{2})\\b/);
      if (match) list.add(match[1]);
      else if (dStr) list.add(dStr);
    });
    list.add('2024');
    list.add('2025');
    list.add('2026');
    return ['Tất cả', ...Array.from(list).sort().reverse()];
  }, [data]);
  
  const listMonths = ['Tất cả', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  // Compute filtered items`
);

// 3. Replace match logic
code = code.replace(
  /const matchStartDate = !startDate \|\| \(\(\) => \{[\s\S]*?\}\)\(\);\n      const matchEndDate = !endDate \|\| \(\(\) => \{[\s\S]*?\}\)\(\);/m,
  `const matchTime = (() => {
        if (selectedYear === 'Tất cả') return true;
        const dStr = item.namDuLieu || '';
        let itemYear = '';
        let itemMonth = '';
        
        // Try parsing DD/MM/YYYY or MM/YYYY
        if (dStr.includes('/')) {
            const parts = dStr.split('/');
            itemYear = parts[parts.length - 1];
            if (parts.length >= 2) {
                itemMonth = parseInt(parts[parts.length - 2]).toString();
            }
        } else if (dStr.includes('-')) {
            const parts = dStr.split('-');
            itemYear = parts[0];
            if (parts.length >= 2) {
                itemMonth = parseInt(parts[1]).toString();
            }
        } else {
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) {
                itemYear = d.getFullYear().toString();
                itemMonth = (d.getMonth() + 1).toString();
            } else if (dStr.match(/\\b(20\\d{2})\\b/)) {
                itemYear = dStr.match(/\\b(20\\d{2})\\b/)[1];
            }
        }
        
        if (selectedMonth === 'Tất cả') {
            return itemYear === selectedYear;
        } else {
            return itemYear === selectedYear && itemMonth === selectedMonth;
        }
      })();`
);

// 4. Update return match
code = code.replace(
  /return matchSearch && matchDien && matchTinhTrang && matchStartDate && matchEndDate;/,
  `return matchSearch && matchDien && matchTinhTrang && matchTime;`
);

// 5. Update dependencies array
code = code.replace(
  /\[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, startDate, endDate\]/,
  `[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, selectedYear, selectedMonth]`
);

// 6. Update JSX Filters
const oldFilterJSX = `<div className="space-y-1">
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

const newFilterJSX = `<div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Năm dữ liệu</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      if (e.target.value === 'Tất cả') setSelectedMonth('Tất cả');
                    }}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                  >
                    {listYears.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tháng dữ liệu</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={selectedYear === 'Tất cả'}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {listMonths.map((item) => (
                      <option key={item} value={item}>{item !== 'Tất cả' ? \`Tháng \${item}\` : item}</option>
                    ))}
                  </select>
                </div>
              </div>`;

code = code.replace(oldFilterJSX, newFilterJSX);

// 7. Fix clear filters
code = code.replace(
  /startDate !== '' \|\| endDate !== ''/,
  `selectedYear !== 'Tất cả' || selectedMonth !== 'Tất cả'`
);
code = code.replace(
  /setStartDate\(''\);\n                    setEndDate\(''\);/,
  `setSelectedYear('Tất cả');\n                    setSelectedMonth('Tất cả');`
);

fs.writeFileSync('src/App.tsx', code);
