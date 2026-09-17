#!/usr/bin/env node
/**
 * Generates the shadcn registry from package source.
 *
 * Distribution model — the same hybrid shadcn itself uses with Radix:
 *   • the COMPONENT source is copied into the user's project, because that is
 *     the code they will want to restyle and edit
 *   • @inputcn/core stays an npm dependency, because nobody wants to fork a
 *     caret engine, and bugs fixed there should reach them via `npm update`
 *
 * Source is the single truth. Nothing here is hand-maintained, so the registry
 * cannot drift from the components — which is the failure mode that makes
 * registries stale.
 */

import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT_DIR = join(ROOT, "public", "r")

// The public URL lives in exactly one file. Change it with `pnpm site-url
// <url>`, which rewrites the places it cannot be read from at runtime and then
// re-runs this script.
const HOMEPAGE = JSON.parse(
  readFileSync(join(ROOT, "site.config.json"), "utf8"),
).siteUrl

/** Where installed files land in the consumer's project. */
const TARGET_ROOT = "components/inputcn"

const ITEMS = [
  {
    name: "inputcn-base",
    type: "registry:file",
    title: "inputcn base styles",
    description:
      "Token-driven stylesheet for every inputcn component. Reads your shadcn CSS variables; hardcodes no colour or radius. Import once.",
    dependencies: ["@inputcn/core"],
    registryDependencies: [],
    files: [
      {
        src: "packages/core/styles/inputcn.css",
        target: `${TARGET_ROOT}/inputcn.css`,
        type: "registry:file",
      },
    ],
    docs: "Import it once, anywhere in your app:\n\n  import \"@/components/inputcn/inputcn.css\"",
  },
  {
    name: "phone-input",
    type: "registry:ui",
    title: "Phone Input",
    description:
      "Phone number field with a searchable country selector, live per-country formatting and E.164 output. Smart paste detects the country and offers an undo.",
    dependencies: ["@inputcn/core", "@inputcn/phone"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/phone/src/phone-input.tsx", target: `${TARGET_ROOT}/phone/phone-input.tsx` },
      { src: "packages/phone/src/use-phone-input.ts", target: `${TARGET_ROOT}/phone/use-phone-input.ts` },
      { src: "packages/phone/src/phone.ts", target: `${TARGET_ROOT}/phone/phone.ts` },
      { src: "packages/phone/src/countries.ts", target: `${TARGET_ROOT}/phone/countries.ts` },
    ],
  },
  {
    name: "currency-input",
    type: "registry:ui",
    title: "Currency Input",
    description:
      "Money field emitting integer minor units, so no float ever touches a price. Locale-correct formatting, zero-decimal currencies, three layouts.",
    dependencies: ["@inputcn/core", "@inputcn/currency"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/currency/src/currency-input.tsx", target: `${TARGET_ROOT}/currency/currency-input.tsx` },
      { src: "packages/currency/src/use-currency-input.ts", target: `${TARGET_ROOT}/currency/use-currency-input.ts` },
      { src: "packages/currency/src/currency.ts", target: `${TARGET_ROOT}/currency/currency.ts` },
    ],
  },
  {
    name: "masked-input",
    type: "registry:ui",
    title: "Masked Input",
    description:
      "Template-masked text field with true caret preservation. Emits the raw value, never the formatted string. Twelve presets included.",
    dependencies: ["@inputcn/core", "@inputcn/masked"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/masked/src/masked-input.tsx", target: `${TARGET_ROOT}/masked/masked-input.tsx` },
      { src: "packages/masked/src/use-masked-input.ts", target: `${TARGET_ROOT}/masked/use-masked-input.ts` },
    ],
  },
  {
    name: "percent-input",
    type: "registry:ui",
    title: "Percent Input",
    description:
      "Percentage field that displays 12.5 and emits 0.125. The off-by-100 bug, solved once.",
    dependencies: ["@inputcn/core", "@inputcn/percent"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/percent/src/percent-input.tsx", target: `${TARGET_ROOT}/percent/percent-input.tsx` },
      { src: "packages/percent/src/use-percent-input.ts", target: `${TARGET_ROOT}/percent/use-percent-input.ts` },
      { src: "packages/percent/src/percent.ts", target: `${TARGET_ROOT}/percent/percent.ts` },
    ],
  },
  {
    name: "card-input",
    type: "registry:ui",
    title: "Credit Card Input",
    description:
      "Card number, expiry and CVC with live brand detection, Luhn validation, brand-aware grouping and focus advancement.",
    dependencies: ["@inputcn/core", "@inputcn/card"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/card/src/card-input.tsx", target: `${TARGET_ROOT}/card/card-input.tsx` },
      { src: "packages/card/src/use-card-input.ts", target: `${TARGET_ROOT}/card/use-card-input.ts` },
      { src: "packages/card/src/card.ts", target: `${TARGET_ROOT}/card/card.ts` },
    ],
  },
  {
    name: "duration-input",
    type: "registry:ui",
    title: "Duration Input",
    description:
      "Duration field accepting 2h 30m, 90m or 1:30 and emitting seconds. Text, segmented and preset layouts.",
    dependencies: ["@inputcn/core", "@inputcn/duration"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/duration/src/duration-input.tsx", target: `${TARGET_ROOT}/duration/duration-input.tsx` },
      { src: "packages/duration/src/use-duration-input.ts", target: `${TARGET_ROOT}/duration/use-duration-input.ts` },
      { src: "packages/duration/src/duration.ts", target: `${TARGET_ROOT}/duration/duration.ts` },
    ],
  },
  {
    name: "color-input",
    type: "registry:ui",
    title: "Colour Input",
    description:
      "Colour field with a swatch palette, format conversion and live WCAG contrast checking against a reference colour.",
    dependencies: ["@inputcn/core", "@inputcn/color"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/color/src/color-input.tsx", target: `${TARGET_ROOT}/color/color-input.tsx` },
      { src: "packages/color/src/use-color-input.ts", target: `${TARGET_ROOT}/color/use-color-input.ts` },
      { src: "packages/color/src/color.ts", target: `${TARGET_ROOT}/color/color.ts` },
    ],
  },
  {
    name: "cron-input",
    type: "registry:ui",
    title: "Cron Input",
    description:
      "Cron schedule field with a plain-English preview, upcoming run times, a visual builder and a minInterval guard.",
    dependencies: ["@inputcn/core", "@inputcn/cron"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/cron/src/cron-input.tsx", target: `${TARGET_ROOT}/cron/cron-input.tsx` },
      { src: "packages/cron/src/use-cron-input.ts", target: `${TARGET_ROOT}/cron/use-cron-input.ts` },
      { src: "packages/cron/src/cron.ts", target: `${TARGET_ROOT}/cron/cron.ts` },
    ],
  },
  {
    name: "filesize-input",
    type: "registry:ui",
    title: "File Size Input",
    description:
      "File size field that keeps MB and MiB distinct and emits bytes.",
    dependencies: ["@inputcn/core", "@inputcn/filesize"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/filesize/src/filesize-input.tsx", target: `${TARGET_ROOT}/filesize/filesize-input.tsx` },
      { src: "packages/filesize/src/use-filesize-input.ts", target: `${TARGET_ROOT}/filesize/use-filesize-input.ts` },
      { src: "packages/filesize/src/filesize.ts", target: `${TARGET_ROOT}/filesize/filesize.ts` },
    ],
  },
  {
    name: "ip-input",
    type: "registry:ui",
    title: "IP / CIDR Input",
    description:
      "IPv4 and CIDR field with range computation, address classification and prefix bounds.",
    dependencies: ["@inputcn/core", "@inputcn/ip"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/ip/src/ip-input.tsx", target: `${TARGET_ROOT}/ip/ip-input.tsx` },
      { src: "packages/ip/src/use-ip-input.ts", target: `${TARGET_ROOT}/ip/use-ip-input.ts` },
      { src: "packages/ip/src/ip.ts", target: `${TARGET_ROOT}/ip/ip.ts` },
    ],
  },
  {
    name: "mention-input",
    type: "registry:ui",
    title: "Mention Input",
    description:
      "Comment field with an @-triggered picker. Emits text plus the ids actually mentioned, recomputed on every edit.",
    dependencies: ["@inputcn/core", "@inputcn/mention"],
    registryDependencies: ["inputcn-base"],
    files: [
      { src: "packages/mention/src/mention-input.tsx", target: `${TARGET_ROOT}/mention/mention-input.tsx` },
      { src: "packages/mention/src/use-mention-input.ts", target: `${TARGET_ROOT}/mention/use-mention-input.ts` },
      { src: "packages/mention/src/mention.ts", target: `${TARGET_ROOT}/mention/mention.ts` },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Import rewriting
 * ------------------------------------------------------------------ */

// Hoisted: these run over every line of every file.
const RELATIVE_IMPORT = /(from\s+["'])(\.[^"']*?)\.js(["'])/g
const SIDE_EFFECT_IMPORT = /(import\s+["'])(\.[^"']*?)\.js(["'])/g

/**
 * Source uses explicit `.js` extensions because it is authored as strict ESM.
 * Consumer projects are overwhelmingly Next.js with bundler resolution, where
 * extensionless is the convention and `.js` on a `.ts` file reads as a mistake.
 * Package imports (`@inputcn/core/...`) are deliberately left alone — those
 * resolve through the npm dependency.
 */
function rewriteImports(code) {
  return code.replace(RELATIVE_IMPORT, "$1$2$3").replace(SIDE_EFFECT_IMPORT, "$1$2$3")
}

function fileType(target) {
  if (target.endsWith(".css")) return "registry:file"
  if (/\/use-[^/]+\.ts$/.test(target)) return "registry:hook"
  if (target.endsWith(".tsx")) return "registry:ui"
  return "registry:lib"
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

const manifestItems = []
let totalBytes = 0

for (const item of ITEMS) {
  const files = item.files.map((f) => {
    const raw = readFileSync(join(ROOT, f.src), "utf8")
    const content = f.src.endsWith(".css") ? raw : rewriteImports(raw)
    totalBytes += Buffer.byteLength(content)
    return {
      path: f.target,
      content,
      type: f.type ?? fileType(f.target),
      target: f.target,
    }
  })

  const built = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    ...(item.dependencies.length ? { dependencies: item.dependencies } : {}),
    ...(item.registryDependencies.length
      ? { registryDependencies: item.registryDependencies }
      : {}),
    files,
    ...(item.docs ? { docs: item.docs } : {}),
  }

  writeFileSync(join(OUT_DIR, `${item.name}.json`), JSON.stringify(built, null, 2) + "\n")

  manifestItems.push({
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    ...(item.dependencies.length ? { dependencies: item.dependencies } : {}),
    ...(item.registryDependencies.length
      ? { registryDependencies: item.registryDependencies }
      : {}),
    files: item.files.map((f) => ({
      path: f.src,
      type: f.type ?? fileType(f.target),
      target: f.target,
    })),
  })
}

const manifest = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "inputcn",
  homepage: HOMEPAGE,
  items: manifestItems,
}

writeFileSync(join(ROOT, "registry.json"), JSON.stringify(manifest, null, 2) + "\n")

// An index so an agent (or a human) can enumerate the registry in one request.
writeFileSync(
  join(OUT_DIR, "index.json"),
  JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "inputcn",
      homepage: HOMEPAGE,
      items: manifestItems.map(({ name, type, title, description }) => ({
        name,
        type,
        title,
        description,
        url: `${HOMEPAGE}/r/${name}.json`,
      })),
    },
    null,
    2,
  ) + "\n",
)

const hash = createHash("sha256")
for (const item of ITEMS) hash.update(item.name)

console.log(`registry built → public/r/`)
for (const item of ITEMS) {
  console.log(`  ${item.name.padEnd(16)} ${item.files.length} file(s)`)
}
console.log(`  ${String(ITEMS.length).padEnd(16)} items, ${(totalBytes / 1024).toFixed(1)} kB of source`)
