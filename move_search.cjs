const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find the GLOBAL SEARCH BAR ON MAP code block and remove it
const searchBarStart = `{/* GLOBAL SEARCH BAR ON MAP */}`;
const searchBarEnd = `                  </div>\n                )}\n              </div>\n            )}\n          </div>`;
const searchBarBlock = code.substring(code.indexOf(searchBarStart), code.indexOf(searchBarEnd) + searchBarEnd.length);

code = code.replace(searchBarBlock + '\n\n', '');

// Now insert it into the header
const headerTarget = `</div>\n\n          {/* Sync & Toolbar Buttons */}`;

// Update the classes of the search bar to fit well in the header
let newSearchBarBlock = searchBarBlock
  .replace('absolute top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 w-64 md:w-80 z-[1000] bg-transparent', 'flex-1 max-w-md mx-4 hidden md:block z-[1000] bg-transparent')
  .replace('bg-white/95 backdrop-blur-md', 'bg-red-950/50 backdrop-blur-md border-red-800 text-amber-50 placeholder-red-300/70')
  .replace('text-slate-400', 'text-red-300/70')
  .replace('hover:text-slate-600', 'hover:text-red-200');

code = code.replace(headerTarget, newSearchBarBlock + '\n\n          {/* Sync & Toolbar Buttons */}');

fs.writeFileSync('src/App.tsx', code);
