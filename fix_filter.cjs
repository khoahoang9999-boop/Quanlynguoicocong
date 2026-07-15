const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Rename selectedMonthYear to selectedYear
code = code.replace(/selectedMonthYear/g, 'selectedYear');
code = code.replace(/setSelectedMonthYear/g, 'setSelectedYear');

// 2. Default selectedYear to current year
code = code.replace(
  /const \[selectedYear, setSelectedYear\] = useState<string>\(''\);/,
  `const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());`
);

// 3. Update matchTime logic for selectedYear
const matchTimeRegex = /if \(selectedYear\) \{[\s\S]*?matchesMonth = itemYear === targetYear && itemMonth === targetMonth;\n\s*\}/;

const newMatchLogic = `if (selectedYear && selectedYear !== 'Tất cả') {
            let itemYear = '';
            if (itemDate && !isNaN(itemDate.getTime())) {
                itemYear = itemDate.getFullYear().toString();
            } else if (dStr.match(/\\b(20\\d{2})\\b/)) {
                itemYear = dStr.match(/\\b(20\\d{2})\\b/)[1];
            }
            matchesMonth = itemYear === selectedYear;
        }`;

code = code.replace(matchTimeRegex, newMatchLogic);

// 4. Also need a list of available years for the dropdown
const listYearsHook = `
  const listYears = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear); // Always include current year
    data.forEach(item => {
      const dStr = item.namDuLieu || '';
      const match = dStr.match(/\\b(20\\d{2})\\b/);
      if (match) {
        years.add(match[1]);
      }
    });
    return Array.from(years).sort().reverse(); // Newest first
  }, [data]);
`;

code = code.replace(/const listDienChinhSach = useMemo/, listYearsHook + '\n  const listDienChinhSach = useMemo');

// 5. Replace the input type="month" with a select for year
const inputRegex = /<input\s*type="month"\s*value=\{selectedYear\}\s*onChange=\{\(e\) => setSelectedYear\(e\.target\.value\)\}\s*className="w-full pl-7 pr-2 py-1\.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"\s*\/>/;

const yearSelect = `<select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                  >
                    <option value="Tất cả">Tất cả các năm</option>
                    {listYears.map(year => (
                      <option key={year} value={year}>Năm {year}</option>
                    ))}
                  </select>`;

code = code.replace(inputRegex, yearSelect);

fs.writeFileSync('src/App.tsx', code);
