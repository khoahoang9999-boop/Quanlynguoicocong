const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

// Fix the duplicated if (!hoTen) return null;
code = code.replace(/if \(!hoTen\) return null; if \(!hoTen\) return null;/g, 'if (!hoTen) return null;');

// Change the filter logic
const filterRegex = /\.filter\(\(item\) => item\.hoTen && item\.lat && item\.lng\); \/\/ Must have at least name and valid coordinate/g;
code = code.replace(filterRegex, '.filter((item) => item && item.hoTen); // At least name required, coords can be 0');

// Typescript will complain if item is null, since the map returns NguoiCoCong | null. Let's fix that too.
const mapRegex = /\.map\(\(row, idx\) => \{/g;
code = code.replace(mapRegex, '.map((row, idx): NguoiCoCong | null => {');

const endFilterRegex = /\.filter\(\(item\) => item && item\.hoTen\);/g;
code = code.replace(endFilterRegex, '.filter((item): item is NguoiCoCong => item !== null && item.hoTen !== "");');

fs.writeFileSync('src/data.ts', code);
