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
  // Server-safe: importable from a React Server Component.
  { ...shared, entry: ["src/mention.ts", "src/schema.ts"], clean: true },
  // Client: the directive must survive bundling, and rollup's treeshake pass
  // strips module-level directives — hence treeshake: false here.
  {
    ...shared,
    entry: ["src/index.ts", "src/use-mention-input.ts", "src/mention-input.tsx"],
    clean: false,
    treeshake: false,
    banner: { js: '"use client"' },
  },
])
