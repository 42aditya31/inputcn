import type { ReactNode } from "react"

import { BrandSettings } from "../blocks/BrandSettings.js"
import { Checkout } from "../blocks/Checkout.js"
import { FirewallRule } from "../blocks/FirewallRule.js"
import { JobSchedule } from "../blocks/JobSchedule.js"
import { RateCard } from "../blocks/RateCard.js"
import { VendorOnboarding } from "../blocks/VendorOnboarding.js"

// The source shown on the page is the source that runs. Vite's ?raw import
// reads the actual file at build time, so a block and its listing cannot
// drift — which is the failure every "copy this snippet" gallery eventually
// has, usually without anyone noticing.
import brandSettingsSrc from "../blocks/BrandSettings.tsx?raw"
import checkoutSrc from "../blocks/Checkout.tsx?raw"
import firewallRuleSrc from "../blocks/FirewallRule.tsx?raw"
import jobScheduleSrc from "../blocks/JobSchedule.tsx?raw"
import rateCardSrc from "../blocks/RateCard.tsx?raw"
import vendorOnboardingSrc from "../blocks/VendorOnboarding.tsx?raw"

export type Wiring = "react-hook-form + Zod" | "No form library"

export interface Block {
  slug: string
  name: string
  tagline: string
  /** Why this one exists, and what it is really demonstrating. */
  about: ReactNode
  wiring: Wiring
  /** Registry item names, in the order they appear in the form. */
  uses: string[]
  /** What the form submits, as a plain description per field. */
  emits: [string, string][]
  demo: () => ReactNode
  source: string
}

export const BLOCKS: Block[] = [
  {
    slug: "checkout",
    name: "Checkout",
    tagline: "Card, receipt phone and a tip, validated by the shipped schemas.",
    wiring: "react-hook-form + Zod",
    uses: ["card-input", "phone-input", "currency-input"],
    about:
      "The form everyone builds and most get wrong in the same two ways: the card number is stored with its spaces, and the tip is a float. Neither is possible here. Note the stepper layout on the tip field — money fields in a checkout are usually adjusted, not typed.",
    emits: [
      ["card", '"4242424242424242" — digits only, no spaces'],
      ["phone", '"+442071234567" — E.164, whatever the user typed'],
      ["tip", "250 — integer minor units, so £2.50"],
    ],
    demo: Checkout,
    source: checkoutSrc,
  },
  {
    slug: "vendor-onboarding",
    name: "Vendor onboarding",
    tagline: "Mobile-only phone, a masked tax ID, a spend cap and an IP allowlist.",
    wiring: "react-hook-form + Zod",
    uses: ["phone-input", "masked-input", "currency-input", "ip-input"],
    about:
      "A back-office form with four different canonical types in it. The spend cap is the one to look at: max is in minor units, and the currency is passed to the schema as well as the component — miss that second one and a GBP field reports its limit in dollars.",
    emits: [
      ["phone", "E.164, and a landline is rejected before submit"],
      ["taxId", '"12345678901" — raw, with the mask stripped'],
      ["budget", "1000000 minor units is the cap, so £10,000.00"],
      ["allowlist", '"10.0.0.0/24" — a /24 or tighter'],
    ],
    demo: VendorOnboarding,
    source: vendorOnboardingSrc,
  },
  {
    slug: "job-schedule",
    name: "Job schedule",
    tagline: "Cron, timeout, artifact cap and who gets paged — no form library.",
    wiring: "No form library",
    uses: ["cron-input", "duration-input", "filesize-input", "mention-input"],
    about:
      "No schema, no resolver, no onBlur handler. Every rule is a prop, and the whole thing submits through native FormData, so it works in a Server Action with no client component. minInterval is the constraint that earns its keep — it is what stops somebody scheduling a job every minute.",
    emits: [
      ["schedule", '"0 9 * * 1-5", with the next runs previewed live'],
      ["timeout", "900 seconds, in 30-second increments"],
      ["artifactCap", "104857600 bytes"],
      ["notify", "the comment text plus the ids actually mentioned in it"],
    ],
    demo: JobSchedule,
    source: jobScheduleSrc,
  },
  {
    slug: "rate-card",
    name: "Rate card",
    tagline: "Three numeric fields, three different canonical types.",
    wiring: "react-hook-form + Zod",
    uses: ["currency-input", "percent-input", "duration-input"],
    about:
      "The clearest demonstration of why the canonical value matters. Three fields that all look like numbers to a user and are three completely different numbers to your database: integer cents, a fraction, and seconds. Get any one of them wrong and the invoice is wrong.",
    emits: [
      ["rate", "12000 — cents, formatted as €120,00 for de-DE"],
      ["discount", "0.1 — a fraction, while the field shows 10"],
      ["minimum", "1800 — seconds, while the field shows 30m"],
    ],
    demo: RateCard,
    source: rateCardSrc,
  },
  {
    slug: "firewall-rule",
    name: "Firewall rule",
    tagline: "Two address fields with real guardrails, plus an expiry.",
    wiring: "No form library",
    uses: ["ip-input", "duration-input", "color-input"],
    about:
      "maxPrefix={16} is the whole point of this one: it is what stops an admin allow-listing 0.0.0.0/0 at two in the morning. The expiry field exists because permanent rules are how allowlists rot, and the colour tag warns on poor contrast rather than blocking it.",
    emits: [
      ["source", '"10.0.0.0/24" — with the host range computed and shown'],
      ["destination", "an address extracted from whatever you paste"],
      ["ttl", "86400 seconds"],
      ["tag", '"#CDF25C", with its contrast ratio checked live'],
    ],
    demo: FirewallRule,
    source: firewallRuleSrc,
  },
  {
    slug: "brand-settings",
    name: "Brand settings",
    tagline: "A colour with a contrast check, an upload cap and a support number.",
    wiring: "No form library",
    uses: ["color-input", "filesize-input", "phone-input", "masked-input"],
    about:
      "A settings page, and a deliberate demonstration of a warning that does not block. Pale yellow on white is unreadable and perfectly legal, so minContrast says so and lets the form submit anyway. Blocking on it would be the wrong call.",
    emits: [
      ["brand", '"#FFF9C4" — with a live WCAG ratio against white'],
      ["uploadCap", "26214400 bytes, with MB as 1000 squared"],
      ["support", "E.164"],
      ["postcode", "the raw postcode, mask stripped"],
    ],
    demo: BrandSettings,
    source: brandSettingsSrc,
  },
]

export const BLOCK_BY_SLUG = new Map(BLOCKS.map((b) => [b.slug, b]))
