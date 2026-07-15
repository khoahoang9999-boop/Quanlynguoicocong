const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the pingHtml generation with an empty string or just remove it
code = code.replace(
  /const pingHtml = pulseClass !== ''[\s\S]*?: '';/,
  `const pingHtml = ''; // Removed in favor of CSS pulseClass`
);

// Add pulseClass back to the div and remove pingHtml
code = code.replace(
  /<div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-md transition-all duration-300 \$\{colorClass\} \$\{ringClass\} \$\{scaleClass\}">\n\s*\$\{pingHtml\}/,
  `<div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-md transition-all duration-300 \${colorClass} \${ringClass} \${scaleClass} \${pulseClass}">`
);

fs.writeFileSync('src/App.tsx', code);
