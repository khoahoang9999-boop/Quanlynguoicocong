const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. First, we need to separate the stats and profiles tabs
const statsBlockRegex = /\{activeSidebarTab === 'stats' && \(\s*<div className="p-4 space-y-4">[\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*\{\/\* Footer info brand \*\/\}/;

const newSidebarContent = `{activeSidebarTab === 'stats' && (
              <div className="p-4 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> THỐNG KÊ TỔNG QUAN
                  </h2>
                  {isSidebarOpenOnMobile && (
                    <button 
                      onClick={() => setIsSidebarOpenOnMobile(false)}
                      className="md:hidden p-1 text-gray-400 hover:text-gray-600 bg-white rounded border border-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 bg-red-800 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-red-900 to-transparent opacity-50" />
                    <Database className="w-6 h-6 text-red-300 mb-1" />
                    <div className="text-3xl font-display font-bold">{stats.total}</div>
                    <div className="text-xs font-medium text-red-200 uppercase tracking-wide mt-1">Tổng số hồ sơ</div>
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm">
                    <div className="text-xl font-display font-bold text-emerald-700">{stats.conSong}</div>
                    <div className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wide mt-1">Còn sống</div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 shadow-sm">
                    <div className="text-xl font-display font-bold text-amber-700">{stats.dangCongTac}</div>
                    <div className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wide mt-1">Đang công tác</div>
                  </div>
                  
                  <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Đã mất (Đã chết)</div>
                    <div className="text-lg font-display font-bold text-slate-700">{stats.daMat}</div>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'profiles' && (
              <div className="flex flex-col h-full animate-fade-in">
                {/* Filters Area */}
                <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
                  <div className="flex items-center justify-between mb-1 md:hidden">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-slate-400" /> TÌM KIẾM
                    </h2>
                    <button 
                      onClick={() => setIsSidebarOpenOnMobile(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 bg-white rounded border border-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm họ tên hoặc địa chỉ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* Filters grid */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Năm dữ liệu</label>
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
                  </div>

                  {/* Clear Filters Indicator */}
                  {(selectedDienChinhSach !== 'Tất cả' || selectedTinhTrang !== 'Tất cả' || selectedYear !== '' || searchQuery) && (
                    <div className="flex justify-between items-center text-[11px] text-red-800 bg-red-50 p-1.5 rounded-md border border-red-100">
                      <span>Đang lọc: {filteredData?.length} kết quả</span>
                      <button 
                        onClick={() => {
                          setSelectedDienChinhSach('Tất cả');
                          setSelectedTinhTrang('Tất cả');
                          setSelectedYear('');
                          setSearchQuery('');
                        }}
                        className="font-bold underline uppercase tracking-wider text-[9px] hover:text-red-950"
                      >
                        Đặt lại lọc
                      </button>
                    </div>
                  )}
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-2">
                  {filteredData?.length === 0 ? (
                    <div className="py-12 px-4 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-500">Không tìm thấy hồ sơ nào</p>
                      <p className="text-[11px] text-slate-400 mt-1">Thử xóa bớt bộ lọc hoặc thay đổi từ khóa</p>
                    </div>
                  ) : (
                    filteredData.map((person) => {
                      const isSelected = selectedPerson?.id === person.id;
                      
                      let badgeStyle = 'bg-red-50 text-red-800 border-red-200';
                      let indicatorColor = 'bg-red-600';
                      
                      if (person.tinhTrang === 'Đã mất (Đã chết)') {
                        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                        indicatorColor = 'bg-slate-500';
                      } else if (person.tinhTrang === 'Đang công tác') {
                        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                        indicatorColor = 'bg-amber-500';
                      }

                      return (
                        <div
                          key={person.id}
                          onClick={() => handleSelectPerson(person)}
                          className={\`
                            p-3 rounded-lg border bg-white transition-all duration-200 cursor-pointer flex gap-3 group hover:shadow-md hover:border-red-800/40 relative overflow-hidden
                            \${isSelected ? 'border-red-800 ring-2 ring-red-800/10 shadow-md bg-red-50/10' : 'border-slate-200'}
                          \`}
                        >
                          <div className={\`absolute left-0 top-0 bottom-0 w-1 \${indicatorColor}\`} />
                          
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
                            <img 
                              src={person.hinhAnh || DEFAULT_PORTRAIT_URL} 
                              alt={person.hoTen}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = DEFAULT_PORTRAIT_URL;
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="font-bold text-slate-900 group-hover:text-red-950 text-sm leading-tight truncate">
                                {person.hoTen}
                              </h3>
                              {person.namDuLieu && (
                                <span className="text-[9px] font-mono text-slate-400 shrink-0 border border-slate-100 px-1 rounded bg-slate-50">
                                  {person.namDuLieu.match(/\\b(20\\d{2})\\b/)?.[1] || person.namDuLieu}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-[11px] text-slate-500 truncate font-medium">
                              {person.dienChinhSach}
                            </p>
                            
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 truncate flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-red-800/70" /> {person.diaChi.split(',')[0]}
                              </span>
                              <span className={\`px-1.5 py-0.5 rounded text-[9px] font-bold border \${badgeStyle} shrink-0\`}>
                                {person.tinhTrang}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Footer info brand */}`;

code = code.replace(statsBlockRegex, newSidebarContent);

// 2. Also change selectedYear default state to ''
code = code.replace(
  /const \[selectedYear, setSelectedYear\] = useState<string>\(new Date\(\)\.getFullYear\(\)\.toString\(\)\);/,
  `const [selectedYear, setSelectedYear] = useState<string>('');`
);

// 3. And change the matchTime logic to accept empty selectedYear
const matchTimeLogicRegex = /if \(selectedYear && selectedYear !== 'Tất cả'\) \{[\s\S]*?matchesMonth = itemYear === selectedYear;\n\s*\}/;

const newMatchTimeLogic = `if (selectedYear) {
            let itemYear = '';
            if (itemDate && !isNaN(itemDate.getTime())) {
                itemYear = itemDate.getFullYear().toString();
            } else if (dStr.match(/\\b(20\\d{2})\\b/)) {
                itemYear = dStr.match(/\\b(20\\d{2})\\b/)[1];
            } else if (dStr.match(/\\b(\\d{4})\\b/)) {
                itemYear = dStr.match(/\\b(\\d{4})\\b/)[1];
            }
            matchesMonth = itemYear === selectedYear;
        }`;
code = code.replace(matchTimeLogicRegex, newMatchTimeLogic);

// We need to also clean up the unused 'listYears' if we aren't using the dropdown anymore.
// Or we can just leave listYears there, it doesn't hurt. But better to remove to avoid warning.
const listYearsHookRegex = /const listYears = useMemo\(\(\) => \{[\s\S]*?return Array\.from\(years\)\.sort\(\)\.reverse\(\);\s*\}, \[data\]\);/;
code = code.replace(listYearsHookRegex, '');

fs.writeFileSync('src/App.tsx', code);
