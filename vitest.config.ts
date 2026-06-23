import { defineConfig } from "vitest/config"
import { loadEnv } from "vite"
import path from "path"

export default defineConfig(({ mode }) => {
  // Load all .env files including .env.local
  const env = loadEnv(mode, process.cwd(), "")

  return {
    test: {
      env,
      testTimeout: 30_000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  }
})
