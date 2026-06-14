import { defineConfig, devices } from "@playwright/test";

/** ローカル headless E2E（Class A、実キー不要 = ローカルゲストで動作）。 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // ローカル headless はコールド dev server の timing jitter で稀に落ちる（実装回帰でなく環境揺れ）。
  // 1 回 retry でフレッシュ context 再実行（flaky は list reporter に明示され隠蔽しない）。
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5180",
    headless: true,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --port 5180 --strictPort",
    url: "http://localhost:5180",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
