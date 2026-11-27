import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginSecurity from "eslint-plugin-security";

export default [
  { ignores: ["**/node_modules/**", "**/.next/**", "**/out/**", "**/public/**", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTs,
  pluginSecurity.configs.recommended,
  {
    rules: {
      // Pragmatic baseline: surfaced as warnings so they can be cleaned up incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "security/detect-object-injection": "off",
      // New in eslint-config-next 16. Temporarily warnings: fix after the 18-Dec event, then remove these.
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
