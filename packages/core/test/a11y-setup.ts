/**
 * axe-core harness for the component suite.
 *
 * Deliberately a thin wrapper rather than a matcher library: the failure
 * output is the whole point. A bare "expected 0 violations, got 2" tells you
 * nothing; this prints the rule, the impact, the offending markup and the
 * help URL, so the failure is actionable without re-running anything.
 */

import axe, { type AxeResults, type RunOptions, type Result } from "axe-core"

/**
 * Rules switched off, each with a reason.
 *
 * Nothing is disabled because it was inconvenient — every entry here is a
 * property of the test environment, not of the component.
 */
const DISABLED: Record<string, string> = {
  // jsdom has no layout engine, so every colour-contrast check resolves
  // against an unstyled document and reports false positives. Contrast is
  // covered instead by ColorInput's own WCAG maths, which is unit-tested.
  "color-contrast": "jsdom has no layout; contrast is unit-tested separately",
  // Testing Library mounts into a bare <div>, so there is no <main>, <header>
  // or heading structure for a component fragment to sit in. A page-level
  // concern, not a component one.
  region: "components are rendered as fragments, not pages",
}

const OPTIONS: RunOptions = {
  // WCAG 2.2 AA is the target stated in the PRD.
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
  },
  rules: Object.fromEntries(Object.keys(DISABLED).map((id) => [id, { enabled: false }])),
}

function describeViolation(v: Result): string {
  const nodes = v.nodes
    .slice(0, 3)
    .map((n) => `      ${n.html}\n        ${n.failureSummary?.replace(/\n/g, "\n        ")}`)
    .join("\n")
  const more = v.nodes.length > 3 ? `\n      …and ${v.nodes.length - 3} more` : ""
  return (
    `  [${v.impact ?? "unknown"}] ${v.id} — ${v.help}\n` +
    `${nodes}${more}\n` +
    `      ${v.helpUrl}`
  )
}

/**
 * Run axe over a container and throw a readable failure if anything trips.
 *
 * ```ts
 * const { container } = render(<PhoneInput label="Phone" />)
 * await expectNoA11yViolations(container)
 * ```
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results: AxeResults = await axe.run(container, OPTIONS)
  if (results.violations.length === 0) return

  const report = results.violations.map(describeViolation).join("\n\n")
  throw new Error(
    `${results.violations.length} accessibility violation(s):\n\n${report}\n\n` +
      `Rules disabled in this environment: ${Object.entries(DISABLED)
        .map(([id, why]) => `${id} (${why})`)
        .join(", ")}`,
  )
}

/** The rules this harness does not check, so the gap is documented in code. */
export const DISABLED_RULES = DISABLED
