const fs = require('fs');
let code = fs.readFileSync('src/components/app-shell.tsx', 'utf8');

code = code.replace(
  /<div className=\"flex flex-col items-center justify-center border-b border-white\/10 px-6 pb-6 pt-10\">/g,
  '<div className=\"flex items-center justify-center border-b border-white/10 px-6 py-8\">'
);

code = code.replace(
  /className=\"h-\[100px\] w-auto object-contain brightness-0 invert drop-shadow-md\"/g,
  'className=\"h-20 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]\"'
);

fs.writeFileSync('src/components/app-shell.tsx', code);
