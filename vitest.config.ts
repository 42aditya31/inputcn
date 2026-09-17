import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@inputcn\/core\/(.*)$/, replacement: resolve(__dirname, "packages/core/src/$1") },
      { find: "@inputcn/core", replacement: resolve(__dirname, "packages/core/src/index.ts") },
      { find: /^@inputcn\/phone\/(.*)$/, replacement: resolve(__dirname, "packages/phone/src/$1") },
      { find: "@inputcn/phone", replacement: resolve(__dirname, "packages/phone/src/index.ts") },
      { find: /^@inputcn\/currency\/(.*)$/, replacement: resolve(__dirname, "packages/currency/src/$1") },
      { find: "@inputcn/currency", replacement: resolve(__dirname, "packages/currency/src/index.ts") },
      { find: /^@inputcn\/masked\/(.*)$/, replacement: resolve(__dirname, "packages/masked/src/$1") },
      { find: "@inputcn/masked", replacement: resolve(__dirname, "packages/masked/src/index.ts") },
      { find: /^@inputcn\/percent\/(.*)$/, replacement: resolve(__dirname, "packages/percent/src/$1") },
      { find: "@inputcn/percent", replacement: resolve(__dirname, "packages/percent/src/index.ts") },
      { find: /^@inputcn\/card\/(.*)$/, replacement: resolve(__dirname, "packages/card/src/$1") },
      { find: "@inputcn/card", replacement: resolve(__dirname, "packages/card/src/index.ts") },
      { find: /^@inputcn\/duration\/(.*)$/, replacement: resolve(__dirname, "packages/duration/src/$1") },
      { find: "@inputcn/duration", replacement: resolve(__dirname, "packages/duration/src/index.ts") },
      { find: /^@inputcn\/color\/(.*)$/, replacement: resolve(__dirname, "packages/color/src/$1") },
      { find: "@inputcn/color", replacement: resolve(__dirname, "packages/color/src/index.ts") },
      { find: /^@inputcn\/cron\/(.*)$/, replacement: resolve(__dirname, "packages/cron/src/$1") },
      { find: "@inputcn/cron", replacement: resolve(__dirname, "packages/cron/src/index.ts") },
      { find: /^@inputcn\/filesize\/(.*)$/, replacement: resolve(__dirname, "packages/filesize/src/$1") },
      { find: "@inputcn/filesize", replacement: resolve(__dirname, "packages/filesize/src/index.ts") },
      { find: /^@inputcn\/ip\/(.*)$/, replacement: resolve(__dirname, "packages/ip/src/$1") },
      { find: "@inputcn/ip", replacement: resolve(__dirname, "packages/ip/src/index.ts") },
      { find: /^@inputcn\/mention\/(.*)$/, replacement: resolve(__dirname, "packages/mention/src/$1") },
      { find: "@inputcn/mention", replacement: resolve(__dirname, "packages/mention/src/index.ts") },
      { find: /^@inputcn\/testing\/(.*)$/, replacement: resolve(__dirname, "packages/testing/src/$1") },
      { find: "@inputcn/testing", replacement: resolve(__dirname, "packages/testing/src/index.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/*/test/**/*.test.{ts,tsx}", "apps/*/test/**/*.test.{ts,tsx}"],
  },
})
