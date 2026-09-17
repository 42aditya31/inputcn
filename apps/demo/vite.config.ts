import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const pkg = (name: string, sub = "index.ts") =>
  resolve(__dirname, `../../packages/${name}/src/${sub}`)

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Point at source, not dist, so the harness hot-reloads while you edit
    // the library itself. Order matters: deep paths before the bare specifier.
    alias: [
      // Must precede the catch-all regex below, which would otherwise rewrite
      // this to packages/core/src/styles.css and fail to resolve.
      {
        find: "@inputcn/core/styles.css",
        replacement: resolve(__dirname, "../../packages/core/styles/inputcn.css"),
      },
      { find: /^@inputcn\/core\/(.*)$/, replacement: pkg("core", "$1") },
      { find: "@inputcn/core", replacement: pkg("core") },
      { find: /^@inputcn\/phone\/(.*)$/, replacement: pkg("phone", "$1") },
      { find: "@inputcn/phone", replacement: pkg("phone") },
      { find: /^@inputcn\/currency\/(.*)$/, replacement: pkg("currency", "$1") },
      { find: "@inputcn/currency", replacement: pkg("currency") },
      { find: /^@inputcn\/masked\/(.*)$/, replacement: pkg("masked", "$1") },
      { find: "@inputcn/masked", replacement: pkg("masked") },
      { find: /^@inputcn\/percent\/(.*)$/, replacement: pkg("percent", "$1") },
      { find: "@inputcn/percent", replacement: pkg("percent") },
      { find: /^@inputcn\/card\/(.*)$/, replacement: pkg("card", "$1") },
      { find: "@inputcn/card", replacement: pkg("card") },
      { find: /^@inputcn\/duration\/(.*)$/, replacement: pkg("duration", "$1") },
      { find: "@inputcn/duration", replacement: pkg("duration") },
      { find: /^@inputcn\/color\/(.*)$/, replacement: pkg("color", "$1") },
      { find: "@inputcn/color", replacement: pkg("color") },
      { find: /^@inputcn\/cron\/(.*)$/, replacement: pkg("cron", "$1") },
      { find: "@inputcn/cron", replacement: pkg("cron") },
      { find: /^@inputcn\/filesize\/(.*)$/, replacement: pkg("filesize", "$1") },
      { find: "@inputcn/filesize", replacement: pkg("filesize") },
      { find: /^@inputcn\/ip\/(.*)$/, replacement: pkg("ip", "$1") },
      { find: "@inputcn/ip", replacement: pkg("ip") },
      { find: /^@inputcn\/mention\/(.*)$/, replacement: pkg("mention", "$1") },
      { find: "@inputcn/mention", replacement: pkg("mention") },
    ],
  },
  server: { port: 5180, open: true },
})
