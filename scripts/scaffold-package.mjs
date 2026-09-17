#!/usr/bin/env node
/**
 * Creates the boilerplate for a component package and registers it everywhere
 * it needs to be known: root tsconfig paths and the vitest alias table.
 *
 * Usage:  node scripts/scaffold-package.mjs <name> "<description>" [--no-zod]
 *
 * Exists because eight packages of identical scaffolding is eight chances to
 * get one subtly wrong — and a missing subpath export is exactly the bug that
 * shipped in Phase 1.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const [name, description, ...flags] = process.argv.slice(2)

if (!name || !description) {
  console.error('usage: scaffold-package.mjs <name> "<description>" [--no-zod]')
  process.exit(1)
}

const withZod = !flags.includes("--no-zod")
const dir = join(ROOT, "packages", name)

if (existsSync(join(dir, "package.json"))) {
  console.error(`packages/${name} already exists`)
  process.exit(1)
}

mkdirSync(join(dir, "src"), { recursive: true })
mkdirSync(join(dir, "test"), { recursive: true })

/* ---------------- package.json ---------------- */

const exportsMap = {
  ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
  [`./${name}`]: { types: `./dist/${name}.d.ts`, import: `./dist/${name}.js` },
  ...(withZod
    ? { "./schema": { types: "./dist/schema.d.ts", import: "./dist/schema.js" } }
    : {}),
  "./package.json": "./package.json",
}

writeFileSync(
  join(dir, "package.json"),
  JSON.stringify(
    {
      name: `@inputcn/${name}`,
      version: "0.1.0",
      description,
      license: "MIT",
      type: "module",
      sideEffects: false,
      files: ["dist"],
      exports: exportsMap,
      scripts: { build: "tsup", dev: "tsup --watch", typecheck: "tsc --noEmit" },
      dependencies: { "@inputcn/core": "workspace:*" },
      peerDependencies: {
        react: "^18.2.0 || ^19.0.0",
        ...(withZod ? { zod: "^3.23.0 || ^4.0.0" } : {}),
      },
      ...(withZod ? { peerDependenciesMeta: { zod: { optional: true } } } : {}),
      keywords: ["react", name, "input", "shadcn", "inputcn"],
    },
    null,
    2,
  ) + "\n",
)

/* ---------------- tsconfig ---------------- */

writeFileSync(
  join(dir, "tsconfig.json"),
  JSON.stringify(
    {
      extends: "../../tsconfig.base.json",
      compilerOptions: { noEmit: true, rootDir: "src" },
      include: ["src/**/*"],
    },
    null,
    2,
  ) + "\n",
)

/* ---------------- tsup ---------------- */

const serverEntries = [`"src/${name}.ts"`, ...(withZod ? ['"src/schema.ts"'] : [])]
const clientEntries = [
  '"src/index.ts"',
  `"src/use-${name}-input.ts"`,
  `"src/${name}-input.tsx"`,
]

writeFileSync(
  join(dir, "tsup.config.ts"),
  `import { defineConfig } from "tsup"

const shared = {
  format: ["esm"] as const,
  dts: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  target: "es2022" as const,
  external: ["react", "react-dom"${withZod ? ', "zod"' : ""}, /^@inputcn\\//],
}

export default defineConfig([
  // Server-safe: importable from a React Server Component.
  { ...shared, entry: [${serverEntries.join(", ")}], clean: true },
  // Client: the directive must survive bundling, and rollup's treeshake pass
  // strips module-level directives — hence treeshake: false here.
  {
    ...shared,
    entry: [${clientEntries.join(", ")}],
    clean: false,
    treeshake: false,
    banner: { js: '"use client"' },
  },
])
`,
)

/* ---------------- register in root tsconfig ---------------- */

const tsconfigPath = join(ROOT, "tsconfig.json")
const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"))
tsconfig.compilerOptions.paths[`@inputcn/${name}`] = [`./packages/${name}/src/index.ts`]
tsconfig.compilerOptions.paths[`@inputcn/${name}/*`] = [`./packages/${name}/src/*`]
writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n")

/* ---------------- register in vitest aliases ---------------- */

const vitestPath = join(ROOT, "vitest.config.ts")
let vitest = readFileSync(vitestPath, "utf8")
if (!vitest.includes(`@inputcn/${name}"`)) {
  const entry =
    `      { find: /^@inputcn\\/${name}\\/(.*)$/, replacement: resolve(__dirname, "packages/${name}/src/$1") },\n` +
    `      { find: "@inputcn/${name}", replacement: resolve(__dirname, "packages/${name}/src/index.ts") },\n`
  vitest = vitest.replace("    ],\n  },", entry + "    ],\n  },")
  writeFileSync(vitestPath, vitest)
}

console.log(`scaffolded packages/${name}`)
console.log(`  exports: ${Object.keys(exportsMap).join(", ")}`)
console.log(`  registered in tsconfig.json + vitest.config.ts`)
console.log(`  next: write src/${name}.ts, src/use-${name}-input.ts, src/${name}-input.tsx${withZod ? ", src/schema.ts" : ""}, src/index.ts`)
