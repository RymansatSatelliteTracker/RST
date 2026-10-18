import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "src/__tests__/playwright",
  timeout: 30 * 1000,
  // Electronアプリはシングルインスタンスのため、複数ファイルを並列実行すると
  // 2つ目以降の起動が "Another instance is already running" で失敗する。
  // そのためworkerを1つに固定し、テストファイル間も直列実行にする。
  workers: 1,
  use: {
    headless: true,
  },
  expect: {
    timeout: 5000,
  },
});
