const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const executeResetData = \(\) => \{[\s\S]*?fitAllMarkers\(.*?\);\s*\}, 400\);\s*\};/;

const newFunc = `const executeResetData = () => {
    let finalData = data;
    if (resetMode === 'all') {
      setData(MOCK_DATA);
      setSheetUrl('');
      localStorage.removeItem('saved_sheet_url');
      localStorage.removeItem('saved_nguoi_co_cong_data');
      setSuccessMsg('Đã khôi phục toàn bộ dữ liệu mẫu gốc.');
      finalData = MOCK_DATA;
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

      finalData = [...remainingData, ...restoredMockData];
      setData(finalData);
      
      // Save to localStorage so it persists
      localStorage.setItem('saved_nguoi_co_cong_data', JSON.stringify(finalData));

      setSuccessMsg('Đã khôi phục dữ liệu gốc cho khoảng thời gian đã chọn.');
    }
    
    setShowResetModal(false);
    setTimeout(() => {
      fitAllMarkers(finalData);
    }, 400);
  };`;

code = code.replace(regex, newFunc);
fs.writeFileSync('src/App.tsx', code);
