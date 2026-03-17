import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = [
  "src/app/(app)",
  "src/app/(auth)",
  "src/components/ui",
  "src/components/app-shell.tsx",
];

const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
const BLOCKED_PATTERNS = [
  { pattern: /rounded-\[28px\]/, message: "Use balanced radius tokens instead of rounded-[28px]." },
  { pattern: /rounded-\[30px\]/, message: "Use balanced radius tokens instead of rounded-[30px]." },
  { pattern: /rounded-\[26px\]/, message: "Use balanced radius tokens instead of rounded-[26px]." },
  { pattern: /rounded-\[24px\]/, message: "Use balanced radius tokens instead of rounded-[24px]." },
  { pattern: /\btext-4xl\b/, message: "Use balanced heading scale tokens instead of text-4xl." },
  { pattern: /\btext-5xl\b/, message: "Use balanced heading scale tokens instead of text-5xl." },
  { pattern: /\bmax-w-7xl\b/, message: "Use balanced page width tokens instead of max-w-7xl." },
  { pattern: /\bpy-10\b/, message: "Use balanced vertical spacing tokens instead of py-10." },
  { pattern: /\bgap-10\b/, message: "Use balanced gap tokens instead of gap-10." },
  { pattern: /text-\[42px\]/, message: "Use shared heading scale tokens instead of ad-hoc text-[42px]." },
  { pattern: /bg-card\/85 glass/, message: "Use shared surface classes instead of ad-hoc glass card stacks." },
];

function collectFiles(pathname, output = []) {
  const stats = statSync(pathname, { throwIfNoEntry: false });
  if (!stats) return output;

  if (stats.isDirectory()) {
    for (const entry of readdirSync(pathname)) {
      collectFiles(join(pathname, entry), output);
    }
    return output;
  }

  if (FILE_EXTENSIONS.has(extname(pathname))) {
    output.push(pathname);
  }

  return output;
}

function main() {
  const issues = [];

  for (const root of ROOTS) {
    const files = collectFiles(root);
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const rule of BLOCKED_PATTERNS) {
        if (rule.pattern.test(content)) {
          issues.push(`${file}: ${rule.message}`);
        }
      }
    }
  }

  if (issues.length > 0) {
    console.error("UI consistency check failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log("UI consistency check passed.");
}

main();
