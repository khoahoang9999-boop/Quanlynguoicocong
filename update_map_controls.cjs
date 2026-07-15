const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove zoom control
code = code.replace(
  /L\.control\.zoom\(\{ position: 'topright' \}\)\.addTo\(map\);/,
  `// L.control.zoom({ position: 'topright' }).addTo(map);`
);

// We need to replace from {/* Directions Toggle Button */} to the end of Layer Switcher
// It's from line 1087 to 1154 roughly. Let's use a regex that captures everything between them.
const oldControlsRegex = /\{\/\* Directions Toggle Button \*\/\}([\s\S]*?)\{\/\* Map Layer Switcher Widget \(Under zoom control\) \*\/\}([\s\S]*?)<\/div>/;

const newControls = `{/* Map Controls: Center, Map Type, Directions */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-row gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-2xl">
            <button
              onClick={() => {
                if (mapInstance) {
                  if (markersGroupRef.current && markersGroupRef.current.getLayers()?.length > 0) {
                     mapInstance.fitBounds(markersGroupRef.current.getBounds(), { padding: [50, 50] });
                  } else {
                     mapInstance.setView([21.9863, 105.0863], 13);
                  }
                }
              }}
              title="Về trung tâm"
              className="p-1.5 rounded-lg transition-all flex flex-col items-center justify-center w-12 h-12 cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Locate className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-bold uppercase text-center leading-tight">Trung<br/>Tâm</span>
            </button>
            <button
              onClick={() => setMapType('voyager')}
              title="Bản đồ đường"
              className={\`p-1.5 rounded-lg transition-all flex flex-col items-center justify-center w-12 h-12 cursor-pointer \${mapType === 'voyager' ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}\`}
            >
              <MapIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-bold uppercase text-center leading-tight">Bản<br/>đồ</span>
            </button>
            <button
              onClick={() => setMapType('terrain')}
              title="Bản đồ địa hình"
              className={\`p-1.5 rounded-lg transition-all flex flex-col items-center justify-center w-12 h-12 cursor-pointer \${mapType === 'terrain' ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}\`}
            >
              <Layers className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-bold uppercase text-center leading-tight">Địa<br/>hình</span>
            </button>
            
            <div className="w-px bg-slate-200 my-1 mx-0.5"></div> {/* Divider */}
            
            <button
              onClick={() => {
                setShowDirections(!showDirections);
                if (!showDirections) {
                  if (selectedPerson) {
                    setDestPersonId(selectedPerson.id);
                  } else if (data?.length > 0) {
                    setDestPersonId(data[0].id);
                  }
                  
                  const other = (data || []).find(p => p.id !== (selectedPerson?.id || (data?.[0]?.id)));
                  if (other) {
                    setStartPersonId(other.id);
                  }
                }
              }}
              title="Chỉ Đường"
              className={\`p-1.5 rounded-lg transition-all flex flex-col items-center justify-center w-12 h-12 cursor-pointer \${showDirections ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}\`}
            >
              <Navigation className={\`w-5 h-5 mb-0.5 \${showDirections ? '' : 'text-red-800'} rotate-45\`} />
              <span className="text-[8px] font-bold uppercase text-center leading-tight">Chỉ<br/>đường</span>
            </button>
          </div>`;

code = code.replace(oldControlsRegex, newControls);

fs.writeFileSync('src/App.tsx', code);
