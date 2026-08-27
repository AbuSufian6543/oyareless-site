import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "prisma/migrations/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Unused arguments are common in route handlers and event callbacks where
      // the signature is fixed; an underscore prefix marks them as deliberate.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // A pages-directory rule. This app is App Router only, so the anchors it
      // flags are links to route handlers (CSV exports, file downloads) where a
      // client-side <Link> would be wrong.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default config;
