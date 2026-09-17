#!/usr/bin/env node
/**
 * Point the project at a new public URL.
 *
 *   pnpm site-url https://inputcn.vercel.app
 *
 * Most of the codebase reads `site.config.json` at build time, so it needs no
 * touching. Three things cannot: README.md and public/llms.txt are static text
 * a reader sees before any build runs, and public/r/*.json is generated output
 * that embeds absolute URLs. This script updates the config, rewrites those
 * two files, and re-runs the registry build so all three agree again.
 */

import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CONFIG = join(ROOT, "site.config.json")

/** Static files whose URLs are read by humans, not by a build step. */
const REWRITE = ["README.md", join("public", "llms.txt")]

const next = process.argv[2]

if (!next) {
  console.error(`Usage: pnpm site-url <url>

  pnpm site-url https://inputcn.vercel.app

Current: ${JSON.parse(readFileSync(CONFIG, "utf8")).siteUrl}`)
  process.exit(1)
}

let url
try {
  url = new URL(next)
} catch {
  console.error(`Not a URL: ${next}`)
  process.exit(1)
}
if (url.protocol !== "https:") {
  console.error(`Must be https, got ${url.protocol}//`)
  process.exit(1)
}

// No trailing slash: everything downstream appends "/r/..." to it.
const clean = url.origin
const config = JSON.parse(readFileSync(CONFIG, "utf8"))
const previous = config.siteUrl

if (previous === clean) {
  console.log(`Already ${clean}. Nothing to do.`)
  process.exit(0)
}

config.siteUrl = clean
writeFileSync(CONFIG, JSON.stringify(config, null, 2) + "\n", "utf8")

let changed = 0
for (const rel of REWRITE) {
  const path = join(ROOT, rel)
  const before = readFileSync(path, "utf8")
  const after = before.split(previous).join(clean)
  if (before !== after) {
    writeFileSync(path, after, "utf8")
    const n = before.split(previous).length - 1
    changed += n
    console.log(`  ${rel.replace(/\\/g, "/")} — ${n} URL${n === 1 ? "" : "s"}`)
  }
}

console.log(`\n${previous} -> ${clean}  (${changed} static references)`)

// The registry embeds absolute URLs, so it has to be regenerated to match.
execFileSync(process.execPath, [join(ROOT, "scripts", "build-registry.mjs")], {
  stdio: "inherit",
})

console.log(`
Done. Commit the change, then redeploy:

  git add -A && git commit -m "chore: point at ${clean}" && git push
`)
