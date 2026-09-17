/**
 * Development-only warnings. PRD §11.3.
 *
 * Rules:
 *   - every warning names the component, states the problem, SHOWS THE FIX,
 *     and links to the doc anchor
 *   - fires once per component instance, never per render
 *   - the whole module is dead code in production
 */

const DEV = process.env.NODE_ENV !== "production"
// Rewritten by `pnpm site-url <url>`. This is a published package, so it
// cannot read the repo's site.config.json at runtime — the URL is baked in.
const DOCS = "https://input-cn.vercel.app/docs"

/** Per-instance seen set, so a warning never repeats on re-render. */
export type WarnScope = Set<string>

export function createWarnScope(): WarnScope {
  return DEV ? new Set<string>() : (EMPTY_SCOPE as WarnScope)
}

// In production every scope is the same frozen empty set — zero allocation.
const EMPTY_SCOPE: ReadonlySet<string> = new Set<string>()

interface WarnArgs {
  scope: WarnScope
  component: string
  /** Stable key for once-per-instance de-duplication. */
  key: string
  problem: string
  fix?: string
  /** Doc anchor, e.g. `"currency#value"`. */
  doc?: string
}

export function warn({ scope, component, key, problem, fix, doc }: WarnArgs): void {
  if (!DEV) return
  if (scope.has(key)) return
  scope.add(key)

  let msg = `[inputcn] ${component}: ${problem}`
  if (fix) msg += `\n          ${fix}`
  if (doc) msg += `\n          → ${DOCS}/${doc}`

  // eslint-disable-next-line no-console
  console.warn(msg)
}

/* ------------------------------------------------------------------ *
 * The specific mistakes people actually make.
 * ------------------------------------------------------------------ */

export function warnControlledSwitch(
  scope: WarnScope,
  component: string,
  hadValue: boolean,
  hasValue: boolean,
): void {
  if (!DEV || hadValue === hasValue) return
  warn({
    scope,
    component,
    key: "controlled-switch",
    problem: hasValue
      ? "changed from uncontrolled to controlled."
      : "changed from controlled to uncontrolled.",
    fix: "Keep `value` defined for the component's whole lifetime, or use `defaultValue` throughout.",
    doc: "controlled",
  })
}

export function warnBothValueProps(scope: WarnScope, component: string): void {
  warn({
    scope,
    component,
    key: "both-value-props",
    problem: "received both `value` and `defaultValue`.",
    fix: "Pick one: `value` for controlled, `defaultValue` for uncontrolled. `defaultValue` is ignored.",
    doc: "controlled",
  })
}

export function warnWrongValueType(
  scope: WarnScope,
  component: string,
  expected: string,
  got: unknown,
  hint?: string,
): void {
  warn({
    scope,
    component,
    key: `wrong-type:${expected}`,
    problem: `\`value\` expects ${expected} but received ${describe(got)}.`,
    fix: hint,
    doc: `${component.replace(/Input$/, "").toLowerCase()}#value`,
  })
}

export function warnIgnoredInManagedMode(
  scope: WarnScope,
  component: string,
  props: readonly string[],
): void {
  if (!DEV || props.length === 0) return
  warn({
    scope,
    component,
    key: `managed-ignored:${props.join(",")}`,
    problem: `is inside a form context but also received ${props.map((p) => `\`${p}\``).join(", ")}.`,
    fix: "In managed mode the form owns validation and error rendering, so these are ignored. Move the rule into your schema.",
    doc: "validation#modes",
  })
}

export function warnMissingLabel(scope: WarnScope, component: string): void {
  warn({
    scope,
    component,
    key: "missing-label",
    problem: "has no accessible name.",
    fix: "Add `aria-label`, `aria-labelledby`, or associate a <label> with the input's `id`.",
    doc: "accessibility#labelling",
  })
}

function describe(v: unknown): string {
  if (v === null) return "null"
  if (Array.isArray(v)) return `an array (${v.length} items)`
  const t = typeof v
  if (t === "string") return `the string ${JSON.stringify(v)}`
  if (t === "number") return `the number ${v}`
  return `a ${t}`
}
