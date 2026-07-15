const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const innerHtml = person\.hinhAnh && person\.hinhAnh !== ''[\s\S]*?`<span class="text-xs font-semibold leading-none">\$\{iconSymbol\}<\/span>`;/,
  `const innerHtml = person.hinhAnh && person.hinhAnh !== ''
      ? \`<img src="\${person.hinhAnh}" class="w-full h-full object-cover rounded-full relative z-10" alt="\${person.hoTen}" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-xs font-semibold leading-none relative z-10\\'>\${iconSymbol}</span>';" />\`
      : \`<span class="text-xs font-semibold leading-none relative z-10">\${iconSymbol}</span>\`;
      
    const pingHtml = pulseClass !== '' 
      ? \`<span class="animate-ping absolute inline-flex h-full w-full rounded-full \${person.tinhTrang === 'Đang công tác' ? 'bg-amber-400' : 'bg-red-500'} opacity-75" style="z-index: 0;"></span>\` 
      : '';`
);

code = code.replace(
  /<div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-md transition-all duration-300 \$\{colorClass\} \$\{ringClass\} \$\{scaleClass\} \$\{pulseClass\} ">/,
  `<div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-md transition-all duration-300 \${colorClass} \${ringClass} \${scaleClass}">\n          \${pingHtml}`
);

// We need to also remove custom-leaflet-icon-container default background if it has any, but we didn't add any.
// Just to be safe, replace classname
code = code.replace(
  /className: 'custom-leaflet-icon-container'/,
  `className: 'custom-leaflet-icon-container !bg-transparent !border-0'`
);

fs.writeFileSync('src/App.tsx', code);
