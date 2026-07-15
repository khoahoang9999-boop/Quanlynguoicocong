const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

code = code.replace(
  / \.marker-pulse \{[\s\S]*\}\n\n\.marker-pulse::before \{[\s\S]*infinite;\n\}/g,
  ""
);
code = code.replace(
  /\.marker-pulse \{[\s\S]*infinite;\n\}/g,
  ""
);

code += `
.marker-pulse-emerald {
  position: relative;
}
.marker-pulse-emerald::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #10b981;
  opacity: 0.6;
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
  z-index: -1;
}

.marker-pulse-amber {
  position: relative;
}
.marker-pulse-amber::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f59e0b;
  opacity: 0.6;
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
  z-index: -1;
}
`;

fs.writeFileSync('src/index.css', code);
