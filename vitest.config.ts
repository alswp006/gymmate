import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.ts"],
    exclude: ["node_modules", ".expo"],
    testTimeout: 10000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
