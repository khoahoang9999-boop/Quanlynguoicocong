const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add empty option to state
code = code.replace(
  /const \[resetMode, setResetMode\] = useState<'all' | 'range'>\('all'\);/,
  `const [resetMode, setResetMode] = useState<'all' | 'range' | 'empty'>('all');`
);

// Add empty logic to executeResetData
const executeResetRegex = /const executeResetData = \(\) => \{[\s\S]*?if \(resetMode === 'all'\) \{/;

const newExecuteReset = `const executeResetData = () => {
    let finalData = data;
    if (resetMode === 'empty') {
      setData([]);
      setSheetUrl('');
      localStorage.removeItem('saved_sheet_url');
      localStorage.removeItem('saved_nguoi_co_cong_data');
      setSuccessMsg('Đã xóa toàn bộ dữ liệu.');
      finalData = [];
    } else if (resetMode === 'all') {`;

code = code.replace(executeResetRegex, newExecuteReset);

// Add empty radio to modal
const resetModeAllRadioRegex = /<label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">[\s\S]*?<div className="font-bold text-sm text-slate-800">Khôi phục toàn bộ<\/div>[\s\S]*?<\/label>/;

const resetModeEmptyRadio = `<label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-red-50 border-red-200 transition-colors">
                  <input 
                    type="radio" 
                    name="resetMode" 
                    checked={resetMode === 'empty'} 
                    onChange={() => setResetMode('empty')}
                    className="text-red-800 focus:ring-red-800 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-red-800">Xóa sạch dữ liệu</div>
                    <div className="text-[11px] text-red-600/80">Xóa toàn bộ danh sách hiện tại để có bản đồ trống (kể cả dữ liệu mẫu).</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="resetMode" 
                    checked={resetMode === 'all'} 
                    onChange={() => setResetMode('all')}
                    className="text-red-800 focus:ring-red-800 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-800">Khôi phục toàn bộ (Dữ liệu mẫu)</div>
                    <div className="text-[11px] text-slate-500">Tải lại dữ liệu mẫu (demo) ban đầu.</div>
                  </div>
                </label>`;

code = code.replace(resetModeAllRadioRegex, resetModeEmptyRadio);

fs.writeFileSync('src/App.tsx', code);
