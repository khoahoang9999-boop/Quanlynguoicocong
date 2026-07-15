const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldControlsRegex = /\{\/\* Map Controls: Center, Map Type, Directions \*\/\}([\s\S]*?)\{\/\* Interactive Directions \/ Routing Panel Overlay \*\/\}/;

const newControls = `{/* Map Controls: Center, Map Type, Directions */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-row gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-2xl">
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
              className="px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Locate className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase leading-tight">Trung Tâm</span>
            </button>
            <button
              onClick={() => setMapType('voyager')}
              title="Bản đồ đường"
              className={\`px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer \${mapType === 'voyager' ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}\`}
            >
              <MapIcon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase leading-tight">Bản đồ</span>
            </button>
            <button
              onClick={() => setMapType('terrain')}
              title="Bản đồ địa hình"
              className={\`px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer \${mapType === 'terrain' ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}\`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase leading-tight">Địa hình</span>
            </button>
            
            <div className="w-px bg-slate-200 my-1.5 mx-0.5"></div> {/* Divider */}
            
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
              className={\`px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer \${showDirections ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}\`}
            >
              <Navigation className={\`w-4 h-4 \${showDirections ? '' : 'text-red-800'} rotate-45\`} />
              <span className="text-[10px] font-bold uppercase leading-tight">Chỉ đường</span>
            </button>
          </div>

          {/* Interactive Directions / Routing Panel Overlay */}
`;

code = code.replace(oldControlsRegex, newControls);
fs.writeFileSync('src/App.tsx', code);
