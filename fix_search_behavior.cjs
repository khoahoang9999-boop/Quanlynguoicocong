const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Sync global search with normal search
code = code.replace(
  'setGlobalSearchQuery(e.target.value);',
  'setGlobalSearchQuery(e.target.value);\n                  setSearchQuery(e.target.value);'
);

// 2. Add Enter key support
code = code.replace(
  'onFocus={() => setShowGlobalSearchResults(true)}',
  `onFocus={() => setShowGlobalSearchResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && globalSearchResults.length > 0) {
                    handleSelectPerson(globalSearchResults[0]);
                    setGlobalSearchQuery(globalSearchResults[0].hoTen);
                    setSearchQuery(globalSearchResults[0].hoTen);
                    setShowGlobalSearchResults(false);
                  }
                }}`
);

// 3. Update the suggestion click handler
const oldOnClick = `onClick={() => {
                          handleSelectPerson(person);
                          setGlobalSearchQuery('');
                          setShowGlobalSearchResults(false);
                        }}`;
const newOnClick = `onClick={() => {
                          handleSelectPerson(person);
                          setGlobalSearchQuery(person.hoTen);
                          setSearchQuery(person.hoTen);
                          setShowGlobalSearchResults(false);
                        }}`;
code = code.replace(oldOnClick, newOnClick);

// 4. Also update the close button in search bar
const oldClearClick = `onClick={() => {
                    setGlobalSearchQuery('');
                    setShowGlobalSearchResults(false);
                  }}`;
const newClearClick = `onClick={() => {
                    setGlobalSearchQuery('');
                    setSearchQuery('');
                    setShowGlobalSearchResults(false);
                  }}`;
code = code.replace(oldClearClick, newClearClick);

// 5. Update handleSelectPerson to add a strong blink/bounce animation to the marker
const oldSelectFunc = `const handleSelectPerson = (person: NguoiCoCong) => {
    setSelectedPerson(person);
    if (mapRef.current) {
      mapRef.current.setView([person.lat, person.lng], 16);
      
      const marker = markerMapRef.current.get(person.id);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 150);
      }
    }

    // Auto-close mobile drawer
    if (window.innerWidth < 768) {
      setIsSidebarOpenOnMobile(false);
    }
  };`;

const newSelectFunc = `const handleSelectPerson = (person: NguoiCoCong) => {
    setSelectedPerson(person);
    if (mapRef.current) {
      mapRef.current.setView([person.lat, person.lng], 16);
      
      // Delay so marker map can update if filteredData changed
      setTimeout(() => {
        const marker = markerMapRef.current.get(person.id);
        if (marker) {
          marker.openPopup();
          
          // Add a strong visual highlight to the marker element
          const el = marker.getElement();
          if (el) {
            const innerDiv = el.querySelector('div');
            if (innerDiv) {
              innerDiv.classList.add('ring-8', 'ring-amber-400', 'animate-bounce', '!bg-amber-400', 'shadow-[0_0_20px_rgba(251,191,36,0.8)]', 'z-[1000]');
              setTimeout(() => {
                innerDiv.classList.remove('ring-8', 'ring-amber-400', 'animate-bounce', '!bg-amber-400', 'shadow-[0_0_20px_rgba(251,191,36,0.8)]', 'z-[1000]');
              }, 3000);
            }
          }
        }
      }, 300);
    }

    // Auto-close mobile drawer
    if (window.innerWidth < 768) {
      setIsSidebarOpenOnMobile(false);
    }
  };`;

code = code.replace(oldSelectFunc, newSelectFunc);

fs.writeFileSync('src/App.tsx', code);
