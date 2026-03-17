import { existsSync, mkdirSync, writeFileSync } from "node:fs";

mkdirSync(".next/types", { recursive: true });

const cacheLifeFile = ".next/types/cache-life.d.ts";

if (!existsSync(cacheLifeFile)) {
  writeFileSync(cacheLifeFile, "export {};\n");
}
