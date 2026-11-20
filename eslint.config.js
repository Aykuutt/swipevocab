// Kod denetimi: `npm run lint`. GitHub'a her gönderimde de çalışır (.github/workflows/ci.yml).
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: ["dist/", "legacy/", "node_modules/", "public/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      // JSX içinde kullanılan bileşenleri "kullanılıyor" say.
      "react/jsx-uses-vars": "error",
      "react/jsx-key": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
  {
    files: ["api/**/*.js", "*.config.js", "**/*.test.{js,jsx}"],
    languageOptions: { globals: { ...globals.node } },
  },
];
