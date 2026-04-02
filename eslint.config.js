import js from "@eslint/js";
import pluginSecurity from "eslint-plugin-security";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/out/**",
      "**/public/**",
      "**/*.config.js"
    ]
  },
  js.configs.recommended,
  pluginSecurity.configs.recommended,
  {
      plugins: {
          "@next/next": nextPlugin,
      },
      languageOptions: {
          globals: {
              ...globals.browser,
              ...globals.node,
              ...globals.es2021
          },
          parserOptions: {
              ecmaFeatures: { jsx: true },
              ecmaVersion: 'latest',
              sourceType: 'module',
          },
      },
      rules: {
         ...nextPlugin.configs.recommended.rules,
         ...nextPlugin.configs["core-web-vitals"].rules,
         "no-eval": "error",
         "no-implied-eval": "error",
         "no-new-func": "error",
         "no-script-url": "error",
         "security/detect-object-injection": "off" 
      }
  }
];
