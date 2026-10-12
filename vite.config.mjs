import vue from "@vitejs/plugin-vue";
import * as path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
    // ビルド時の「Some chunks are larger than 500 kB after minification.」の警告を抑制する
    chunkSizeWarningLimit: 1000000,
  },
  worker: {
    // satellite.jsのビルド時にエラーが出るため、ESモジュール形式で出力するように設定する
    // https://github.com/shashwatak/satellite-js/issues/165
    format: "es",
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
