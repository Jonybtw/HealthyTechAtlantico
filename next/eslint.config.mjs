import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "prisma/seed.ts",
    "scripts/**",
  ]),
  {
    rules: {
      // Warn on leftover console statements (use a proper logger instead)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Catch declared-but-unused variables (ignores prefixed with _)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Enforce `import type` for type-only imports to improve tree-shaking
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Enforce === over == everywhere
      eqeqeq: ["error", "always"],
    },
  },
]);

export default eslintConfig;
