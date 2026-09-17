import { describe, expect, it } from "vitest"

import { COMPONENTS } from "../src/content/components.js"
import {
  buildPrompt,
  claudeCodeLink,
  CLAUDE_LIMIT,
  cursorLink,
  type Integration,
} from "../src/prompt.js"

const WIRINGS: Integration[] = ["rhf", "action", "standalone"]

/**
 * The failure mode this guards against is silent: a prompt grows past the deep
 * link's character limit and the button simply stops working, on one component,
 * with one option selected. Nobody notices until someone clicks it.
 */
describe("prompt length", () => {
  it("every component and wiring fits inside the Claude Code limit", () => {
    for (const c of COMPONENTS) {
      for (const integration of WIRINGS) {
        for (const withTests of [false, true]) {
          const prompt = buildPrompt(c, { integration, withTests })
          const encoded = claudeCodeLink(prompt).length

          expect(
            prompt.length,
            `${c.name} / ${integration}${withTests ? " + tests" : ""} is ${prompt.length} chars`,
          ).toBeLessThanOrEqual(CLAUDE_LIMIT)

          // The URL itself is what the OS has to carry, and encoding a prompt
          // roughly doubles it. Windows historically chokes past ~32k.
          expect(encoded).toBeLessThan(30_000)
        }
      }
    }
  })

  it("says something substantial rather than a stub", () => {
    for (const c of COMPONENTS) {
      const prompt = buildPrompt(c, { integration: "rhf", withTests: false })
      expect(prompt.length, `${c.name}`).toBeGreaterThan(500)
    }
  })
})

describe("prompt content", () => {
  it("always names the canonical value, which is the point of the whole thing", () => {
    for (const c of COMPONENTS) {
      const prompt = buildPrompt(c, { integration: "rhf", withTests: false })
      expect(prompt, c.name).toContain("onChange emits the canonical value")
      expect(prompt, c.name).toContain(c.name)
    }
  })

  it("carries the real install command", () => {
    for (const c of COMPONENTS) {
      const prompt = buildPrompt(c, { integration: "standalone", withTests: false })
      expect(prompt).toContain(`/r/${c.slug}.json`)
    }
  })

  it("only mentions a schema when the wiring actually uses one", () => {
    const c = COMPONENTS[0]!
    expect(buildPrompt(c, { integration: "rhf", withTests: false })).toContain(c.schema)
    // Standalone mode is the "no schema, no resolver" claim. If the prompt
    // hands the agent a schema anyway, it will add one, and the claim is dead.
    expect(buildPrompt(c, { integration: "standalone", withTests: false })).not.toContain(
      c.schema,
    )
  })

  it("tells the agent not to invent props", () => {
    for (const c of COMPONENTS) {
      const prompt = buildPrompt(c, { integration: "rhf", withTests: false })
      expect(prompt, c.name).toMatch(/Do not invent props/)
    }
  })

  it("warns about the currency trap on the money field", () => {
    const currency = COMPONENTS.find((c) => c.slug === "currency-input")!
    const prompt = buildPrompt(currency, { integration: "rhf", withTests: false })
    expect(prompt).toContain("MINOR units")
    expect(prompt).toMatch(/currency.*and.*locale.*to the schema/i)
  })

  it("adds the testing helpers only when asked", () => {
    const c = COMPONENTS[0]!
    expect(buildPrompt(c, { integration: "rhf", withTests: true })).toContain(
      "@inputcn/testing",
    )
    expect(buildPrompt(c, { integration: "rhf", withTests: false })).not.toContain(
      "@inputcn/testing",
    )
  })
})

describe("deep links", () => {
  it("builds a claude-cli URL that survives round-tripping", () => {
    const c = COMPONENTS[0]!
    const prompt = buildPrompt(c, { integration: "rhf", withTests: false })
    const url = claudeCodeLink(prompt)

    expect(url.startsWith("claude-cli://open?q=")).toBe(true)
    expect(decodeURIComponent(url.slice("claude-cli://open?q=".length))).toBe(prompt)
  })

  it("encodes characters that would otherwise break the URL", () => {
    const url = claudeCodeLink('a & b ? c # d "e" \n f')
    expect(url).not.toMatch(/[ "#]/)
    expect(url).not.toContain("&b")
    expect(url).toContain("%0A") // newlines survive as escapes
  })

  it("uses the Cursor https fallback, which works without Cursor installed", () => {
    const url = cursorLink("hello world")
    expect(url.startsWith("https://cursor.com/link/prompt?text=")).toBe(true)
  })
})
