const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const \[showGuideModal, setShowGuideModal\] = useState<boolean>\(false\);/,
  `const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetFromDate, setResetFromDate] = useState<string>('');
  const [resetToDate, setResetToDate] = useState<string>('');
  const [resetMode, setResetMode] = useState<'all' | 'range'>('all');`
);

fs.writeFileSync('src/App.tsx', code);
