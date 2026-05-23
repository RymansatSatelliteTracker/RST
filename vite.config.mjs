import vue from "@vitejs/plugin-vue";
import * as path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [vue(), tsconfigPaths()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    // ビルド時の「Some chunks are larger than 500 kB after minification.」の警告を抑制する
    chunkSizeWarningLimit: 1000000,
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    include: ["src/**/*.test.{ts,js}"],
    exclude: ["node_modules", "dist", "src/__tests__/playwright/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
