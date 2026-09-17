import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const pkg = (name: string, sub = "index.ts") =>
  resolve(__dirname, `../../packages/${name}/src/${sub}`)

const NAMES = [
  "phone", "currency", "masked", "percent", "card", "duration",
  "color", "cron", "filesize", "ip", "mention",
]

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Source, not dist: the docs site is also how the library gets looked at
    // while it is being written. Order matters — deep paths before the bare
    // specifier, and the literal stylesheet before the catch-all regex that
    // would otherwise rewrite it to packages/core/src/styles.css.
    alias: [
      {
        find: "@inputcn/core/styles.css",
        replacement: resolve(__dirname, "../../packages/core/styles/inputcn.css"),
      },
      { find: /^@inputcn\/core\/(.*)$/, replacement: pkg("core", "$1") },
      { find: "@inputcn/core", replacement: pkg("core") },
      ...NAMES.flatMap((n) => [
        { find: new RegExp(`^@inputcn\/${n}\/(.*)$`), replacement: pkg(n, "$1") },
        { find: `@inputcn/${n}`, replacement: pkg(n) },
      ]),
    ],
  },
  // Served straight from the canonical registry output rather than a copy, so
  // the docs site and `pnpm registry` can never disagree: /r/phone-input.json
  // and /llms.txt are the real files.
  publicDir: resolve(__dirname, "../../public"),
  server: { port: 5182 },
})
