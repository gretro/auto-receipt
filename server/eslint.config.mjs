import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const tsFiles = ["**/*.ts"];
const compatConfigs = compat.extends(
  "plugin:@typescript-eslint/recommended",
  "prettier",
  "plugin:prettier/recommended",
);

export default [
  // Apply TypeScript + Prettier to .ts files only (flat config defaults to .js otherwise)
  ...compatConfigs.map((config) => ({ ...config, files: tsFiles })),
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
      },
    },
    rules: {
      "@typescript-eslint/no-use-before-define": [
        "error",
        { functions: false },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": ["error"],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
