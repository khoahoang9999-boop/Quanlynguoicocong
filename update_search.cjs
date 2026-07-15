const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add state
const stateRegex = /const \[searchQuery, setSearchQuery\] = useState<string>\(''\);/;
code = code.replace(stateRegex, `const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState<boolean>(false);`);

// Add useMemo
const memoRegex = /\/\/ Dashboard Statistics/;
code = code.replace(memoRegex, `// Global Search Results
  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim() || !data) return [];
    return data.filter(item => 
      item.hoTen.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
      item.diaChi.toLowerCase().includes(globalSearchQuery.toLowerCase())
    ).slice(0, 10); // Limit to 10 results
  }, [data, globalSearchQuery]);

  // Dashboard Statistics`);

// Add UI
const uiRegex = /\{\/\* Floating toggle sidebar button for mobile \*\/\}/;
const searchUI = `{/* GLOBAL SEARCH BAR ON MAP */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 w-64 md:w-80 z-[1000] bg-transparent">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhanh người có công..."
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setShowGlobalSearchResults(true);
                }}
                onFocus={() => setShowGlobalSearchResults(true)}
                className="w-full pl-9 pr-8 py-2.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-red-800 transition-all font-medium"
              />
              {globalSearchQuery && (
                <button 
                  onClick={() => {
                    setGlobalSearchQuery('');
                    setShowGlobalSearchResults(false);
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showGlobalSearchResults && globalSearchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto">
                {globalSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Không tìm thấy kết quả phù hợp.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {globalSearchResults.map(person => (
                      <button
                        key={person.id}
                        onClick={() => {
                          handleSelectPerson(person);
                          setGlobalSearchQuery('');
                          setShowGlobalSearchResults(false);
                        }}
                        className="text-left p-3 hover:bg-red-50 border-b border-slate-50 last:border-0 transition-colors flex flex-col gap-1"
                      >
                        <div className="font-bold text-sm text-slate-800">{person.hoTen}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {person.diaChi}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating toggle sidebar button for mobile */}`;

code = code.replace(uiRegex, searchUI);

fs.writeFileSync('src/App.tsx', code);
