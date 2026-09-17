import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"

import { expectNoA11yViolations } from "../../../packages/core/test/a11y-setup.js"
import App from "../src/App.js"
import { COMPONENTS } from "../src/content/components.js"
import { FLAT, NAV } from "../src/content/nav.js"
import { GUIDES } from "../src/content/guides.js"

function go(path: string) {
  window.history.pushState(null, "", path)
}

beforeEach(() => {
  go("/")
  delete document.documentElement.dataset["theme"]
})

describe("routing", () => {
  it("renders the landing page at /", () => {
    render(<App />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("input/cn")
    // The hero specimens are live components, not screenshots. Scoped to the
    // hero because the same component also appears in the grid below.
    const hero = document.querySelector(".hero")!
    expect(within(hero as HTMLElement).getByLabelText("Phone number")).toBeInTheDocument()
  })

  it("renders the component index at /components", () => {
    go("/components")
    render(<App />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Eleven inputs")
    for (const c of COMPONENTS) {
      expect(screen.getByText(c.name), `${c.name} missing from the index`).toBeInTheDocument()
    }
  })

  it("renders every component page with its live demo", () => {
    for (const c of COMPONENTS) {
      go(`/components/${c.slug}`)
      const { unmount } = render(<App />)

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(c.name)
      // The demo is the page. If the component throws on mount, this catches it.
      const demo = document.querySelector(".demo")!
      const label = c.demoLabel ?? c.label
      expect(within(demo as HTMLElement).getByLabelText(label, { exact: false })).toBeInTheDocument()

      unmount()
    }
  })

  it("renders every guide page", () => {
    for (const g of GUIDES) {
      go(`/docs/${g.slug}`)
      const { unmount } = render(<App />)
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(g.title)
      // Every block heading is reachable from the table of contents.
      for (const b of g.blocks) {
        expect(document.getElementById(b.id), `#${b.id} missing on ${g.slug}`).not.toBeNull()
      }
      unmount()
    }
  })

  it("/docs lands on the first guide rather than a blank page", () => {
    go("/docs")
    render(<App />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(GUIDES[0]!.title)
  })

  it("shows a 404 for an unknown route", () => {
    go("/docs/nope")
    render(<App />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("No page here")
  })

  it("navigates client-side without a reload", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("link", { name: "All 11 components" }))

    expect(window.location.pathname).toBe("/components")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Eleven inputs")
  })
})

describe("navigation model", () => {
  it("every sidebar link resolves to a real page", () => {
    for (const item of FLAT) {
      go(item.href)
      const { unmount } = render(<App />)
      expect(
        screen.queryByText("No page here."),
        `${item.href} (${item.label}) is a dead link`,
      ).toBeNull()
      unmount()
    }
  })

  it("lists all eleven components and every guide", () => {
    const components = NAV.find((g) => g.group === "Components")
    expect(components?.items).toHaveLength(COMPONENTS.length)
    expect(FLAT).toHaveLength(GUIDES.length + COMPONENTS.length)
  })
})

describe("theme", () => {
  it("switches by writing the attribute the stylesheet keys off", async () => {
    const user = userEvent.setup()
    render(<App />)

    // The inline script in index.html sets this before first paint; in jsdom it
    // never runs, so what is under test here is the hook's own fallback, which
    // must agree with the CSS default of dark.
    expect(document.documentElement.dataset["theme"]).toBeUndefined()

    await user.click(screen.getByRole("button", { name: /switch to light theme/i }))
    expect(document.documentElement.dataset["theme"]).toBe("light")

    await user.click(screen.getByRole("button", { name: /switch to dark theme/i }))
    expect(document.documentElement.dataset["theme"]).toBe("dark")
  })
})

describe("generated props tables", () => {
  it("documents the constraint props that make each component worth using", async () => {
    // A spot check with teeth: these are generated from the source interfaces,
    // so if a prop is renamed and the JSON is not regenerated, this fails.
    const expected: [string, string][] = [
      ["phone-input", "mobileOnly"],
      ["currency-input", "positive"],
      ["card-input", "notExpired"],
      ["ip-input", "maxPrefix"],
      ["mention-input", "maxMentions"],
      ["cron-input", "minInterval"],
    ]

    for (const [slug, prop] of expected) {
      go(`/components/${slug}`)
      const { unmount } = render(<App />)
      expect(screen.getByText(`${prop}?`), `${prop} missing on ${slug}`).toBeInTheDocument()
      unmount()
    }
  })
})

describe("accessibility", () => {
  it("the landing page is axe-clean, landmarks and heading order included", async () => {
    const { container } = render(<App />)
    // Unlike the component suite this IS a page, so the `region` rule that is
    // meaningless for a fragment is meaningful here and stays on.
    await expectNoA11yViolations(container)
  }, 30_000)

  it("a component page is axe-clean", async () => {
    go("/components/phone-input")
    const { container } = render(<App />)
    await expectNoA11yViolations(container)
  }, 30_000)

  it("a guide page is axe-clean", async () => {
    go("/docs/value-semantics")
    const { container } = render(<App />)
    await expectNoA11yViolations(container)
  }, 30_000)
})
