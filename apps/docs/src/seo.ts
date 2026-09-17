import { BLOCKS } from "./content/blocks.js"
import { COMPONENTS } from "./content/components.js"
import { GUIDES } from "./content/guides.js"
import { REPO_URL, SITE_URL } from "./site.js"

/**
 * Per-route metadata.
 *
 * Derived from the same content that renders the page, so a new component or
 * guide gets a title, a description and a sitemap entry without anyone
 * remembering to add one. A hand-maintained list of 27 routes would be missing
 * an entry within a month.
 */

export interface Meta {
  path: string
  title: string
  /** 50–160 characters. Longer is truncated in results; shorter wastes the slot. */
  description: string
  /** Extra keywords for the page, beyond the site-wide set. */
  keywords?: string[]
  /** Overrides the default WebSite / SoftwareApplication structured data. */
  kind?: "home" | "collection" | "component" | "guide"
}

const NAME = "inputcn"
export const TAGLINE = "The inputs shadcn/ui doesn't ship"

/** Site-wide terms. Kept short — keyword stuffing is a penalty, not a boost. */
const BASE_KEYWORDS = [
  "shadcn",
  "shadcn/ui",
  "react input components",
  "react form inputs",
  "tailwind",
  "typescript",
]

const HOME: Meta = {
  path: "/",
  title: `${NAME} — ${TAGLINE}`,
  description:
    "Eleven React input components shadcn/ui doesn't ship: phone, currency, credit card, duration, cron, colour, file size, IP, percent, mask and mentions. Caret-safe, canonical values, validation from props.",
  keywords: [
    "react phone input",
    "react currency input",
    "react masked input",
    "shadcn phone input",
    "shadcn currency input",
  ],
  kind: "home",
}

const COMPONENTS_INDEX: Meta = {
  path: "/components",
  title: `All 11 components — ${NAME}`,
  description:
    "Every inputcn component with a live demo: PhoneInput, CurrencyInput, MaskedInput, PercentInput, CardInput, DurationInput, ColorInput, CronInput, FileSizeInput, IpInput and MentionInput.",
  keywords: ["shadcn ui components", "react input library"],
  kind: "collection",
}

/**
 * Titles are budgeted, not hoped for.
 *
 * Google truncates around 60 characters and hard-stops near 70. A tagline long
 * enough to overflow gets clipped at a word boundary rather than mid-word, so
 * adding a component with a wordy tagline cannot quietly produce a title that
 * renders as "CurrencyInput — Register-style entry. Integer minor un…".
 */
const TITLE_BUDGET = 70

/**
 * Short, search-facing summaries for the title tag.
 *
 * The card taglines are written to be read next to a live demo and several are
 * too long for a title, where auto-truncation produces things like
 * "CardInput — Brand detection, Luhn, and grouping that". These lead with the
 * words someone would actually type into a search box.
 */
const TITLE_SUMMARY: Record<string, string> = {
  "phone-input": "React phone input with country selector",
  "currency-input": "React currency input, integer minor units",
  "masked-input": "React masked input with caret preservation",
  "percent-input": "React percentage input",
  "card-input": "React credit card input with Luhn",
  "duration-input": "React duration input",
  "color-input": "React colour input with WCAG contrast",
  "cron-input": "React cron input in plain English",
  "filesize-input": "React file size input in bytes",
  "ip-input": "React IP and CIDR input",
  "mention-input": "React @-mention input",
}

function componentTitle(slug: string, name: string, tagline: string): string {
  const suffix = ` | ${NAME}`
  const room = TITLE_BUDGET - name.length - 3 - suffix.length
  let lead = TITLE_SUMMARY[slug] ?? tagline.replace(/\.$/, "")

  // A summary that still does not fit is clipped at a word boundary rather
  // than mid-word. The test asserts the budget, so this is the safety net.
  if (lead.length > room) {
    lead = lead.slice(0, room)
    const cut = lead.lastIndexOf(" ")
    lead = (cut > 20 ? lead.slice(0, cut) : lead).replace(/[\s.,—-]+$/, "")
  }

  return `${name} — ${lead}${suffix}`
}

/**
 * Component pages carry the highest search intent on the site — someone typing
 * "react phone input shadcn" wants exactly one page. The description leads with
 * what the component emits, because that is the question they are trying to
 * answer before they click.
 */
function componentMeta(): Meta[] {
  return COMPONENTS.map((c) => ({
    path: `/components/${c.slug}`,
    title: componentTitle(c.slug, c.name, c.tagline),
    description: `${c.tagline} Emits ${c.t} (${c.example}). Live demo, generated props table, react-hook-form and Zod examples, and a Server Action example. Copy the source with one shadcn command.`,
    keywords: [
      `react ${c.slug.replace("-input", "")} input`,
      `shadcn ${c.slug.replace("-input", "")} input`,
      c.name.toLowerCase(),
    ],
    kind: "component",
  }))
}

function guideMeta(): Meta[] {
  return GUIDES.map((g) => ({
    path: `/docs/${g.slug}`,
    title: `${g.title} — ${NAME} docs`,
    description: describeGuide(g.slug, g.title),
    kind: "guide" as const,
  }))
}

/**
 * Guide descriptions are written rather than derived, because the lede is JSX
 * and a stripped-tags version of it reads like a fragment. A bad meta
 * description is worse than a generic one — it is the only copy a searcher
 * reads before deciding.
 */
const GUIDE_DESCRIPTIONS: Record<string, string> = {
  introduction:
    "What inputcn is, why the hard inputs are hard, and exactly what is built today — including what is not. Eleven components, 498 tests, one canonical-value contract.",
  installation:
    "Install inputcn with one shadcn command. The component source is copied into your repo; only @inputcn/core stays a dependency. No config file, no provider, no Tailwind plugin.",
  "value-semantics":
    "Every inputcn component emits a canonical value, never the display string: E.164 for phone, integer minor units for money, seconds for duration. The full table, and why the caret is a count rather than an offset.",
  theming:
    "Four variants, three sizes, zero hardcoded colours. inputcn reads the shadcn CSS variables your app already defines, so light and dark mode come for free with no dark prop.",
  "props-contract":
    "The 23 props every inputcn component implements identically — value, onChange, onBlur, name, ref, showError and the rest — and why onBlur must be subtree-aware for react-hook-form.",
  "ref-forwarding":
    "Why shouldFocusError silently fails on composite fields, and how inputcn forwards its ref to the primary input with useImperativeHandle so focus lands on a real control.",
  "server-actions":
    "Use inputcn with Next.js Server Actions and no client component. A hidden input carries the canonical value, so FormData.get returns E.164 rather than the formatted string.",
  "zod-companions":
    "A matching Zod schema per component, exported from a separate entry point so Zod never enters your component bundle. Parity-tested, so the resolver and the field cannot disagree.",
  "two-modes":
    "inputcn validates itself standalone and goes silent inside react-hook-form. The mode is detected from aria-invalid, aria-describedby or a form context — never configured.",
  "constraint-props":
    "Validation declared as props: mobileOnly, positive, notExpired, multipleOf, minInterval, minContrast, maxPrefix, maxMentions. No schema needed, and every error carries a data-rule for your tests.",
  "error-timing":
    "Errors stay silent until the first blur, then clear live the moment the value is valid. Why that timing matters, and why validity is derived during render rather than stored in state.",
  "smart-paste":
    "Paste a phone number with a country code, a currency string from an invoice, or a whole log line. inputcn normalises it, strips zero-width and non-breaking spaces, and announces any side effect.",
  "dev-warnings":
    "Development-only warnings that catch the mistakes people actually make — value with defaultValue, a constraint that can never pass, a missing name inside a form. Stripped in production.",
  testing:
    "@inputcn/testing drives a formatted field the way a user would. Eleven fill helpers, rule-based assertions that survive a copy rewrite, and three render modes.",
  accessibility:
    "What was tested and what was not. 50 axe-core checks in CI, the four real ARIA bugs they caught, and an honest statement that screen readers have not been verified yet.",
}

function describeGuide(slug: string, title: string): string {
  return (
    GUIDE_DESCRIPTIONS[slug] ??
    `${title} — documentation for inputcn, the React input components shadcn/ui doesn't ship.`
  )
}

const BLOCKS_INDEX: Meta = {
  path: "/blocks",
  title: `Form blocks — complete React forms | ${NAME}`,
  description:
    "Six complete, working React forms built with inputcn: checkout, vendor onboarding, job schedule, rate card, firewall rule and brand settings. Live on the page, with the source and a ready-made prompt.",
  keywords: ["react form examples", "shadcn form blocks", "react checkout form"],
  kind: "collection",
}

/**
 * Block pages chase a different search than component pages. Nobody searches
 * for "react phone input" when what they want is a checkout form, and the
 * whole-form queries are less contested than the component ones.
 */
function blockMeta(): Meta[] {
  return BLOCKS.map((b) => ({
    path: `/blocks/${b.slug}`,
    title: `${b.name} form — React + ${b.wiring === "No form library" ? "no form library" : "Zod"} | ${NAME}`,
    description: `${b.tagline} A complete, working React ${b.name.toLowerCase()} form using ${b.uses.length} inputcn components. Live demo, full source, and a one-click prompt for your coding agent.`,
    keywords: [
      `react ${b.name.toLowerCase()} form`,
      `${b.name.toLowerCase()} form example`,
      "react form template",
    ],
    kind: "component" as const,
  }))
}

/** Every indexable route, in sitemap order. */
export const ROUTES: Meta[] = [
  HOME,
  COMPONENTS_INDEX,
  ...componentMeta(),
  BLOCKS_INDEX,
  ...blockMeta(),
  ...guideMeta(),
]

const BY_PATH = new Map(ROUTES.map((r) => [r.path, r]))

const NOT_FOUND: Meta = {
  path: "/404",
  title: `Page not found — ${NAME}`,
  description: "That page does not exist. Browse the component library or the documentation.",
}

export function metaFor(path: string): Meta {
  // /docs has no page of its own; it renders the first guide.
  if (path === "/docs") {
    const first = BY_PATH.get(`/docs/${GUIDES[0]!.slug}`)
    if (first) return { ...first, path: "/docs" }
  }
  return BY_PATH.get(path) ?? NOT_FOUND
}

export function keywordsFor(meta: Meta): string {
  return [...(meta.keywords ?? []), ...BASE_KEYWORDS].join(", ")
}

export function canonicalFor(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`
}

/**
 * Structured data.
 *
 * SoftwareApplication on the home page so the library can surface as a
 * software result; TechArticle on docs pages; BreadcrumbList everywhere below
 * the root so the SERP shows the path rather than a bare URL.
 */
export function jsonLdFor(meta: Meta): object[] {
  const url = canonicalFor(meta.path)
  const out: object[] = []

  if (meta.kind === "home") {
    out.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: NAME,
      description: meta.description,
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      softwareVersion: "0.1.1",
      license: "https://opensource.org/licenses/MIT",
      codeRepository: REPO_URL,
      programmingLanguage: "TypeScript",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    })
    out.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: NAME,
      url: SITE_URL,
      description: meta.description,
    })
  } else {
    out.push({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: meta.title,
      description: meta.description,
      url,
      isPartOf: { "@type": "WebSite", name: NAME, url: SITE_URL },
      author: { "@type": "Organization", name: NAME, url: SITE_URL },
      license: "https://opensource.org/licenses/MIT",
    })

    const segments = meta.path.split("/").filter(Boolean)
    out.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        ...segments.map((seg, i) => ({
          "@type": "ListItem",
          position: i + 2,
          name: seg.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
          item: `${SITE_URL}/${segments.slice(0, i + 1).join("/")}`,
        })),
      ],
    })
  }

  return out
}
