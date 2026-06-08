import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: [
      'db/**/*.test.ts',
      'src/**/*.test.{ts,tsx}',
      'api/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@db': new URL('./db', import.meta.url).pathname,
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
