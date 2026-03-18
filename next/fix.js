const fs = require('fs');
let code = fs.readFileSync('src/components/app-shell.tsx', 'utf8');
const regex = /<div className=\"border-b border-white\/10 px-6 py-5\">[\s\S]*?brightness-0 invert\"\s*\/>\s*<\/div>\s*<\/div>/;
const newStr = `<div className="flex flex-col items-center justify-center border-b border-white/10 px-6 pb-6 pt-10">\n                  <Image\n                    src="/logo.png"\n                    alt={brandName}\n                    width={160}\n                    height={160}\n                    className="h-[100px] w-auto object-contain drop-shadow-md"\n                  />\n                </div>`;
code = code.replace(regex, newStr);
fs.writeFileSync('src/components/app-shell.tsx', code);
