#!/usr/bin/env node
/**
 * Generate the JSON Schema for form.inputcn.json.
 *
 * Served at /schema/form.json so an editor autocompletes the spec and flags a
 * bad prop before the generator ever runs. Built from the same extracted
 * interfaces, so the editor, the CLI and the MCP server all agree about what
 * exists.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PROPS = JSON.parse(
  readFileSync(join(ROOT, "packages", "cli", "src", "props.generated.json"), "utf8"),
)
const SITE = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8")).siteUrl
const OUT = join(ROOT, "public", "schema", "form.json")

const TYPES = {
  phone: "phone-input",
  currency: "currency-input",
  masked: "masked-input",
  percent: "percent-input",
  card: "card-input",
  duration: "duration-input",
  color: "color-input",
  cron: "cron-input",
  filesize: "filesize-input",
  ip: "ip-input",
  mention: "mention-input",
}

/** Map a TypeScript type string onto something JSON Schema understands. */
function jsonType(ts) {
  const t = ts.replace(/\s+/g, " ").trim()
  if (/^boolean$/.test(t)) return { type: "boolean" }
  if (/^number$/.test(t)) return { type: "number" }
  if (/^string$/.test(t)) return { type: "string" }
  if (/^readonly string\[\]$|^string\[\]$/.test(t)) return { type: "array", items: { type: "string" } }
  if (/^boolean \| string$/.test(t)) return { type: ["boolean", "string"] }
  if (/^number \| string$/.test(t) || /Bound$/.test(t)) return { type: ["number", "string"] }
  // A union of string literals becomes an enum, which is what makes the
  // editor useful for variant, size, layout and friends.
  const literals = t.match(/^"[^"]+"(?:\s*\|\s*"[^"]+")+$/)
  if (literals) return { enum: t.split("|").map((s) => s.trim().replace(/"/g, "")) }
  return {}
}

/** Props an agent should never put in a spec — they are runtime wiring. */
const EXCLUDE = new Set([
  "value", "defaultValue", "onChange", "onBlur", "validate", "messages",
  "onValidityChange", "id", "className", "autoFocus", "mode",
  "aria-label", "aria-labelledby", "aria-describedby", "aria-invalid",
])

const shared = PROPS.shared.filter((p) => !EXCLUDE.has(p.name))

const fieldVariants = Object.entries(TYPES).map(([type, slug]) => {
  const data = PROPS.components[slug]
  const own = data.own.filter((p) => !EXCLUDE.has(p.name))

  const properties = {
    type: { const: type },
    name: { type: "string", description: "The submitted field name." },
  }

  for (const p of [...own, ...shared]) {
    properties[p.name] = { ...jsonType(p.type), description: p.doc || undefined }
  }

  return {
    title: data.display,
    description: `${data.display} — ${data.package}`,
    type: "object",
    required: ["type", "name"],
    // The point of the whole file: anything not listed is rejected by the
    // editor before the generator is ever run.
    additionalProperties: false,
    properties,
  }
})

const schema = {
  $schema: "https://json-schema.org/draft-07/schema#",
  $id: `${SITE}/schema/form.json`,
  title: "inputcn form spec",
  description:
    "Describe a form; generate it with `npx inputcn generate`. Every prop is checked against the real component interfaces.",
  type: "object",
  required: ["name", "fields"],
  additionalProperties: false,
  properties: {
    $schema: { type: "string" },
    name: {
      type: "string",
      pattern: "^[A-Z][A-Za-z0-9]*$",
      description: "PascalCase. Becomes the generated component name.",
    },
    form: {
      enum: ["react-hook-form", "none"],
      default: "react-hook-form",
      description:
        '"react-hook-form" generates a Controller-based component with a Zod schema. "none" generates constraint props and a native form that works as a Server Action.',
    },
    submitLabel: { type: "string", default: "Submit" },
    fields: {
      type: "array",
      minItems: 1,
      items: { oneOf: fieldVariants },
    },
  },
}

const json = JSON.stringify(schema, null, 2) + "\n"

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : null
  if (current !== json) {
    console.error("public/schema/form.json is stale. Run: pnpm schema")
    process.exit(1)
  }
  console.log("form.json is current.")
} else {
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, json, "utf8")
  console.log(`public/schema/form.json — ${fieldVariants.length} field types`)
}
