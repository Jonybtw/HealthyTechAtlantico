const fs = require('fs');
let code = fs.readFileSync('src/components/app-shell.tsx', 'utf8');

code = code.replace(
  /<div className=\"flex items-center justify-center border-b border-white\/10 px-6 py-5\">[\s\S]*?<Image(?:[^>]+|\n)+ \/>\s*<\/div>/g,
  (match) => {
    const hasPriority = match.includes('priority');
    return `<div className="flex items-center justify-center border-b border-white/10 px-6 py-5">
              <Image
                src="/logo.png"
                alt={brandName}
                width={120}
                height={120}
                className="w-[96px] h-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)]"
                ${hasPriority ? 'priority' : ''}
              />
            </div>`;
  }
);

fs.writeFileSync('src/components/app-shell.tsx', code);
