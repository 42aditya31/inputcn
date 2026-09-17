/**
 * Generate the docs props tables from the source types.
 *
 * The alternative is hand-written tables, which are wrong within a month and
 * nobody notices, because nothing fails when they drift. This reads the
 * interfaces the components actually declare, so a renamed prop shows up as a
 * changed file rather than as a lie on a page.
 *
 *   node apps/docs/scripts/extract-props.mjs         # write
 *   node apps/docs/scripts/extract-props.mjs --check # fail if stale
 *
 * It is a text parser, not the TypeScript compiler. That is a deliberate
 * trade: no dependency, and the interfaces it reads are plain member lists.
 * The --check mode in CI is what makes the trade safe.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "../../..")
const OUT = resolve(HERE, "../src/content/props.generated.json")

/** package directory -> the interfaces to read out of it */
const COMPONENTS = [
  ["phone", "phone-input", "PhoneInput"],
  ["currency", "currency-input", "CurrencyInput"],
  ["masked", "masked-input", "MaskedInput"],
  ["percent", "percent-input", "PercentInput"],
  ["card", "card-input", "CardInput"],
  ["duration", "duration-input", "DurationInput"],
  ["color", "color-input", "ColorInput"],
  ["cron", "cron-input", "CronInput"],
  ["filesize", "filesize-input", "FileSizeInput"],
  ["ip", "ip-input", "IpInput"],
  ["mention", "mention-input", "MentionInput"],
]

/** Find `export interface <name>` and return its body, brace-matched. */
function interfaceBody(source, name) {
  const re = new RegExp(`export interface ${name}\\b[^{]*\\{`)
  const m = re.exec(source)
  if (!m) return null

  let depth = 1
  let i = m.index + m[0].length
  const start = i
  while (i < source.length && depth > 0) {
    const ch = source[i]
    if (ch === "{") depth++
    else if (ch === "}") depth--
    i++
  }
  return source.slice(start, i - 1)
}

/**
 * Split an interface body into members, keeping each member's doc comment.
 * Members are separated at brace depth 0, so an inline object type stays whole.
 */
function members(body) {
  const out = []
  const lines = body.split("\n")
  let doc = []
  let buf = ""
  let depth = 0
  let inBlockComment = false

  const flush = () => {
    const text = buf.trim().replace(/[;,]$/, "")
    if (!text) {
      buf = ""
      return
    }
    const m = /^(?:readonly\s+)?(\[?["']?[\w$-]+["']?\]?)(\?)?\s*:\s*(\S[\s\S]*)$/.exec(text)
    if (!m) {
      // Not a complete member yet — a wrapped union or a bare `name?:`. Keep
      // accumulating rather than dropping it.
      return
    }
    buf = ""
    out.push({
      name: m[1].replace(/["']/g, ""),
      optional: m[2] === "?",
      type: m[3].replace(/\s+/g, " ").trim(),
      doc: doc.join(" ").trim(),
    })
    doc = []
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (inBlockComment) {
      if (line.includes("*/")) {
        inBlockComment = false
        const tail = line.slice(0, line.indexOf("*/")).replace(/^\*\s?/, "").trim()
        if (tail) doc.push(tail)
      } else {
        const t = line.replace(/^\*\s?/, "").trim()
        if (t) doc.push(t)
      }
      continue
    }

    if (depth === 0 && line.startsWith("/**")) {
      if (line.includes("*/")) {
        doc.push(line.replace(/^\/\*\*/, "").replace(/\*\/$/, "").trim())
      } else {
        doc.push(line.replace(/^\/\*\*/, "").trim())
        inBlockComment = true
      }
      continue
    }
    if (depth === 0 && (line.startsWith("//") || line.startsWith("/*"))) continue
    if (depth === 0 && line === "") continue

    buf += (buf ? " " : "") + line
    // Only bracket pairs are counted. Angle brackets are not: `=>` and any
    // comparison would unbalance them, and nothing here needs generics to be
    // tracked — a generic argument cannot span a member boundary.
    for (const ch of line) {
      if (ch === "{" || ch === "(" || ch === "[") depth++
      else if (ch === "}" || ch === ")" || ch === "]") depth--
    }
    if (depth < 0) depth = 0
    // Members in this codebase carry no trailing semicolon, so a balanced line
    // that already reads as `name: type` is the end of one. A member whose
    // type continues on the next line (a wrapped union) will not match yet and
    // keeps accumulating.
    if (depth === 0) flush()
  }
  flush()
  return out
}

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null
}

/** The interface names in `extends A, B<C> {` — generics stripped. */
function extendsList(source, name) {
  const re = new RegExp(`export interface ${name}\\b([^{]*)\\{`)
  const m = re.exec(source)
  if (!m) return []
  const clause = m[1]
  const at = clause.indexOf("extends")
  if (at === -1) return []
  return clause
    .slice(at + "extends".length)
    .split(",")
    .map((s) => s.replace(/<[^>]*>/g, "").trim())
    .filter(Boolean)
}

/**
 * Members of an interface plus any locally-declared interface it extends.
 * The constraint props live in a separate `<X>Constraints` interface that the
 * options interface inherits, so without this the validation props — the ones
 * the whole library is about — would be missing from every page.
 */
function membersDeep(source, name, kind, seen = new Set()) {
  if (seen.has(name)) return []
  seen.add(name)

  const body = interfaceBody(source, name)
  if (body === null) return []

  const inherited = []
  for (const parent of extendsList(source, name)) {
    // BaseFieldProps is the shared contract and is listed once, separately.
    if (parent === "BaseFieldProps") continue
    const parentKind = /Constraints$/.test(parent) ? "constraint" : kind
    inherited.push(...membersDeep(source, parent, parentKind, seen))
  }

  return [...inherited, ...members(body).map((p) => ({ ...p, kind }))]
}

function collect() {
  const coreTypes = readFileSync(resolve(ROOT, "packages/core/src/types.ts"), "utf8")
  const shared = members(interfaceBody(coreTypes, "BaseFieldProps") ?? "")

  const components = {}
  for (const [pkg, slug, display] of COMPONENTS) {
    const hookFile =
      read(resolve(ROOT, `packages/${pkg}/src/use-${slug}.ts`)) ??
      read(resolve(ROOT, `packages/${pkg}/src/use-${pkg}-input.ts`))
    const compFile = read(resolve(ROOT, `packages/${pkg}/src/${slug}.tsx`))

    const own = []
    if (hookFile) {
      const optionsName = /export interface (Use\w*Options)/.exec(hookFile)?.[1]
      if (optionsName) own.push(...membersDeep(hookFile, optionsName, "option"))
    }
    if (compFile) {
      const propsName = /export interface (\w*Props)/.exec(compFile)?.[1]
      if (propsName) {
        own.push(...members(interfaceBody(compFile, propsName) ?? "").map((p) => ({
          ...p,
          kind: "presentation",
        })))
      }
    }

    // A component may re-declare a shared prop to narrow it; its own wins.
    const seen = new Set()
    const deduped = own.filter((p) => {
      if (seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })

    components[slug] = { display, package: `@inputcn/${pkg}`, own: deduped }
  }

  return { shared, components }
}

const data = collect()
const json = JSON.stringify(data, null, 2) + "\n"

if (process.argv.includes("--check")) {
  const current = read(OUT)
  if (current !== json) {
    console.error(
      "props.generated.json is stale.\nRun: node apps/docs/scripts/extract-props.mjs",
    )
    process.exit(1)
  }
  console.log("props.generated.json is current.")
} else {
  writeFileSync(OUT, json, "utf8")
  const n = Object.values(data.components).reduce((a, c) => a + c.own.length, 0)
  console.log(
    `props.generated.json: ${data.shared.length} shared props + ${n} component props across ${
      Object.keys(data.components).length
    } components`,
  )
}
