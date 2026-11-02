import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Hasil build/preview Cloudflare (berisi bundel hasil generate)
    ".open-next/**",
    ".wrangler/**",
    // One-off Node migration scripts (CommonJS)
    "scripts/**",
  ]),
  {
    rules: {
      // Downgrade to warn — codebase uses `any` heavily in UI components;
      // database types (types/database.ts) already enforce the critical boundaries.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",

      // Indonesian text in JSX naturally contains quotes — off is pragmatic here.
      "react/no-unescaped-entities": "off",

      // <img> dipakai sengaja untuk foto dari /storage (R2) di beberapa komponen.
      "@next/next/no-img-element": "warn",

      // Hook exhaustive-deps warnings are tracked but non-blocking.
      "react-hooks/exhaustive-deps": "warn",

      // Pre-existing patterns — tracked as warnings, not blocking.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;
