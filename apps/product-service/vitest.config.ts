import { resolve } from "node:path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@cavaliercommerce/core": resolve(__dirname, "../../packages/core/src"),
    },
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
    }),
  ],
});
