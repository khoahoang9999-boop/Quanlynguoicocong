const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

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

code = code.replace(/(\{\s*showGuideModal && \()/, modalCode + '\n      $1');

fs.writeFileSync('src/App.tsx', code);
