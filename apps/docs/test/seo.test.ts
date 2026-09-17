import { describe, expect, it } from "vitest"

import { COMPONENTS } from "../src/content/components.js"
import { GUIDES } from "../src/content/guides.js"
import { canonicalFor, jsonLdFor, metaFor, ROUTES } from "../src/seo.js"

/**
 * SEO is the kind of thing that is correct on the day it is written and quietly
 * wrong three components later. These assert the properties that actually
 * affect ranking, so adding a page without metadata fails the build.
 */

describe("route coverage", () => {
  it("has an entry for every page the router can reach", () => {
    const paths = new Set(ROUTES.map((r) => r.path))

    expect(paths.has("/")).toBe(true)
    expect(paths.has("/components")).toBe(true)
    for (const c of COMPONENTS) {
      expect(paths.has(`/components/${c.slug}`), `${c.name} has no SEO entry`).toBe(true)
    }
    for (const g of GUIDES) {
      expect(paths.has(`/docs/${g.slug}`), `${g.title} has no SEO entry`).toBe(true)
    }
    expect(ROUTES).toHaveLength(2 + COMPONENTS.length + GUIDES.length)
  })
})

describe("titles and descriptions", () => {
  it("every title is unique", () => {
    // Duplicate titles across pages make Google pick one and drop the rest.
    const titles = ROUTES.map((r) => r.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it("every description is unique", () => {
    const descriptions = ROUTES.map((r) => r.description)
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })

  it("titles fit in a search result", () => {
    for (const r of ROUTES) {
      // Google truncates around 60 characters; a little over is fine, double is not.
      expect(r.title.length, `${r.path} title is ${r.title.length} chars`).toBeLessThanOrEqual(75)
      expect(r.title.length).toBeGreaterThan(10)
    }
  })

  it("descriptions fill the snippet without overflowing it badly", () => {
    for (const r of ROUTES) {
      const n = r.description.length
      expect(n, `${r.path} description is only ${n} chars`).toBeGreaterThanOrEqual(80)
      expect(n, `${r.path} description is ${n} chars`).toBeLessThanOrEqual(260)
    }
  })

  it("names the product in every title", () => {
    for (const r of ROUTES) {
      expect(r.title.toLowerCase(), `${r.path}`).toContain("inputcn")
    }
  })
})

describe("canonical urls", () => {
  it("are absolute and have no trailing slash", () => {
    for (const r of ROUTES) {
      const url = canonicalFor(r.path)
      expect(url.startsWith("https://")).toBe(true)
      expect(url.endsWith("/"), `${url} has a trailing slash`).toBe(false)
    }
  })

  it("resolves /docs to the first guide rather than a dead route", () => {
    expect(metaFor("/docs").title).toBe(metaFor(`/docs/${GUIDES[0]!.slug}`).title)
  })

  it("marks an unknown route noindex", () => {
    expect(metaFor("/nope/nope").path).toBe("/404")
  })
})

describe("structured data", () => {
  it("declares the library as software on the home page", () => {
    const blocks = jsonLdFor(metaFor("/")) as Array<Record<string, unknown>>
    const app = blocks.find((b) => b["@type"] === "SoftwareApplication")
    expect(app).toBeDefined()
    expect(app!["codeRepository"]).toContain("github.com/42aditya31/inputcn")
  })

  it("gives inner pages a breadcrumb trail", () => {
    const blocks = jsonLdFor(metaFor("/components/phone-input")) as Array<
      Record<string, unknown>
    >
    const crumbs = blocks.find((b) => b["@type"] === "BreadcrumbList")
    expect(crumbs).toBeDefined()
    expect((crumbs!["itemListElement"] as unknown[]).length).toBe(3)
  })

  it("emits valid JSON for every route", () => {
    for (const r of ROUTES) {
      expect(() => JSON.parse(JSON.stringify(jsonLdFor(r))), r.path).not.toThrow()
    }
  })
})
