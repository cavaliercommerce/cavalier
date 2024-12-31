import { config } from "@cavaliercommerce/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default {
  ...config,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  root: true,
  env: {
    node: true,
    jest: true,
  },
};
