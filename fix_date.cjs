const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const filterRegex = /\/\/ Try to extract from itemDate first[\s\S]*?            if \(selectedYear && itemYear !== selectedYear\) matchesMonth = false;/;

const replacement = `// Extract Year
            if (itemDate && !isNaN(itemDate.getTime())) {
                itemYear = itemDate.getFullYear().toString();
            } else if (dStr.match(/\\b(20\\d{2})\\b/)) {
                itemYear = dStr.match(/\\b(20\\d{2})\\b/)[1];
            } else if (dStr.match(/\\b(\\d{4})\\b/)) {
                itemYear = dStr.match(/\\b(\\d{4})\\b/)[1];
            }
            
            // Extract Month ONLY if it actually exists in the string
            if (dStr.includes('/')) {
                const p = dStr.split('/');
                if (p.length >= 2) itemMonth = parseInt(p[p.length - 2]).toString().padStart(2, '0');
            } else if (dStr.includes('-')) {
                const p = dStr.split('-');
                if (p.length >= 2) itemMonth = parseInt(p[1]).toString().padStart(2, '0');
            }

            if (selectedYear && itemYear !== selectedYear) matchesMonth = false;`;

code = code.replace(filterRegex, replacement);
fs.writeFileSync('src/App.tsx', code);
