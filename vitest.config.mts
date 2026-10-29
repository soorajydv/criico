import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration tests start an in-memory MongoDB replica set.
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
