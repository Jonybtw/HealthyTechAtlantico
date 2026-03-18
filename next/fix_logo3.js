const fs = require('fs');
let code = fs.readFileSync('src/components/app-shell.tsx', 'utf8');

code = code.replace(
  /<div className=\"flex h-\[88px\] items-center justify-center border-b border-white\/10 px-6 py-4\">\s*<Image(?:[^>]+|\n)+ \/>\s*<\/div>/g,
  (match) => {
    const hasPriority = match.includes('priority');
    return `<div className="flex items-center justify-center border-b border-white/10 px-6 py-6">
              <Image
                src="/logo.png"
                alt={brandName}
                width={200}
                height={200}
                className="w-[160px] h-auto object-contain brightness-0 invert drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                ${hasPriority ? 'priority' : ''}
              />
            </div>`;
  }
);

fs.writeFileSync('src/components/app-shell.tsx', code);
