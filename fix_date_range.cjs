const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add fromDate and toDate state
code = code.replace(
  /const \[selectedMonthYear, setSelectedMonthYear\] = useState<string>\(''\);/,
  `const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');`
);

// Add dependencies and update matchTime
const matchTimeRegex = /const matchTime = \(\(\) => \{[\s\S]*?\}\)\(\);/;

const newMatchTime = `const matchTime = (() => {
        let matchesMonth = true;
        let itemDate = null;
        const dStr = item.namDuLieu || '';
        
        // Parse date for range comparison
        if (dStr.includes('/')) {
            const parts = dStr.split('/');
            const year = parts[parts.length - 1];
            const month = parts.length >= 2 ? parseInt(parts[parts.length - 2]).toString().padStart(2, '0') : '01';
            const day = parts.length >= 3 ? parseInt(parts[parts.length - 3]).toString().padStart(2, '0') : '01';
            itemDate = new Date(\`\${year}-\${month}-\${day}\`);
        } else if (dStr.includes('-')) {
            const parts = dStr.split('-');
            const year = parts[0];
            const month = parts.length >= 2 ? parseInt(parts[1]).toString().padStart(2, '0') : '01';
            const day = parts.length >= 3 ? parseInt(parts[2]).toString().padStart(2, '0') : '01';
            itemDate = new Date(\`\${year}-\${month}-\${day}\`);
        } else {
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) {
                itemDate = d;
            }
        }

        // Check month/year if selected
        if (selectedMonthYear) {
            const [targetYear, targetMonth] = selectedMonthYear.split('-');
            let itemYear = '';
            let itemMonth = '';
            
            if (itemDate && !isNaN(itemDate.getTime())) {
                itemYear = itemDate.getFullYear().toString();
                itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');
            } else if (dStr.match(/\\b(20\\d{2})\\b/)) {
                itemYear = dStr.match(/\\b(20\\d{2})\\b/)[1];
            }
            matchesMonth = itemYear === targetYear && itemMonth === targetMonth;
        }

        // Check from/to date range
        let matchesRange = true;
        if (itemDate && !isNaN(itemDate.getTime())) {
            if (fromDate) {
                matchesRange = matchesRange && itemDate >= new Date(fromDate);
            }
            if (toDate) {
                // Add 1 day to toDate to include the whole day
                const toDateObj = new Date(toDate);
                toDateObj.setDate(toDateObj.getDate() + 1);
                matchesRange = matchesRange && itemDate < toDateObj;
            }
        } else if (fromDate || toDate) {
           // If we have a range filter but invalid date, exclude it
           matchesRange = false;
        }

        return matchesMonth && matchesRange;
      })();`;

code = code.replace(matchTimeRegex, newMatchTime);

// Update dependency array
code = code.replace(
  /\[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, selectedMonthYear\]/,
  `[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, selectedMonthYear, fromDate, toDate]`
);

// Find the header buttons and replace the RefreshCw button with the date range inputs
const resetBtnRegex = /<button\s*onClick=\{handleResetData\}\s*title="Khôi phục dữ liệu gốc"\s*className="p-1.5 bg-red-800\/40 hover:bg-red-800 text-red-100 rounded-lg border border-red-700\/50 transition-all"\s*>\s*<RefreshCw className="w-3.5 h-3.5" \/>\s*<\/button>/;

const dateRangeFilter = `
            <div className="flex items-center gap-1.5 bg-red-900/60 p-1.5 rounded-lg border border-red-700/50" title="Thời gian khôi phục dữ liệu (Lọc theo ngày)">
              <div className="flex items-center">
                <span className="text-[9px] text-amber-200 mr-1 hidden lg:inline uppercase font-bold tracking-wider">Từ:</span>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-red-950 text-amber-100 text-[10px] rounded px-1.5 py-0.5 border border-red-800 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex items-center">
                <span className="text-[9px] text-amber-200 mr-1 hidden lg:inline uppercase font-bold tracking-wider">Đến:</span>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-red-950 text-amber-100 text-[10px] rounded px-1.5 py-0.5 border border-red-800 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>`;

code = code.replace(resetBtnRegex, dateRangeFilter);

// Remove the handleResetData function
const handleResetDataRegex = /const handleResetData = \(\) => \{[\s\S]*?fitAllMarkers\(MOCK_DATA\);\s*\}, 400\);\s*\}\s*\};\n/;
code = code.replace(handleResetDataRegex, '');

// Also, update the clear filters text
code = code.replace(
  /selectedMonthYear !== ''/g,
  `(selectedMonthYear !== '' || fromDate !== '' || toDate !== '')`
);

code = code.replace(
  /setSelectedMonthYear\(''\);/,
  `setSelectedMonthYear(''); setFromDate(''); setToDate('');`
);

fs.writeFileSync('src/App.tsx', code);
