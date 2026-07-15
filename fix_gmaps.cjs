const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add state
code = code.replace(
  /const \[mapInstance, setMapInstance\] = useState<L\.Map \| null>\(null\);/,
  `const [mapInstance, setMapInstance] = useState<L.Map | null>(null);\n  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState<string | null>(null);`
);

// Fix button 1
const btn1Regex = /<a\s+href=\{`https:\/\/www\.google\.com\/maps\/dir\/\?api=1&origin=\$\{[\s\S]*?\}&destination=\$\{[\s\S]*?\}`\}\s+target="_blank"\s+rel="noreferrer"\s+className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2\.5 px-3 rounded-lg shadow transition-all cursor-pointer"\s*>\s*<ExternalLink className="w-3\.5 h-3\.5 text-amber-400" \/>\s*<span>Chỉ Đường \(Google Maps\)<\/span>\s*<\/a>/;

const btn1Replacement = `<button 
                      onClick={() => {
                        const origin = startType === 'gps' 
                          ? (gpsCoords ? \`\${gpsCoords[0]},\${gpsCoords[1]}\` : '') 
                          : (data.find(p => p.id === startPersonId)?.lat + ',' + data.find(p => p.id === startPersonId)?.lng);
                        const dest = data.find(p => p.id === destPersonId)?.lat + ',' + data.find(p => p.id === destPersonId)?.lng;
                        setGoogleMapsEmbedUrl(\`https://maps.google.com/maps?saddr=\${origin}&daddr=\${dest}&output=embed\`);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chỉ Đường (Google Maps)</span>
                    </button>`;

code = code.replace(btn1Regex, btn1Replacement);

// Fix button 2
const btn2Regex = /<a\s+href=\{`https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=\$\{selectedPerson\.lat\},\$\{selectedPerson\.lng\}`\}\s+target="_blank"\s+rel="noreferrer"\s+className="flex items-center gap-1\.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-4\.5 rounded-lg shadow transition-all shrink-0 cursor-pointer"\s*>\s*<Navigation className="w-3\.5 h-3\.5 text-amber-400" \/>\s*<span>Chỉ Đường \(Google Maps\)<\/span>\s*<\/a>/;

const btn2Replacement = `<button 
                        onClick={() => setGoogleMapsEmbedUrl(\`https://maps.google.com/maps?daddr=\${selectedPerson.lat},\${selectedPerson.lng}&output=embed\`)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-4.5 rounded-lg shadow transition-all shrink-0 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-400" />
                        <span>Chỉ Đường (Google Maps)</span>
                      </button>`;

code = code.replace(btn2Regex, btn2Replacement);

// Add Modal
const modalCode = `
      {/* Google Maps Embed Modal */}
      {googleMapsEmbedUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 p-4 sm:p-8 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative">
            <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Navigation className="w-4 h-4 text-amber-400" /> Bản đồ Google Maps
              </h3>
              <button 
                onClick={() => setGoogleMapsEmbedUrl(null)}
                className="p-1.5 bg-slate-700 hover:bg-red-600 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 w-full h-full bg-slate-100">
              <iframe 
                src={googleMapsEmbedUrl} 
                className="w-full h-full border-0" 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/\{\/\* Guide Modal \*\/\}/, modalCode + '\n      {/* Guide Modal */}');

fs.writeFileSync('src/App.tsx', code);
