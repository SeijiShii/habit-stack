import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["db/**/*.test.ts", "src/**/*.test.ts", "api/**/*.test.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@db": new URL("./db", import.meta.url).pathname,
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
