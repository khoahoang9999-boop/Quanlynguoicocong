const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state
code = code.replace(/const \[selectedYear, setSelectedYear\] = useState<string>\(''\);/,
`const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');`);

// 2. Update logic
const filterRegex = /\/\/ Check month\/year if selected[\s\S]*?return matchesMonth;\n      \}\)\(\);/;
const newFilterLogic = `// Check month/year if selected
        if (selectedYear || selectedMonth) {
            let itemYear = '';
            let itemMonth = '';
            
            // Try to extract from itemDate first
            if (itemDate && !isNaN(itemDate.getTime())) {
                itemYear = itemDate.getFullYear().toString();
                itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');
            } else {
                // Fallback extraction
                if (dStr.match(/\\b(20\\d{2})\\b/)) {
                    itemYear = dStr.match(/\\b(20\\d{2})\\b/)[1];
                } else if (dStr.match(/\\b(\\d{4})\\b/)) {
                    itemYear = dStr.match(/\\b(\\d{4})\\b/)[1];
                }
                
                // Try to extract month from string (format DD/MM/YYYY or YYYY-MM-DD)
                if (dStr.includes('/')) {
                   const p = dStr.split('/');
                   if (p.length >= 2) itemMonth = parseInt(p[p.length - 2]).toString().padStart(2, '0');
                } else if (dStr.includes('-')) {
                   const p = dStr.split('-');
                   if (p.length >= 2) itemMonth = parseInt(p[1]).toString().padStart(2, '0');
                }
            }

            if (selectedYear && itemYear !== selectedYear) matchesMonth = false;
            if (selectedMonth && itemMonth !== selectedMonth) matchesMonth = false;
        }

        return matchesMonth;
      })();`;
code = code.replace(filterRegex, newFilterLogic);

// 3. Update dependency array
code = code.replace(/selectedYear\]\);/g, 'selectedYear, selectedMonth]);');

// 4. Update UI grid
const uiGridRegex = /<div className="grid grid-cols-2 gap-2">\s*<div className="space-y-1">\s*<label className="text-\[10px\] font-bold text-gray-500 uppercase tracking-wider">Năm dữ liệu<\/label>\s*<div className="relative">\s*<Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" \/>\s*<input\s*type="number"\s*placeholder="Tất cả"\s*value=\{selectedYear\}\s*onChange=\{\(e\) => setSelectedYear\(e\.target\.value\)\}\s*className="w-full pl-7 pr-2 py-1\.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"\s*\/>\s*<\/div>\s*<\/div>/;

const newUiGrid = `<div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tháng</label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                          >
                            <option value="">Tất cả</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m.toString().padStart(2, '0')}>Tháng {m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Năm</label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="number"
                            placeholder="Tất cả"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"
                          />
                        </div>
                      </div>`;
code = code.replace(uiGridRegex, newUiGrid);

// 5. Update Clear Filters condition
const clearFiltersRegex = /selectedYear !== ''/g;
code = code.replace(clearFiltersRegex, 'selectedYear !== \'\' || selectedMonth !== \'\'');

// 6. Update Clear Filters click action
const clearFiltersActionRegex = /setSelectedYear\(''\);/;
code = code.replace(clearFiltersActionRegex, `setSelectedYear('');
                          setSelectedMonth('');`);

fs.writeFileSync('src/App.tsx', code);
