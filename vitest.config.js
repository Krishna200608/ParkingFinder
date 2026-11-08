import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    hookTimeout: 30000,
    testTimeout: 30000,
    fileParallelism: false, // Run suites sequentially to prevent Atlas connection spikes
    environment: 'node',
  },
});

