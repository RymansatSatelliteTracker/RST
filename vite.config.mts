import vue from "@vitejs/plugin-vue";
import * as path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [vue(), tsconfigPaths()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
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
});
