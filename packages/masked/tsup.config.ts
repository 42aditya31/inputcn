import { defineConfig } from "tsup"

const shared = {
  format: ["esm"] as const,
  dts: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  target: "es2022" as const,
  external: ["react", "react-dom", "zod", /^@inputcn\//],
}

export default defineConfig([
  // Server-safe modules: no directive, importable from a React Server Component.
  { ...shared, entry: ["src/schema.ts"], clean: true },
  // Client modules: the directive must survive bundling or Next.js will treat
  // these as server code and the hooks will throw at build time.
  { ...shared, entry: ["src/index.ts", "src/use-masked-input.ts", "src/masked-input.tsx"], clean: false, treeshake: false, banner: { js: '"use client"' } },
])
