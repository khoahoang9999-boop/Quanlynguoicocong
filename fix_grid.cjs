const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<\/div>\s*<div className="space-y-1">\s*<label className="text-\[10px\] font-bold text-gray-500 uppercase tracking-wider">Tình trạng<\/label>/;
const replacement = `</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tình trạng</label>`;
code = code.replace(regex, replacement);

const regex2 = /<\/select>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="space-y-1">\s*<label className="text-\[10px\] font-bold text-gray-500 uppercase tracking-wider">Diện chính sách<\/label>/;
const replacement2 = `</select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Diện chính sách</label>`;
code = code.replace(regex2, replacement2);

fs.writeFileSync('src/App.tsx', code);
