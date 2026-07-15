const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. We replace the incorrect date range filter with the Reset button
const dateRangeFilterRegex = /<div className="flex items-center gap-1\.5 bg-red-900\/60 p-1\.5 rounded-lg border border-red-700\/50" title="Thời gian khôi phục dữ liệu \(Lọc theo ngày\)">[\s\S]*?<\/div>\s*<\/div>/;

const resetButtonCode = `
            <button 
              onClick={() => setShowResetModal(true)}
              title="Khôi phục dữ liệu gốc"
              className="p-1.5 bg-red-800/40 hover:bg-red-800 text-red-100 rounded-lg border border-red-700/50 transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-semibold">Khôi phục</span>
            </button>`;

code = code.replace(dateRangeFilterRegex, resetButtonCode);

// 2. Add handleResetData logic back, but enhanced
// We'll put it right after activeSyncTab definition or somewhere safe
const hooksEndRegex = /const \[activeSyncTab, setActiveSyncTab\] = useState<'sheets' | 'local'>\('sheets'\);/;

const parseDateAndResetLogic = `
  const [activeSyncTab, setActiveSyncTab] = useState<'sheets' | 'local'>('sheets');

  const parseDateString = (dStr: string) => {
    if (!dStr) return null;
    if (dStr.includes('/')) {
        const parts = dStr.split('/');
        const year = parts[parts.length - 1];
        const month = parts.length >= 2 ? parseInt(parts[parts.length - 2]).toString().padStart(2, '0') : '01';
        const day = parts.length >= 3 ? parseInt(parts[parts.length - 3]).toString().padStart(2, '0') : '01';
        return new Date(\`\${year}-\${month}-\${day}\`);
    } else if (dStr.includes('-')) {
        const parts = dStr.split('-');
        const year = parts[0];
        const month = parts.length >= 2 ? parseInt(parts[1]).toString().padStart(2, '0') : '01';
        const day = parts.length >= 3 ? parseInt(parts[2]).toString().padStart(2, '0') : '01';
        return new Date(\`\${year}-\${month}-\${day}\`);
    } else {
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const executeResetData = () => {
    if (resetMode === 'all') {
      setData(MOCK_DATA);
      setSheetUrl('');
      localStorage.removeItem('saved_sheet_url');
      localStorage.removeItem('saved_nguoi_co_cong_data');
      setSuccessMsg('Đã khôi phục toàn bộ dữ liệu mẫu gốc.');
    } else {
      // Khôi phục theo thời gian
      const from = resetFromDate ? new Date(resetFromDate) : null;
      let to = resetToDate ? new Date(resetToDate) : null;
      if (to) {
        to.setDate(to.getDate() + 1); // Include full day
      }

      const isDateInRange = (d: Date | null) => {
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d >= to) return false;
        return true;
      };

      // Giữ lại dữ liệu hiện tại KHÔNG NẰM TRONG khoảng thời gian reset
      const remainingData = data.filter(item => {
        const d = parseDateString(item.namDuLieu || '');
        return !isDateInRange(d); // Keep if NOT in range
      });

      // Lấy dữ liệu gốc (MOCK_DATA) NẰM TRONG khoảng thời gian reset
      const restoredMockData = MOCK_DATA.filter(item => {
        const d = parseDateString(item.namDuLieu || '');
        return isDateInRange(d); // Get if IN range
      });

      const newData = [...remainingData, ...restoredMockData];
      setData(newData);
      
      // Save to localStorage so it persists
      localStorage.setItem('saved_nguoi_co_cong_data', JSON.stringify(newData));

      setSuccessMsg('Đã khôi phục dữ liệu gốc cho khoảng thời gian đã chọn.');
    }
    
    setShowResetModal(false);
    setTimeout(() => {
      fitAllMarkers(data);
    }, 400);
  };
`;

code = code.replace(hooksEndRegex, parseDateAndResetLogic);

// 3. Remove fromDate and toDate from matchTime since they are no longer used for filtering map
code = code.replace(/let matchesRange = true;[\s\S]*?if \(!isNaN\(d\.getTime\(\)\)\) \{\n                itemDate = d;\n            \}\n        \}/, `if (!isNaN(d.getTime())) {
                itemDate = d;
            }
        }`);

// Replace the range check in matchTime
code = code.replace(/let matchesRange = true;[\s\S]*?return matchesMonth && matchesRange;/, `return matchesMonth;`);
code = code.replace(/\[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, selectedMonthYear, fromDate, toDate\]/, `[data, searchQuery, selectedDienChinhSach, selectedTinhTrang, selectedMonthYear]`);

code = code.replace(/\(selectedMonthYear !== '' \|\| fromDate !== '' \|\| toDate !== ''\)/g, `selectedMonthYear !== ''`);
code = code.replace(/setSelectedMonthYear\(''\); setFromDate\(''\); setToDate\(''\);/g, `setSelectedMonthYear('');`);

// 4. Add the Reset Modal UI
const resetModalCode = `
      {/* RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border-t-4 border-red-800 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-red-950 to-red-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold font-display uppercase text-sm md:text-base text-amber-200">
                  Khôi Phục Dữ Liệu
                </h3>
              </div>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-red-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Bạn có thể khôi phục toàn bộ dữ liệu về trạng thái mẫu ban đầu, hoặc chỉ khôi phục các dữ liệu nằm trong một khoảng thời gian cụ thể (những khoảng thời gian khác sẽ được giữ nguyên).
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="resetMode" 
                    checked={resetMode === 'all'} 
                    onChange={() => setResetMode('all')}
                    className="text-red-800 focus:ring-red-800 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-800">Khôi phục toàn bộ</div>
                    <div className="text-[11px] text-slate-500">Xóa toàn bộ dữ liệu hiện tại và tải lại dữ liệu mẫu.</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="resetMode" 
                    checked={resetMode === 'range'} 
                    onChange={() => setResetMode('range')}
                    className="text-red-800 focus:ring-red-800 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-800">Khôi phục theo thời gian</div>
                    <div className="text-[11px] text-slate-500">Chỉ khôi phục dữ liệu gốc trong khoảng thời gian đã chọn.</div>
                  </div>
                </label>
              </div>

              {resetMode === 'range' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Từ ngày</label>
                    <input 
                      type="date" 
                      value={resetFromDate}
                      onChange={(e) => setResetFromDate(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-red-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Đến ngày</label>
                    <input 
                      type="date" 
                      value={resetToDate}
                      onChange={(e) => setResetToDate(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={executeResetData}
                  disabled={resetMode === 'range' && !resetFromDate && !resetToDate}
                  className="px-4 py-2 text-xs font-bold text-amber-100 bg-red-800 hover:bg-red-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Xác Nhận Khôi Phục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/(\{\/\* HELP \/ GUIDE MODAL \*\/\})/, resetModalCode + '\n      $1');

fs.writeFileSync('src/App.tsx', code);
