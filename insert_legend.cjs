const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const legendCode = `
              <div className="space-y-2">
                <p className="font-bold text-red-950 text-sm">Chú Thích Bản Đồ:</p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 ring-2 ring-red-200"></span></span>
                    <span className="font-medium text-gray-700 text-[11px]">Còn sống (Đỏ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-amber-200"></span></span>
                    <span className="font-medium text-gray-700 text-[11px]">Đang công tác (Vàng)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500 ring-2 ring-slate-200"></span></span>
                    <span className="font-medium text-gray-700 text-[11px]">Đã mất (Xám)</span>
                  </div>
                </div>
              </div>`;

code = code.replace(
  /(\s*<\/div>\s*)(<div className="space-y-2">\s*<p className="font-bold text-red-950 text-sm">Hướng dẫn tải hình ảnh từ file Excel:<\/p>)/,
  `$1${legendCode}\n              $2`
);

fs.writeFileSync('src/App.tsx', code);
