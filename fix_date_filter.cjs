const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Replace state
code = code.replace(
  /const \[selectedYear, setSelectedYear\] = useState<string>\('Tất cả'\);\n  const \[selectedMonth, setSelectedMonth\] = useState<string>\('Tất cả'\);/,
  `const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');`
);

// 2. Remove listYears and listMonths
code = code.replace(
  /const listYears = useMemo\(\(\) => \{[\s\S]*?\}, \[data\]\);\n  \n  const listMonths = \['Tất cả', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'\];/,
  ``
);

// 3. Update matchTime
code = code.replace(
  /const matchTime = \(\(\) => \{[\s\S]*?\}\)\(\);/,
  `const matchTime = (() => {
        if (!selectedMonthYear) return true;
        const [targetYear, targetMonth] = selectedMonthYear.split('-');
        const dStr = item.namDuLieu || '';
        let itemYear = '';
        let itemMonth = '';
        
        // Try parsing DD/MM/YYYY or MM/YYYY
        if (dStr.includes('/')) {
            const parts = dStr.split('/');
            itemYear = parts[parts.length - 1];
            if (parts.length >= 2) {
                itemMonth = parseInt(parts[parts.length - 2]).toString().padStart(2, '0');
            }
        } else if (dStr.includes('-')) {
            const parts = dStr.split('-');
            itemYear = parts[0];
            if (parts.length >= 2) {
                itemMonth = parseInt(parts[1]).toString().padStart(2, '0');
            }
        } else {
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) {
                itemYear = d.getFullYear().toString();
                itemMonth = (d.getMonth() + 1).toString().padStart(2, '0');
            } else if (dStr.match(/\\b(20\\d{2})\\b/)) {
                itemYear = dStr.match(/\\b(20\\d{2})\\b/)[1];
            }
        }
        
        return itemYear === targetYear && itemMonth === targetMonth;
      })();`
);

// 4. Update dependencies
code = code.replace(
  /\[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, selectedYear, selectedMonth\]/,
  `[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, selectedMonthYear]`
);

// 5. Update JSX Filters
const oldFilterJSX = /<div className="space-y-1">[\s\S]*?Năm dữ liệu[\s\S]*?<\/div>\s*<\/div>\s*<div className="space-y-1">[\s\S]*?Tháng dữ liệu[\s\S]*?<\/div>\s*<\/div>/;

const newFilterJSX = `<div className="space-y-1 md:col-span-2 lg:col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thời gian dữ liệu</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="month"
                    value={selectedMonthYear}
                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"
                  />
                </div>
              </div>`;

code = code.replace(oldFilterJSX, newFilterJSX);

// 6. Fix clear filters
code = code.replace(
  /selectedYear !== 'Tất cả' \|\| selectedMonth !== 'Tất cả'/,
  `selectedMonthYear !== ''`
);
code = code.replace(
  /setSelectedYear\('Tất cả'\);\n                    setSelectedMonth\('Tất cả'\);/,
  `setSelectedMonthYear('');`
);

fs.writeFileSync('src/App.tsx', code);
