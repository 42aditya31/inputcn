import PROPS from "./props.generated.json" with { type: "json" }

/**
 * The form spec.
 *
 * The premise: a language model is unreliable at writing nuanced React and
 * very reliable at emitting structured JSON. So ask it for the description of
 * a form rather than the form, and let a deterministic generator produce the
 * code. The error surface collapses from "dozens of ways to get a form wrong"
 * to "a typo in a field name" — and even that is caught here, because every
 * key is checked against the props the components actually declare.
 */

export interface FieldSpec {
  /** Which component. See FIELD_TYPES. */
  type: FieldType
  /** Form field name. Lands on the hidden canonical input. */
  name: string
  label?: string
  hint?: string
  /** Anything else is a real prop of that component, checked at generate time. */
  [prop: string]: unknown
}

export interface FormSpec {
  $schema?: string
  /** PascalCase component name for the generated file. */
  name: string
  /** How to wire it up. Default "react-hook-form". */
  form?: "react-hook-form" | "none"
  submitLabel?: string
  fields: FieldSpec[]
}

interface Component {
  type: FieldType
  component: string
  pkg: string
  slug: string
  schema: string
  /** The canonical value, for the generated comment. */
  emits: string
  /** number | string | object — decides how a Server Action reads it. */
  tsType: string
  /** Props that exist for formatting only and must be mirrored into the schema. */
  mirror: string[]
}

export type FieldType =
  | "phone" | "currency" | "masked" | "percent" | "card"
  | "duration" | "color" | "cron" | "filesize" | "ip" | "mention"

export const COMPONENTS: Record<FieldType, Component> = {
  phone: { type: "phone", component: "PhoneInput", pkg: "@inputcn/phone", slug: "phone-input", schema: "phoneSchema", emits: "E.164 string", tsType: "string", mirror: [] },
  currency: { type: "currency", component: "CurrencyInput", pkg: "@inputcn/currency", slug: "currency-input", schema: "moneySchema", emits: "integer minor units", tsType: "number", mirror: ["currency", "locale"] },
  masked: { type: "masked", component: "MaskedInput", pkg: "@inputcn/masked", slug: "masked-input", schema: "maskedSchema", emits: "raw string, mask stripped", tsType: "string", mirror: ["mask"] },
  percent: { type: "percent", component: "PercentInput", pkg: "@inputcn/percent", slug: "percent-input", schema: "percentSchema", emits: "fraction", tsType: "number", mirror: [] },
  card: { type: "card", component: "CardInput", pkg: "@inputcn/card", slug: "card-input", schema: "cardSchema", emits: "digits only", tsType: "string", mirror: [] },
  duration: { type: "duration", component: "DurationInput", pkg: "@inputcn/duration", slug: "duration-input", schema: "durationSchema", emits: "seconds", tsType: "number", mirror: [] },
  color: { type: "color", component: "ColorInput", pkg: "@inputcn/color", slug: "color-input", schema: "colorSchema", emits: "hex", tsType: "string", mirror: [] },
  cron: { type: "cron", component: "CronInput", pkg: "@inputcn/cron", slug: "cron-input", schema: "cronSchema", emits: "cron expression", tsType: "string", mirror: [] },
  filesize: { type: "filesize", component: "FileSizeInput", pkg: "@inputcn/filesize", slug: "filesize-input", schema: "fileSizeSchema", emits: "bytes", tsType: "number", mirror: ["binary"] },
  ip: { type: "ip", component: "IpInput", pkg: "@inputcn/ip", slug: "ip-input", schema: "cidrSchema", emits: "address or CIDR", tsType: "string", mirror: [] },
  mention: { type: "mention", component: "MentionInput", pkg: "@inputcn/mention", slug: "mention-input", schema: "mentionSchema", emits: "{ text, ids }", tsType: "object", mirror: [] },
}

export const FIELD_TYPES = Object.keys(COMPONENTS) as FieldType[]

interface GenProp {
  name: string
  optional: boolean
  type: string
  doc: string
  kind?: string
}

const SHARED = new Set((PROPS.shared as GenProp[]).map((p) => p.name))
const OWN = PROPS.components as Record<string, { own: GenProp[]; schemaOptions?: string[] }>

function propsFor(slug: string): Map<string, GenProp> {
  return new Map((OWN[slug]?.own ?? []).map((p) => [p.name, p]))
}

/** Levenshtein, small and sufficient for a "did you mean". */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost)
    }
  }
  return d[a.length]![b.length]!
}

function suggest(word: string, candidates: string[]): string | null {
  let best: string | null = null
  let bestScore = Infinity
  for (const c of candidates) {
    const score = distance(word.toLowerCase(), c.toLowerCase())
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }
  return bestScore <= Math.max(2, Math.floor(word.length / 3)) ? best : null
}

export interface Problem {
  where: string
  message: string
  hint?: string
}

/**
 * Validate a spec against the props the components really declare.
 *
 * This is the whole reason the format is worth having. A model cannot write a
 * spec with an invented prop and have it silently become invented JSX — the
 * generator refuses, and says what the prop should have been.
 */
export function validate(spec: unknown): { spec: FormSpec; problems: Problem[] } {
  const problems: Problem[] = []
  const s = spec as Partial<FormSpec>

  if (!s || typeof s !== "object") {
    return { spec: { name: "Form", fields: [] }, problems: [{ where: "spec", message: "Not an object." }] }
  }

  if (!s.name || typeof s.name !== "string") {
    problems.push({ where: "name", message: "Missing. This becomes the component name.", hint: 'e.g. "VendorOnboarding"' })
  } else if (!/^[A-Z][A-Za-z0-9]*$/.test(s.name)) {
    problems.push({ where: "name", message: `"${s.name}" is not a valid React component name.`, hint: "PascalCase, letters and digits only." })
  }

  if (s.form && s.form !== "react-hook-form" && s.form !== "none") {
    problems.push({ where: "form", message: `Unknown value "${s.form}".`, hint: 'Use "react-hook-form" or "none".' })
  }

  if (!Array.isArray(s.fields) || s.fields.length === 0) {
    problems.push({ where: "fields", message: "At least one field is required." })
    return { spec: { name: s.name ?? "Form", fields: [] }, problems }
  }

  const seen = new Set<string>()

  s.fields.forEach((f, i) => {
    const at = `fields[${i}]`

    if (!f || typeof f !== "object") {
      problems.push({ where: at, message: "Not an object." })
      return
    }

    const comp = COMPONENTS[f.type as FieldType]
    if (!comp) {
      const did = suggest(String(f.type), FIELD_TYPES)
      problems.push({
        where: `${at}.type`,
        message: `Unknown field type "${f.type}".`,
        hint: did ? `Did you mean "${did}"?` : `One of: ${FIELD_TYPES.join(", ")}`,
      })
      return
    }

    if (!f.name || typeof f.name !== "string") {
      problems.push({ where: `${at}.name`, message: "Missing. This is the submitted field name." })
    } else if (seen.has(f.name)) {
      problems.push({ where: `${at}.name`, message: `Duplicate field name "${f.name}".` })
    } else {
      seen.add(f.name)
    }

    const known = propsFor(comp.slug)
    const allowed = [...known.keys(), ...SHARED]

    for (const key of Object.keys(f)) {
      if (key === "type" || key === "name") continue
      if (known.has(key) || SHARED.has(key)) continue

      const did = suggest(key, allowed)
      problems.push({
        where: `${at}.${key}`,
        message: `${comp.component} has no prop "${key}".`,
        hint: did ? `Did you mean "${did}"?` : `See https://input-cn.vercel.app/components/${comp.slug}`,
      })
    }
  })

  return { spec: s as FormSpec, problems }
}

/**
 * The props to pass to the companion Zod schema.
 *
 * Intersected against what the schema really declares, rather than assumed
 * from the component's constraints. Those sets are close but not equal:
 * `CardInput` has `notExpired`, and `cardSchema` does not, because the schema
 * validates a card *number* and the expiry is a separate value with its own
 * schema. Passing it anyway produces code that does not compile.
 *
 * Formatting options are carried across on purpose. Without `currency`, a GBP
 * field reports its cap in dollars, which reads as a bug in the library.
 */
export function constraintsOf(field: FieldSpec): Record<string, unknown> {
  const comp = COMPONENTS[field.type]
  const known = propsFor(comp.slug)
  const accepted = new Set(OWN[comp.slug]?.schemaOptions ?? [])
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(field)) {
    if (key === "type" || key === "name" || key === "label" || key === "hint") continue
    if (!accepted.has(key)) continue

    const meta = known.get(key)
    if (meta?.kind === "constraint" || comp.mirror.includes(key)) out[key] = value
  }
  return out
}
