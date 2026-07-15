const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="col-span-2 bg-red-800 rounded-xl p-4 text-white shadow-md relative overflow-hidden">[\s\S]*?<div className="text-\[10px\] font-bold text-slate-500 uppercase tracking-wide">Đã mất \(Đã chết\)<\/div>\s*<div className="text-lg font-display font-bold text-slate-700">\{stats\.daMat\}<\/div>\s*<\/div>/;

const replacement = `<div className="col-span-2 bg-red-800 rounded-xl p-4 text-white shadow-md relative overflow-hidden flex flex-col items-center justify-center text-center">
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-red-900 to-transparent opacity-50" />
                    <Database className="w-6 h-6 text-red-300 mb-1" />
                    <div className="text-3xl font-display font-bold">{stats.total}</div>
                    <div className="text-xs font-medium text-red-200 uppercase tracking-wide mt-1">Tổng số hồ sơ</div>
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-xl font-display font-bold text-emerald-700">{stats.conSong}</div>
                    <div className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wide mt-1">Còn sống</div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-xl font-display font-bold text-amber-700">{stats.dangCongTac}</div>
                    <div className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wide mt-1">Đang công tác</div>
                  </div>
                  
                  <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center space-y-1">
                    <div className="text-lg font-display font-bold text-slate-700 leading-none">{stats.daMat}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Đã mất (Đã chết)</div>
                  </div>`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
