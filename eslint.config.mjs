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
  ]),
  {
    rules: {
      // Downgrade to warn — codebase uses `any` heavily in UI components;
      // database types (types/database.ts) already enforce the critical boundaries.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",

      // Indonesian text in JSX naturally contains quotes — off is pragmatic here.
      "react/no-unescaped-entities": "off",

      // <img> is used intentionally for Supabase storage URLs in some components.
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
