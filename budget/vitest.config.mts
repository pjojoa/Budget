import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // "server-only" lanza SIEMPRE fuera de la condición "react-server" de
      // Next — en Vitest (Node plano) hay que anularlo para poder probar
      // los repositorios directamente.
      "server-only": path.resolve(import.meta.dirname, "src/test/serverOnlyMock.ts"),
    },
  },
});
