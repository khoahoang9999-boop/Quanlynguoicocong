const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

if (!code.includes('.marker-pulse-red')) {
code += `

.marker-pulse-red {
  position: relative;
}
.marker-pulse-red::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #ef4444;
  opacity: 0.6;
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
  z-index: -1;
}

.marker-pulse-slate {
  position: relative;
}
.marker-pulse-slate::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #64748b;
  opacity: 0.6;
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
  z-index: -1;
}
`;
fs.writeFileSync('src/index.css', code);
}
