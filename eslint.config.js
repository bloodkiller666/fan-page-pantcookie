import { FlatCompat } from "@eslint/eslintrc";
import pluginSecurity from "eslint-plugin-security";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores: ["**/node_modules/**", "**/.next/**", "**/out/**", "**/public/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  pluginSecurity.configs.recommended,
  {
    rules: {
      // Pragmatic baseline: surfaced as warnings so they can be cleaned up incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "security/detect-object-injection": "off",
    },
  },
];
