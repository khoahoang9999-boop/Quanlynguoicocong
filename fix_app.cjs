const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// First fix the createMarkerIcon colors
code = code.replace(
  /let colorClass = 'bg-emerald-600 border-emerald-100 text-white';/,
  `let colorClass = 'bg-red-600 border-red-100 text-white';`
);
code = code.replace(
  /let ringClass = 'ring-emerald-400\/50';/,
  `let ringClass = 'ring-red-400/50';`
);
code = code.replace(
  /let pulseClass = 'marker-pulse-emerald';/,
  `let pulseClass = 'marker-pulse-red';`
);

// Now fix the legend to have pinging circles
code = code.replace(
  /<span className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-200 inline-block" \/>/,
  `<span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 ring-2 ring-red-200"></span></span>`
);

code = code.replace(
  /<span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200 inline-block" \/>/,
  `<span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-amber-200"></span></span>`
);

// For deceased, no pulse on map, so maybe no pulse here? Or maybe we can just give it pulse-slate if we want. The user asked to make the colors blink correspondingly. On the map, deceased doesn't blink (pulseClass=''). So I will not add animate-ping to deceased.
code = code.replace(
  /<span className="w-3 h-3 rounded-full bg-slate-500 ring-2 ring-slate-200 inline-block" \/>/,
  `<span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500 ring-2 ring-slate-200"></span></span>`
);

fs.writeFileSync('src/App.tsx', code);
