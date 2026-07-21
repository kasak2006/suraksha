import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/*
 * §8 of the spec: the four verdict colors are semantic ONLY — they may never
 * be used decoratively. Any string containing a `verdict-*` token outside the
 * allowlisted verdict UI below fails lint. If you legitimately need them in a
 * new place, add that path to the allowlist in the same PR so the exception
 * is reviewable.
 */
const verdictTokenPattern = "verdict-(safe|caution|risky|danger)";
const verdictTokenMessage =
  "Verdict colors are reserved for verdict UI (spec §8). Use them only in " +
  "allowlisted verdict components, or extend the allowlist in eslint.config.mjs.";

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${verdictTokenPattern}/]`,
          message: verdictTokenMessage,
        },
        {
          selector: `TemplateElement[value.raw=/${verdictTokenPattern}/]`,
          message: verdictTokenMessage,
        },
      ],
    },
  },
  {
    // Verdict UI allowlist — the only places verdict colors may appear.
    files: ["components/verdict/**"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
];

export default eslintConfig;
