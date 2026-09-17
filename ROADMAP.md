# inputcn — Roadmap

> The inputs shadcn/ui doesn't ship. Phone, currency, cron, duration, card —
> the fields every product needs and every product rebuilds badly.

**Status as of 2026-09-16**

| | |
|---|---|
| Phase | **3 of 5 complete** |
| Packages | 13 built |
| Components | **11 of 12** shipped — one cancelled, see below |
| Tests | **484 passing**, 26 files |
| Source | ~11,000 lines, plus a 1,337-line stylesheet |
| Typecheck | clean |
| Build | all 4 packages, ESM + `.d.ts` |
| Styled | **yes** — `@inputcn/core/styles.css` |
| Installable | **yes** — 12 registry items, 214 kB; needs a host to be reachable |
| Demo | `pnpm dev` → http://localhost:5180 |

**Legend** — `[x]` done and verified · `[ ]` not started · `[~]` partial

---

## Phase 1 · Foundation — ✅ COMPLETE

Everything here is implemented, typechecked, tested and building.

### `@inputcn/core` — the shared engine

- [x] **`caret.ts` — caret-preserving reformat**
  The hardest problem in the library and the PRD's top technical risk. Caret
  position is tracked as *significant characters to the left*, not as a string
  offset, so inserting a separator can never move it. Handles insert, delete,
  mid-string typing and paste.
  → *15 tests, including a full ten-digit typing round-trip.*
- [x] **`mask.ts` — template mask engine**
  `#` digit, `A` letter, `*` alphanumeric, `\` escape. Compiled masks cached at
  module level. `parse(format(x)) === x` holds for every partial input.
  → *13 tests.*
- [x] **`validity.ts` — rule engine**
  Declarative rules evaluated **during render**, never in an effect and never
  stored in state. 18 shared rule builders.
- [x] **`messages.ts` — three-level message resolution**
  instance → provider → built-in. Messages are functions, so they interpolate
  and pluralise. 40+ built-in English messages.
- [x] **`paste.ts` — clipboard hygiene + smart-paste primitives**
  Strips zero-width spaces, non-breaking spaces, smart quotes and en dashes.
  Loose number parsing resolves `1.234,50` vs `1,234.50` **by structure**, not
  by assuming a locale.
- [x] **`use-field.ts` — the hook every component is built on**
  Controlled/uncontrolled, touched tracking, auto-detected standalone vs
  managed mode, `showError` timing, component-level blur, hidden submission
  input, ARIA wiring.
- [x] **`use-masked-value.ts`** — binds a canonical value to a formatted input
  without losing the caret. DOM-uncontrolled on purpose: a controlled
  `value={formatted}` makes React rewrite the node *after* the browser has
  already moved the caret, which is the one-frame jump you see elsewhere.
- [x] **`warn.ts` — dev-mode warnings** (PRD §11.3)
  Names the component, states the problem, shows the fix, links the doc. Fires
  once per instance. Stripped from production builds.
- [x] **`provider.tsx`** — optional context for messages/locale/mode.
  Optional by design: a provider you must remember to mount is one people forget.

### Components

- [x] **`PhoneInput`** — country selector with keyboard nav and search, live
  per-country formatting, E.164 output, trunk-prefix handling, 18 countries,
  `countries` / `mobileOnly` constraints, Zod schema.
  Smart paste extracts from `"Call me at (415) 555-2671 ext 4"`, detects `+44`
  and switches country behind an **undoable** notice.
  → *51 tests.*
- [x] **`CurrencyInput`** — integer minor units, digit-accumulator entry (the
  caret has nowhere to drift because no string is being edited), locale-correct
  formatting, zero-decimal currencies via `Intl` rather than a hardcoded 100,
  6 constraints, 3 layouts (inline / display / stepper), Zod schema.
  → *46 tests, including properties proving `0.1 + 0.2` stays exact.*
- [x] **`MaskedInput`** — generic template masking, 12 presets, emits raw not
  formatted, `complete` / `pattern` / length constraints.
  → *17 tests.*

### Infrastructure

- [x] pnpm workspace, TypeScript strict + `noUncheckedIndexedAccess`
- [x] Vitest + Testing Library + jsdom
- [x] tsup per-module entries — **no barrel files**, so consumers only pay for
      what they import
- [x] `"use client"` correctly applied **only** to modules that use hooks, and
      verified byte-level in the built output

### Bugs found and fixed during Phase 1

Recorded because they are the ones most likely to recur.

1. **Trunk prefix cap ordering** — GB's leading `0` consumed a mask slot, so
   the final digit was silently dropped. Caught by test.
2. **`"use client"` was being stripped** — rollup's treeshake pass removes
   module-level directives, so tsup's banner never reached the output. These
   components would have thrown at build time in the Next.js App Router.
   Fixed by disabling treeshake on client bundles; verified in the artefacts.
3. **DTS build failure** — package tsconfigs mapped `@inputcn/core` outside
   `rootDir`.
4. **A wrong test assertion of mine** (not a code bug) — mask slot-skipping.
   Verified the reasoning before changing the test: letting a character skip
   ahead would make the raw string ambiguous about which slots it fills.
5. **`@inputcn/core` exports map was incomplete** — missing `./types`,
   `./warn` and `./use-latest`, so those deep imports failed to resolve for
   any real consumer. The root `tsconfig` `paths` mapping hid this; only the
   *per-package* typecheck caught it. Both now run in CI for that reason.

---

## Phase 2 · Make it real — ✅ COMPLETE

The three components are now styled, installable and visible.

- [x] **`packages/core/styles/inputcn.css`** — 900-line token-driven stylesheet,
      shipped as `@inputcn/core/styles.css`. Every colour and radius reads a
      shadcn CSS variable; nothing is hardcoded. Covers all 7 states, 4 variants
      and 3 sizes, plus `prefers-reduced-motion` and `forced-colors`.
      **Plain CSS, not Tailwind utilities** — a consumer's Tailwind `content`
      globs do not scan `node_modules`, so utility classes shipped in a package
      render silently unstyled. This also works in non-Tailwind projects.
- [x] **`variant` + `size` props** — added to `BaseFieldProps`, emitted as
      `data-variant` / `data-size` on the field root, flowing through all three
      components. Omitted at their defaults to keep the DOM clean.
      → *13 tests, because if these stopped reaching the DOM every variant
      would silently render as default and nothing would fail loudly.*
- [x] **`@inputcn/masked/schema`** — closes the Phase 1 inconsistency; all
      three packages now expose a `./schema` entry point.
- [x] **Schema parity tests** (REQ-V) — a shared fixture table asserted against
      **both** the constraint props and the Zod schema, so changing one without
      the other fails in CI rather than in a user's production form.
      → *6 tests.*
- [x] **shadcn registry** — `scripts/build-registry.mjs` generates
      `registry.json` + `public/r/*.json` **from source**, so it cannot drift.
      Verified: every relative import resolves to a shipped file, every package
      import is a declared dependency, no `.js` extensions leak.
- [x] **`public/llms.txt`** — agent-readable summary, install commands, the
      props contract, and the deliberate exclusions.
- [x] **Demo harness** — `apps/demo`, a Vite app aliased to package **source**
      so editing the library hot-reloads. Live controls for variant, size,
      `--primary`, `--radius` and dark mode, plus a native form that shows the
      real `FormData` payload.
- [x] **README** — install, why, validation, theming, honest status.

### Distribution model

The registry copies the **component** source into the user's project — that is
the code they will want to restyle — while `@inputcn/core` stays an npm
dependency, because nobody wants to fork a caret engine and bug fixes there
should arrive via `npm update`. This is the same hybrid shadcn itself uses with
Radix.

### Still outstanding from Phase 2

- [ ] **MCP support** — deferred with the docs site; `shadcn mcp init` needs a
      hosted registry to point at.
- [ ] **A launch GIF** — flagged in the README. Cannot be recorded here.

---

## Phase 3 · Breadth — ✅ COMPLETE

Eight components shipped, one cancelled. Each has constraint props, a Zod
schema, smart paste and tests.

- [x] **`PercentInput`** — displays `12.5`, emits `0.125`. `precision` blocks
      the 0.333333 that breaks invoice totals. *11 tests.*
- [x] **`CardInput`** — brand detection reflows the grouping live (Amex is
      4-6-5), Luhn, `brands`, `notExpired`, focus advances number → expiry →
      CVC. *40 tests.*
- [x] **`DurationInput`** — `90m`, `1:30` and `1.5h` all give 5400. Bounds
      accept human text (`min="5m"`). Text, segmented and preset layouts.
      *33 tests.*
- [x] **`ColorInput`** — hex/rgb/hsl, swatches, and live WCAG contrast.
      `contrastAgainst` + `minContrast` **warn rather than block**, because a
      brand colour failing AA is a decision to reconsider, not input to
      refuse. *37 tests.*
- [x] **`CronInput`** — plain-English preview, next-run times, visual builder
      that round-trips with the expression, and `minInterval` to stop a job
      being scheduled every second. Errors name the field: *"The hour field
      accepts 0-23"*. *34 tests.*
- [x] **`FileSizeInput`** — keeps `MB` (1000²) and `MiB` (1024²) distinct
      rather than silently converting. *26 tests.*
- [x] **`IpInput`** — CIDR range computation, RFC 3021 handling for /31 and
      /32, address classification, and `minPrefix` to stop someone
      allow-listing `0.0.0.0/0`. *28 tests.*
- [x] **`MentionInput`** — `@`-triggered picker with combobox semantics. Ids
      are recomputed on every edit, so deleting a mention removes the
      notification with it. *33 tests.*
- [x] **Harness** — all 11 components, every layout, and a native form.
- [x] **Registry** — 12 items, generated from source.

### `TagsInput` — cancelled, deliberately

The Phase 1 gate said build it *only if* [emblor](https://github.com/JaleelB/emblor)
(1,213★) had stalled. Checked on 2026-09-17: last push **2026-08-18**, one
month ago, still active. So it is not built. Phase 3 delivered **8 components,
not 9** — a decision against my own earlier plan, recorded rather than quietly
dropped.

### Bugs found during Phase 3

Testing caught these; reading the code had not.

1. **Stale brand in CardInput** — derived from props, so in uncontrolled mode
   it froze at the initial value and never updated while typing.
2. **Focus advanced on max length** — Visa accepts 16, 18 *and* 19 digits, so
   a 16-digit Visa never advanced. Now advances on valid-length **and** Luhn.
3. **`multipleOf` spoke the wrong language** — `multipleOf="15m"` produced
   *"a multiple of 900"*. The core builder took no formatter, unlike min/max.
4. **`use-masked-input.ts` shipped without `"use client"`** — it was in the
   server entry list. A React Server Component importing it would have thrown.
5. **`toLocaleString()` leaked the host locale** — the byte readout rendered
   as `2,50,00,000` on an en-IN machine. Now takes an explicit locale.
6. **Colour validation never fired** — unparseable text left the value empty,
   which skips all non-required rules, so no error ever showed.
7. **Module-level mutable state in cron** — the captured field error was
   shared across instances and would leak between SSR requests.
8. **Mention handle boundaries** — `@grace.` did not resolve, because `.` is
   legal inside a handle (`first.last`).

---

## Phase 4 · Credibility — ◧ IN PROGRESS

- [x] **`@inputcn/testing`** — shipped. 11 `fill*` helpers, `pasteInto`,
      `leaveField`, `expectValue`, `expectInvalid(field, rule)`,
      `expectWarning`, `expectFormData`, and `renderField` / `renderInForm` /
      `renderManaged`. *31 tests, each proving a helper drives its component
      to the correct canonical value (REQ-L self-testing).*
      - Components now emit `data-rule` on the error element, so a test can
        assert **which rule failed** rather than matching copy. A test written
        against a message breaks on a rewrite or a locale change and then gets
        deleted rather than fixed; asserting the rule survives both.
      - Assertion failures name both the display and canonical value, because
        confusing the two is the mistake people actually make.
      - Bug found while writing its own tests: `leaveField` assumed focus was
        already inside the field. Called on an untouched field it fired no
        blur at all, so validation silently never ran — which reads as "the
        component is broken". It now focuses first.
- [~] **Accessibility audit** — automated layer complete, screen readers
      outstanding. Published at [ACCESSIBILITY.md](./ACCESSIBILITY.md).
      - [x] axe-core 4.13 in CI — 11 components × 5 states (default, disabled,
            erroring, picker open, every structural layout)
      - [x] Labelling asserted structurally on every component
      - [x] Keyboard map verified by 9 tests — every interactive element
      - [x] Error announcement: `aria-describedby` + `role="alert"`, and
            asserted **silent** before first blur
      - [x] `prefers-reduced-motion` and `forced-colors` in the stylesheet
      - [ ] **NVDA / VoiceOver — not done.** Needs a human; there is no
            automated substitute. The largest remaining gap in the project.
      - [ ] Contrast check in a real browser (axe's rule is unusable in jsdom)

      **Four real ARIA bugs found, all in shipped code that had passed the
      component suite:** `role="combobox"` on a `<textarea>` (invalid per ARIA
      1.2); `role="dialog"` with no name on the country popover (wrong role
      entirely); two unnamed listboxes; and `<li>` wrappers breaking the
      listbox→option relationship, so screen readers saw a listbox with no
      options. One of my own tests had asserted the invalid combobox role —
      the test encoded the bug and was corrected too.
- [x] **Docs site** — shipped in `apps/docs`, built against
      `sitedesignrefrence.html`: near-black ground, the lime `#CDF25C` signal,
      Geist / Geist Mono, specimen-sheet framing. `pnpm docs` (port 5182),
      `pnpm docs:build`.
      - [x] **Light and dark, both first class.** The reference is dark-only,
            so light is derived from it rather than invented. `#CDF25C` on
            white is about 1.4:1, so the *text and line* accent darkens to
            `#4D6B0A` for light, while `--ac-solid` keeps the signature lime
            for filled chips and buttons, where the text on it is dark in
            either theme. The theme is set on `<html data-theme>` by an inline
            script before first paint, so the page never flashes.
      - [x] All 11 components live, not screenshots, each card showing the
            value `onChange` actually emitted next to it.
      - [x] Six sheets: specimens, the canonical-value contract (with the
            react-hook-form + Zod and Server Action examples), validation by
            props, alternate layouts, a theming playground wired to the real
            components, and install.
      - [x] The registry is served from the docs site: `publicDir` points at
            the repo's own `public/`, so `/r/*.json` and `/llms.txt` are the
            canonical build output and cannot drift from `pnpm registry`.
      - [x] **4 tests** covering the page — every section renders, the theme
            toggle writes the attribute the stylesheet keys off, the playground
            drives the real components, and the whole page is axe-clean *with
            the `region` rule left on*, since unlike a component fragment this
            genuinely is a page.
      - Bug found: the footer's column headings were `<h4>` directly after an
        `<h2>`, skipping a level. axe caught it; they are `<h3>` now.
      - [x] **Multi-page, 27 routes.** `/`, `/components`, eleven
            `/components/:slug` pages and fifteen `/docs/:slug` guides, on a
            ~60-line History API router rather than a dependency — the site
            prints "0 runtime deps" in its own hero and should mean it.
      - [x] **Props tables generated from the source types.**
            `apps/docs/scripts/extract-props.mjs` reads `BaseFieldProps` and
            each component's `Use*Options` / `*Constraints` / `*Props`
            interfaces and emits `props.generated.json` — 23 shared props and
            106 component props, split into constraints, options and
            presentation. `--check` runs in `pnpm typecheck`, so a renamed prop
            fails CI instead of quietly making a page wrong.
      - [x] Per-component pages: live demo, constraints, generated props,
            react-hook-form and Server Action examples, keyboard map, and the
            gotchas worth knowing.
      - [x] Rebuilt against the supplied design file (`inputcn Site.dc.html`):
            `#08080a` ground, the `#CDF25C` signal, the `input/cn` gradient
            wordmark, 34px grid, animated beam, marquee, floating glass nav.
      - **Three claims in the design file were not shipped, because they are
        not true of this code:** it advertises twelve components (TagsInput
        does not exist here), says the library is "tested with NVDA and
        VoiceOver" (no screen reader run has happened), and installs from
        `@inputcn/<slug>` on npm (nothing is published). The site says eleven,
        states the screen-reader gap plainly on the accessibility page and in
        the footer, and uses the real registry URLs.
- [ ] **`@inputcn/server`** — run the same validator server-side

---

## Phase 5 · v1.0 — ▢

- [ ] API frozen, semver honoured from here
- [ ] Dual-version CI: Zod 3 and Zod 4
- [ ] React 18 and 19 verified
- [ ] npm publish under the `@inputcn` scope *(name confirmed available)*
- [ ] Launch

---

## Known gaps

Recorded rather than hidden.

| Gap | Impact | Fix |
|---|---|---|
| ~~Components render unstyled~~ | ✅ Fixed in Phase 2. | — |
| ~~`@inputcn/masked` has no Zod schema~~ | ✅ Fixed in Phase 2. | — |
| ~~Registry is built but not hosted~~ | Fixed. Deployed to <https://input-cn.vercel.app>; `/r/*.json` is served with CORS and the whole project points at it via `site.config.json` (`pnpm site-url <url>`). | — |
| **Nothing published to npm** | `npx shadcn add` copies a component whose first line is `import { useField } from "@inputcn/core"`. Until that package is on npm, every install compiles to a missing module. | Next |
| **Not a git repository** | Fixed. <https://github.com/42aditya31/inputcn> | — |
| **Country data is hand-maintained** | 18 countries with hand-written masks and mobile prefixes. Accurate for those, but not authoritative like libphonenumber. | Optional adapter, Phase 3 |
| **No a11y verification yet** | ARIA is wired and keyboard nav works, but nothing has been tested with a real screen reader. | Phase 4 |

---

## Non-goals

Written down so they stop resurfacing.

| Not building | Why |
|---|---|
| **`OTPInput`** | [input-otp](https://github.com/guilhermerodz/input-otp) does 22.3M downloads/week, has 3,257★, is actively maintained, and already powers shadcn/ui's own component. Unwinnable and unnecessary. |
| **A form library** | react-hook-form does 40.0M/week and is excellent. Single-field validation **is** in scope; submission, dirty tracking, field arrays and cross-field rules are not. |
| **Devtools panel** | React Query's devtools attach at 18% of the parent library; react-hook-form's at 1.1%. Async cache state is invisible — form state is already on screen. Ours would be too. |
| **Analytics / telemetry** | Triggers privacy suspicion that costs more than the feature is worth. Ship `onValidationFail` as a plain callback instead. |
| **Anything AI-powered** | Needs an API key and a metered service, breaking the zero-runtime-cost property that makes this maintainable by one person. |
| **Marketing site** | Deferred by explicit decision. A mockup exists at `../inputcn-landing.html`. |

---

## Verifying the current state

```bash
pnpm install
pnpm dev         # demo harness → http://localhost:5180
pnpm test        # 403 passing, 24 files
pnpm typecheck   # root (aliased) + each package (via node resolution)
pnpm build       # 4 packages (ESM + .d.ts) then the registry
pnpm registry    # regenerate public/r/*.json from source
```

## Reference documents

| Document | Contents |
|---|---|
| `../inputcn-prd.html` | Full PRD — 19 sections, props contract, validation design, form integration, acceptance criteria |
| `../inputcn-specimens.html` | Interactive specimen sheet — 13 components, 4 variants, 3 sizes, 15 layouts |
| `../inputcn-landing.html` | Marketing site mockup (deferred) |
