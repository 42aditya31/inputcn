#!/usr/bin/env node
/**
 * Generate the skills' reference files from source.
 *
 * A skill is instructions loaded into an agent's context at the moment it
 * writes code, so a stale prop list in one is worse than a stale prop list in
 * documentation — a human notices the docs are wrong, an agent just uses them.
 *
 *   node scripts/build-skills.mjs         # write
 *   node scripts/build-skills.mjs --check # fail if stale
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PROPS = JSON.parse(
  readFileSync(join(ROOT, "packages", "cli", "src", "props.generated.json"), "utf8"),
)
const SITE = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8")).siteUrl

const CANONICAL = {
  "phone-input": ["string", "E.164", '"+442071234567"'],
  "currency-input": ["number", "integer minor units", "129900"],
  "masked-input": ["string", "raw, mask stripped", '"12345678901"'],
  "percent-input": ["number", "fraction", "0.125"],
  "card-input": ["string", "digits only", '"4242424242424242"'],
  "duration-input": ["number", "seconds", "5400"],
  "color-input": ["string", "hex", '"#CDF25C"'],
  "cron-input": ["string", "expression", '"0 9 * * 1-5"'],
  "filesize-input": ["number", "bytes", "1048576"],
  "ip-input": ["string", "address or CIDR", '"10.0.0.0/24"'],
  "mention-input": ["object", "{ text, ids }", '{ text: "hi @ada", ids: ["u1"] }'],
}

const SPEC_TYPE = {
  "phone-input": "phone",
  "currency-input": "currency",
  "masked-input": "masked",
  "percent-input": "percent",
  "card-input": "card",
  "duration-input": "duration",
  "color-input": "color",
  "cron-input": "cron",
  "filesize-input": "filesize",
  "ip-input": "ip",
  "mention-input": "mention",
}

const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ").trim()

function typeCell(type) {
  let t = String(type).replace(/\s+/g, " ").trim()
  let guard = 0
  while (/\{[^{}]*\}/.test(t) && guard++ < 8) t = t.replace(/\{[^{}]*\}/g, "{…}")
  const short = t.length > 56 ? t.slice(0, 53).trimEnd() + "…" : t
  return "`" + short.replace(/\|/g, "\\|") + "`"
}

function table(props) {
  if (!props.length) return "_None._\n"
  return [
    "| Prop | Type | Notes |",
    "|---|---|---|",
    ...props.map((p) => `| \`${p.name}\` | ${typeCell(p.type)} | ${cell(p.doc) || "—"} |`),
    "",
  ].join("\n")
}

/* ------------------------------------------------------------------ *
 * references/props.md
 * ------------------------------------------------------------------ */

function propsReference() {
  const out = [
    "# Props, generated from the source types",
    "",
    "Every prop below is extracted from the interfaces the components actually",
    "declare. **If a prop is not on this page, it does not exist** — do not use it.",
    "",
    "Regenerate with `node scripts/build-skills.mjs`.",
    "",
    "---",
    "",
    "## Shared by all eleven components",
    "",
    table(PROPS.shared),
    "---",
    "",
  ]

  for (const [slug, data] of Object.entries(PROPS.components)) {
    const [t, form, example] = CANONICAL[slug] ?? ["unknown", "", ""]
    const constraints = data.own.filter((p) => p.kind === "constraint")
    const options = data.own.filter((p) => p.kind !== "constraint")

    out.push(
      `## ${data.display}`,
      "",
      `- **Package** \`${data.package}\` · **Registry** \`${slug}\` · **Spec type** \`${SPEC_TYPE[slug]}\``,
      `- **Emits** \`${t}\` — ${form}, e.g. \`${example}\``,
      `- **Install** \`npx shadcn@latest add ${SITE}/r/${slug}.json\``,
      "",
      "### Constraints (validation, declared as props)",
      "",
      table(constraints),
      "### Other props",
      "",
      table(options),
    )

    if (data.schemaOptions?.length) {
      out.push(
        "### Zod companion",
        "",
        `\`import { ... } from "${data.package}/schema"\` accepts:`,
        "",
        data.schemaOptions.map((o) => `\`${o}\``).join(", "),
        "",
        "Note this set is **not** the same as the constraint props above. A",
        "constraint missing here is enforced by the component only.",
        "",
      )
    }

    out.push("---", "")
  }

  return out.join("\n")
}

/* ------------------------------------------------------------------ *
 * references/form-spec.md
 * ------------------------------------------------------------------ */

function formSpecReference() {
  const types = Object.entries(SPEC_TYPE)
    .map(([slug, type]) => {
      const [t, form] = CANONICAL[slug]
      return `| \`${type}\` | ${PROPS.components[slug].display} | \`${t}\` — ${form} |`
    })
    .join("\n")

  return `# form.inputcn.json

Describe the form; let the generator write it.

A language model is unreliable at nuanced React and very reliable at structured
JSON. This format moves every hard decision — which schema validates which
field, that money is an integer, that a formatting option must reach the schema
too — out of the model and into a deterministic generator.

\`\`\`bash
npx inputcn generate form.inputcn.json
\`\`\`

**Every prop is checked against the real component interfaces.** A prop that
does not exist fails at generate time with a suggestion, rather than becoming
JSX that silently ignores it.

## Shape

\`\`\`jsonc
{
  "$schema": "${SITE}/schema/form.json",
  "name": "VendorOnboarding",        // PascalCase; becomes the component name
  "form": "react-hook-form",         // or "none" for constraint props + FormData
  "submitLabel": "Create vendor",
  "fields": [
    {
      "type": "phone",               // see the table below
      "name": "phone",               // the submitted field name
      "label": "Mobile number",
      "hint": "Optional helper text",
      "mobileOnly": true,            // any real prop of that component
      "countries": ["GB", "US"]
    }
  ]
}
\`\`\`

## Field types

| \`type\` | Component | Emits |
|---|---|---|
${types}

## Rules

- Field props are flat. Do not nest them under \`constraints\` or \`props\`.
- Any prop from \`references/props.md\` is valid, including the shared ones
  (\`required\`, \`disabled\`, \`variant\`, \`size\`).
- \`"form": "react-hook-form"\` generates a Controller-based component with a
  matching Zod schema. \`"none"\` generates constraint props plus a native form
  that works as a Server Action.
- Formatting options such as \`currency\` and \`locale\` are copied into the
  schema automatically. Do not write them twice.

## Commands

\`\`\`bash
npx inputcn init MyForm              # write a starter spec
npx inputcn generate spec.json       # write MyForm.tsx next to the spec
npx inputcn generate spec.json --out src/components
npx inputcn generate spec.json --stdout
npx inputcn types                    # list field types and what each emits
\`\`\`
`
}

/* ------------------------------------------------------------------ */

const FILES = [
  [join(ROOT, "skills", "inputcn", "references", "props.md"), propsReference()],
  [join(ROOT, "skills", "inputcn", "references", "form-spec.md"), formSpecReference()],
]

const check = process.argv.includes("--check")
let stale = 0

for (const [path, content] of FILES) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : null
  const rel = path.slice(ROOT.length + 1).replace(/\\/g, "/")

  if (check) {
    if (current !== content) {
      console.error(`stale: ${rel}`)
      stale++
    }
  } else {
    writeFileSync(path, content, "utf8")
    console.log(`  ${rel}`)
  }
}

if (check) {
  if (stale) {
    console.error(`\n${stale} skill reference(s) out of date. Run: pnpm skills`)
    process.exit(1)
  }
  console.log("Skill references are current.")
}
