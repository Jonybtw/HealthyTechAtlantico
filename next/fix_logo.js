const fs = require('fs');
let code = fs.readFileSync('src/components/app-shell.tsx', 'utf8');

code = code.replace(
  /className=\"h-\[100px\] w-auto object-contain drop-shadow-md\"/g,
  'className="h-[100px] w-auto object-contain brightness-0 invert drop-shadow-md"'
);

fs.writeFileSync('src/components/app-shell.tsx', code);
