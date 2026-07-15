const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const filtersGridRegex = /<div className="grid grid-cols-2 gap-2">[\s\S]*?<div className="space-y-1">[\s\S]*?<label className="text-\[10px\] font-bold text-gray-500 uppercase tracking-wider">Tình trạng<\/label>[\s\S]*?<\/select>\s*<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `<div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thời gian</label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                    >
                      <option value="Tất cả">Tất cả các năm</option>
                      {listYears.map(year => (
                        <option key={year} value={year}>Năm {year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tình trạng</label>
                  <div className="relative">
                    <Eye className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedTinhTrang}
                      onChange={(e) => setSelectedTinhTrang(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                    >
                      <option value="Tất cả">Tất cả</option>
                      <option value="Còn sống">Còn sống</option>
                      <option value="Đang công tác">Đang công tác</option>
                      <option value="Đã mất">Đã mất (Đã chết)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Diện chính sách</label>
                <div className="relative">
                  <Award className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedDienChinhSach}
                    onChange={(e) => setSelectedDienChinhSach(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                  >
                    {listDienChinhSach.map(dien => (
                      <option key={dien} value={dien}>{dien}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>`;

code = code.replace(filtersGridRegex, replacement);

// And we need to fix the year list generator to allow more past/future years
// Or just let listYears use the data but add currentYear - 5 to currentYear + 5 maybe?
const listYearsHookRegex = /const listYears = useMemo\(\(\) => \{[\s\S]*?return Array\.from\(years\)\.sort\(\)\.reverse\(\);\s*\}, \[data\]\);/;

const newListYearsHook = `const listYears = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    // Add current year +/- 5 years by default
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        years.add(i.toString());
    }
    data.forEach(item => {
      const dStr = item.namDuLieu || '';
      const match = dStr.match(/\\b(20\\d{2})\\b/);
      if (match) {
        years.add(match[1]);
      }
    });
    return Array.from(years).sort().reverse(); // Newest first
  }, [data]);`;

code = code.replace(listYearsHookRegex, newListYearsHook);

fs.writeFileSync('src/App.tsx', code);
