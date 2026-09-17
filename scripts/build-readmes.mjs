#!/usr/bin/env node
/**
 * Generate a README.md for every package.
 *
 *   node scripts/build-readmes.mjs
 *   node scripts/build-readmes.mjs --check   # fail if stale
 *
 * npm renders the README that sits inside each package folder. The monorepo
 * root README is never seen by npm, which is why every package page said
 * "This package does not have a README".
 *
 * Prose comes from readme-meta.mjs. Everything factual — prop names, types,
 * doc comments — is read from props.generated.json, which is itself extracted
 * from the source interfaces. So a renamed prop changes the README, and no
 * human has to remember to update thirteen files.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { META } from "./readme-meta.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SITE = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8")).siteUrl
const REPO = "https://github.com/42aditya31/inputcn"
const PROPS = JSON.parse(
  readFileSync(join(ROOT, "apps", "docs", "src", "content", "props.generated.json"), "utf8"),
)

const LIME = "cdf25c"
const INK = "09090b"

/** Component packages, in the order the docs list them. */
const ORDER = [
  "core", "phone", "currency", "masked", "percent", "card",
  "duration", "color", "cron", "filesize", "ip", "mention", "testing",
]

const badge = (label, message, color) =>
  `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(
    message,
  )}-${color}?style=flat-square&labelColor=${INK}`

const npmBadge = (name) =>
  `https://img.shields.io/npm/v/${encodeURIComponent(name)}?style=flat-square&labelColor=${INK}&color=${LIME}&label=npm`

/** A markdown table cell must not break the row. */
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ").trim()

/**
 * Long union types are unreadable in a table; wrap them in code and trim.
 *
 * The pipe in a union type has to be escaped even inside backticks — GFM
 * splits table cells before it parses inline code, so `A | B` silently becomes
 * two columns and the row falls apart.
 */
function typeCell(type) {
  let t = type.replace(/\s+/g, " ").trim()

  // An inline object literal collapses to {…}. Truncating one mid-property
  // produces a type that is not just long but actively misleading.
  let guard = 0
  while (/\{[^{}]*\}/.test(t) && guard++ < 8) {
    t = t.replace(/\{[^{}]*\}/g, "{…}")
  }

  const short = t.length > 64 ? t.slice(0, 61).trimEnd() + "…" : t
  return "`" + short.replace(/\|/g, "\\|") + "`"
}

function propTable(props) {
  if (!props.length) return ""
  const rows = props
    .map(
      (p) =>
        `| \`${p.name}${p.optional ? "?" : ""}\` | ${typeCell(p.type)} | ${
          cell(p.doc) || "—"
        } |`,
    )
    .join("\n")
  return `| Prop | Type | Description |\n|---|---|---|\n${rows}\n`
}

function render(pkgDir) {
  const pkgPath = join(ROOT, "packages", pkgDir, "package.json")
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
  const meta = META[pkgDir]
  if (!meta) throw new Error(`No README meta for packages/${pkgDir}`)

  const slug = `${pkgDir === "filesize" ? "filesize" : pkgDir}-input`
  const entry = PROPS.components[slug]
  const constraints = entry ? entry.own.filter((p) => p.kind === "constraint") : []
  const options = entry ? entry.own.filter((p) => p.kind !== "constraint") : []
  const display = entry?.display

  const out = []

  /* ---------------- header ---------------- */
  out.push(`<div align="center">`)
  out.push(``)
  out.push(`# ${pkg.name}`)
  out.push(``)
  out.push(`**${meta.tagline}**`)
  out.push(``)
  out.push(
    `[![npm](${npmBadge(pkg.name)})](https://www.npmjs.com/package/${pkg.name}) ` +
      `[![license](${badge("license", "MIT", "a1a1aa")})](${REPO}/blob/main/LICENSE) ` +
      `[![types](${badge("types", "included", "a1a1aa")})](${pkg.homepage})`,
  )
  out.push(``)
  const lead = display
    ? `[Live demo](${pkg.homepage})`
    : `[Documentation](${SITE}/docs)`
  out.push(
    `${lead} · [The contract](${SITE}/docs/value-semantics) · ` +
      `[All 11 components](${SITE}/components)`,
  )
  out.push(``)
  out.push(`</div>`)
  out.push(``)
  out.push(`---`)
  out.push(``)

  /* ---------------- blurb ---------------- */
  for (const p of meta.blurb) out.push(p, ``)

  /* ---------------- install ---------------- */
  out.push(`## Install`)
  out.push(``)
  if (pkgDir === "core" || pkgDir === "testing") {
    out.push("```bash")
    out.push(`npm i ${pkg.name}`)
    out.push("```")
  } else {
    out.push(
      `Recommended — copy the component source into your project, the way shadcn/ui does:`,
    )
    out.push(``)
    out.push("```bash")
    out.push(`npx shadcn@latest add ${SITE}/r/${slug}.json`)
    out.push("```")
    out.push(``)
    out.push(`Or install the package and import it directly:`)
    out.push(``)
    out.push("```bash")
    out.push(`npm i ${pkg.name}`)
    out.push("```")
    out.push(``)
    out.push(`> [!NOTE]`)
    out.push(
      `> Either way, import the stylesheet once in your app root:`,
    )
    out.push(`> \`\`\`ts`)
    out.push(`> import "@inputcn/core/styles.css"`)
    out.push(`> \`\`\``)
    out.push(
      `> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.`,
    )
  }
  out.push(``)

  /* ---------------- example ---------------- */
  out.push(`## Usage`)
  out.push(``)
  out.push("```tsx")
  out.push(meta.example)
  out.push("```")
  out.push(``)

  if (display) {
    const canonical = {
      "phone-input": ["`string`", "E.164", '`"+442071234567"`'],
      "currency-input": ["`number`", "integer minor units", "`129900`"],
      "masked-input": ["`string`", "raw, no mask characters", '`"12345678901"`'],
      "percent-input": ["`number`", "fraction", "`0.125`"],
      "card-input": ["`string`", "digits only", '`"4242424242424242"`'],
      "duration-input": ["`number`", "seconds", "`5400`"],
      "color-input": ["`string`", "hex", '`"#CDF25C"`'],
      "cron-input": ["`string`", "expression", '`"0 9 * * 1-5"`'],
      "filesize-input": ["`number`", "bytes", "`1048576`"],
      "ip-input": ["`string`", "address or CIDR", '`"10.0.0.0/24"`'],
      "mention-input": ["`MentionValue`", "text plus the ids in it", "`{ text, ids }`"],
    }[slug]

    if (canonical) {
      out.push(`> [!IMPORTANT]`)
      out.push(
        `> \`onChange\` emits the **canonical value**, never the formatted string.`,
      )
      out.push(`>`)
      out.push(`> | Type | Form | Example |`)
      out.push(`> |---|---|---|`)
      out.push(`> | ${canonical[0]} | ${canonical[1]} | ${canonical[2]} |`)
      out.push(`>`)
      out.push(
        `> Pass \`name\` and a hidden input carries that value, so \`FormData\` and Server Actions receive it too — with no client component.`,
      )
      out.push(``)
    }
  }

  /* ---------------- highlights ---------------- */
  out.push(`## What makes it different`)
  out.push(``)
  for (const [title, body] of meta.highlights) {
    out.push(`- **${title}.** ${body}`)
  }
  out.push(``)

  /* ---------------- constraints ---------------- */
  if (constraints.length) {
    out.push(`## Validation`)
    out.push(``)
    out.push(
      `Rules are props. No schema, no resolver, no \`onBlur\` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.`,
    )
    out.push(``)
    out.push(propTable(constraints))
    out.push(
      `Every error element carries a \`data-rule\` attribute naming the rule that failed, so tests assert the rule rather than the sentence.`,
    )
    out.push(``)
    out.push(
      `A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:`,
    )
    out.push(``)
    out.push("```ts")
    out.push(`import { ${schemaName(pkgDir)} } from "${pkg.name}/schema"`)
    out.push("```")
    out.push(``)
  }

  /* ---------------- props ---------------- */
  if (!meta.noProps && options.length) {
    out.push(`## Props`)
    out.push(``)
    out.push(propTable(options))
    out.push(
      `Plus the ${PROPS.shared.length} props every inputcn component implements identically — \`value\`, \`onChange\`, \`name\`, \`required\`, \`variant\`, \`size\` and the rest. See [the props contract](${SITE}/docs/props-contract).`,
    )
    out.push(``)
  }

  /* ---------------- entry points ---------------- */
  // Read straight off the exports map, so a new subpath appears here the
  // moment it is added rather than the day someone notices.
  if (meta.entryPoints) {
    const subpaths = Object.keys(pkg.exports ?? {}).filter(
      (k) => k !== "." && k !== "./package.json",
    )
    if (subpaths.length) {
      out.push(`## Entry points`)
      out.push(``)
      out.push(
        `Every module is importable on its own, so you take only what you use.`,
      )
      out.push(``)
      out.push(`| Import | What it is |`)
      out.push(`|---|---|`)
      out.push(`| \`${pkg.name}\` | Everything below, re-exported |`)
      for (const sub of subpaths) {
        const note = meta.entryPoints[sub.replace("./", "")] ?? ""
        out.push(`| \`${pkg.name}${sub.slice(1)}\` | ${cell(note)} |`)
      }
      out.push(``)
    }
  }

  /* ---------------- gotcha ---------------- */
  if (meta.gotcha) {
    out.push(`> [!WARNING]`)
    out.push(`> ${meta.gotcha}`)
    out.push(``)
  }

  /* ---------------- footer ---------------- */
  out.push(`## Accessibility`)
  out.push(``)
  out.push(
    `Keyboard complete, labelled, and errors announced once through \`role="alert"\` rather than on every keystroke. 50 axe-core checks run on every commit.`,
  )
  out.push(``)
  out.push(`> [!CAUTION]`)
  out.push(
    `> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](${REPO}/blob/main/ACCESSIBILITY.md).`,
  )
  out.push(``)
  out.push(`---`)
  out.push(``)
  out.push(
    `<sub>Part of [inputcn](${SITE}) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>`,
  )
  out.push(``)

  return out.join("\n")
}

function schemaName(pkgDir) {
  return {
    phone: "phoneSchema",
    currency: "moneySchema",
    masked: "maskedSchema",
    percent: "percentSchema",
    card: "cardSchema",
    duration: "durationSchema",
    color: "colorSchema",
    cron: "cronSchema",
    filesize: "fileSizeSchema",
    ip: "cidrSchema",
    mention: "mentionSchema",
  }[pkgDir]
}

const check = process.argv.includes("--check")
let stale = 0

for (const pkgDir of ORDER) {
  const target = join(ROOT, "packages", pkgDir, "README.md")
  const next = render(pkgDir)
  const current = existsSync(target) ? readFileSync(target, "utf8") : null

  if (check) {
    if (current !== next) {
      console.error(`stale: packages/${pkgDir}/README.md`)
      stale++
    }
  } else {
    writeFileSync(target, next, "utf8")
    console.log(`  packages/${pkgDir}/README.md`)
  }
}

if (check) {
  if (stale) {
    console.error(`\n${stale} README(s) out of date. Run: pnpm readmes`)
    process.exit(1)
  }
  console.log("READMEs are current.")
} else {
  console.log(`\n${ORDER.length} READMEs generated.`)
}
