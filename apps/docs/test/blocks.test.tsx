import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"

import App from "../src/App.js"
import { BLOCKS } from "../src/content/blocks.js"
import { BY_SLUG } from "../src/content/components.js"
import { buildBlockPrompt, CLAUDE_LIMIT, claudeCodeLink } from "../src/prompt.js"

function go(path: string) {
  window.history.pushState(null, "", path)
}

beforeEach(() => {
  go("/")
})

describe("the blocks themselves", () => {
  it("every block renders its form", () => {
    for (const b of BLOCKS) {
      go(`/blocks/${b.slug}`)
      const { unmount } = render(<App />)

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(b.name)
      // A block that cannot mount is worse than no block, because people paste
      // it into production.
      expect(document.querySelector(".block-form")).not.toBeNull()

      unmount()
    }
  })

  it("the checkout block submits canonical values, not what is on screen", async () => {
    const user = userEvent.setup()
    go("/blocks/checkout")
    render(<App />)

    const form = document.querySelector(".block-form") as HTMLElement
    const q = within(form)

    await user.type(q.getByLabelText(/card number/i), "4242424242424242")
    await user.type(q.getByLabelText(/expiry/i), "1230")
    await user.type(q.getByLabelText(/security code|cvc/i), "123")
    await user.type(q.getByLabelText("Phone for receipts"), "7911123456")
    await user.type(q.getByLabelText("Add a tip"), "250")

    await user.click(q.getByRole("button", { name: /Pay/ }))

    const out = await waitFor(() => {
      const el = form.querySelector("output.block-out")
      expect(el).not.toBeNull()
      return el!
    })

    const submitted = JSON.parse(out.textContent!)
    expect(submitted).toEqual({
      card: "4242424242424242", // not "4242 4242 4242 4242"
      phone: "+447911123456", // not "07911 123456"
      tip: 250, // integer minor units, not 2.5
    })
  })

  it("the job-schedule block submits through native FormData with no form library", async () => {
    const user = userEvent.setup()
    go("/blocks/job-schedule")
    render(<App />)

    const form = document.querySelector(".block-form") as HTMLElement
    await user.click(within(form).getByRole("button", { name: /Save schedule/ }))

    const out = await waitFor(() => {
      const el = form.querySelector("output.block-out")
      expect(el).not.toBeNull()
      return el!
    })

    const submitted = JSON.parse(out.textContent!)
    // Defaults, carried by the hidden canonical inputs — which is exactly what
    // a Server Action would receive.
    expect(submitted.schedule).toBe("0 9 * * 1-5")
    expect(submitted.timeout).toBe("900")
    expect(submitted.artifactCap).toBe("104857600")
  })

  it("blocks only claim components that exist", () => {
    for (const b of BLOCKS) {
      for (const slug of b.uses) {
        expect(BY_SLUG.get(slug), `${b.name} lists a non-existent ${slug}`).toBeDefined()
      }
    }
  })

  it("between them the blocks exercise every component", () => {
    const used = new Set(BLOCKS.flatMap((b) => b.uses))
    const missing = [...BY_SLUG.keys()].filter((slug) => !used.has(slug))
    // Not a rule for its own sake: a component nobody built a block around is
    // a component with no worked example.
    expect(missing, `no block uses: ${missing.join(", ")}`).toHaveLength(0)
  })
})

describe("the source shown is the source that runs", () => {
  it("every block has real source attached, not a placeholder", () => {
    for (const b of BLOCKS) {
      expect(b.source.length, b.name).toBeGreaterThan(400)
      expect(b.source, b.name).toContain("export function")
      expect(b.source, b.name).toContain(b.demo.name)
    }
  })

  it("the source imports the components the block says it uses", () => {
    for (const b of BLOCKS) {
      for (const slug of b.uses) {
        const name = BY_SLUG.get(slug)!.name
        expect(b.source, `${b.name} claims ${name} but never imports it`).toContain(name)
      }
    }
  })
})

describe("block prompts", () => {
  it("fit inside the Claude Code deep-link limit", () => {
    for (const b of BLOCKS) {
      const prompt = buildBlockPrompt(b)
      expect(prompt.length, `${b.name} prompt is ${prompt.length} chars`).toBeLessThanOrEqual(
        CLAUDE_LIMIT,
      )
      expect(claudeCodeLink(prompt).length).toBeLessThan(30_000)
    }
  })

  it("carry the install commands and the canonical values", () => {
    for (const b of BLOCKS) {
      const prompt = buildBlockPrompt(b)
      for (const slug of b.uses) {
        expect(prompt, b.name).toContain(`/r/${slug}.json`)
      }
      expect(prompt, b.name).toContain("canonical value")
      expect(prompt, b.name).toContain("Do not invent props")
    }
  })

  it("include the working implementation rather than describing it", () => {
    const checkout = BLOCKS.find((b) => b.slug === "checkout")!
    const prompt = buildBlockPrompt(checkout)
    expect(prompt).toContain("```tsx")
    expect(prompt).toContain("cardSchema")
  })
})

describe("routing", () => {
  it("lists every block on the index", () => {
    go("/blocks")
    render(<App />)
    for (const b of BLOCKS) {
      expect(screen.getByText(b.name), `${b.name} missing from the index`).toBeInTheDocument()
    }
  })

  it("404s on an unknown block", () => {
    go("/blocks/nope")
    render(<App />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("No page here")
  })
})
