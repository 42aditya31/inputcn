import { defineConfig } from "tsup"

const shared = {
  format: ["esm"] as const,
  dts: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  target: "es2022" as const,
  external: ["react", "react-dom", /^@inputcn\//],
}

export default defineConfig([
  // Server-safe modules: no directive, importable from a React Server Component.
  { ...shared, entry: ["src/caret.ts", "src/mask.ts", "src/paste.ts", "src/validity.ts", "src/messages.ts", "src/types.ts", "src/warn.ts"], clean: true },
  // Client modules: the directive must survive bundling or Next.js will treat
  // these as server code and the hooks will throw at build time.
  { ...shared, entry: ["src/index.ts", "src/provider.tsx", "src/use-field.ts", "src/use-masked-value.ts", "src/use-latest.ts"], clean: false, treeshake: false, banner: { js: '"use client"' } },
])
