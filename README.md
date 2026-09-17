<div align="center">

# inputcn

**The inputs shadcn/ui doesn't ship.**
Phone, currency, card, duration, cron, colour, file size, IP, percent, mask and
mentions — the fields every product needs and every product rebuilds badly.

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fcore?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/core)
[![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](./LICENSE)
[![tests](https://img.shields.io/badge/tests-498%20passing-cdf25c?style=flat-square&labelColor=09090b)](#project-status)
[![a11y](https://img.shields.io/badge/axe--core-50%20checks-a1a1aa?style=flat-square&labelColor=09090b)](./ACCESSIBILITY.md)

[**Live demo**](https://input-cn.vercel.app) ·
[Documentation](https://input-cn.vercel.app/docs) ·
[All 11 components](https://input-cn.vercel.app/components)

</div>

<!-- TODO(pre-launch): replace with a 10s GIF of PhoneInput. Per the PRD the
     GIF is the single highest-converting element in this file; shipping
     without it wastes the launch. -->

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/phone-input.json
```

```tsx
import { PhoneInput } from "@/components/inputcn/phone/phone-input"

<PhoneInput
  label="Phone number"
  value={phone}          // "+14155552671"  — always E.164
  onChange={setPhone}    // never the formatted string
  required
  mobileOnly
/>
```

That renders a styled field with a searchable country selector, formats as the
user types, validates on blur, and submits `+14155552671` through `FormData` —
with no schema, no resolver and no form library.

---

## Why

shadcn/ui is the best component layer React has. Its input coverage stops at the
easy cases: it ships `Input` and `Input OTP`, and nothing else. So every project
reimplements phone, currency and masked fields, and gets at least one of these
wrong:

- **Formatting breaks the caret.** Inserting a separator as the user types sends
  the cursor to the end of the field.
- **The displayed value gets submitted.** A phone field shows `(415) 555-2671`
  and stores exactly that, instead of `+14155552671`.
- **Floats touch prices.** `0.1 + 0.2 !== 0.3`, and invoices drift.
- **Composite widgets aren't keyboard reachable**, and `ref.focus()` from a form
  library silently does nothing.

inputcn fixes those once.

## What you get

Eleven components. Every one emits a canonical value, forwards its ref to the
primary input, and ships a matching Zod schema.

| Component | Emits | Why it is hard |
|---|---|---|
| [**PhoneInput**](https://input-cn.vercel.app/components/phone-input) | `string` — E.164 | Country selector, live national formatting, trunk prefixes, `mobileOnly` |
| [**CurrencyInput**](https://input-cn.vercel.app/components/currency-input) | `number` — minor units | Integer-only so no float touches a price; zero-decimal currencies; 3 layouts |
| [**MaskedInput**](https://input-cn.vercel.app/components/masked-input) | `string` — raw | `#`/`A`/`*` tokens, 12 presets, true caret preservation |
| [**PercentInput**](https://input-cn.vercel.app/components/percent-input) | `number` — fraction | Shows `12.5`, emits `0.125`, one conversion point |
| [**CardInput**](https://input-cn.vercel.app/components/card-input) | `string` — digits | Brand detection, Luhn, grouping that reflows 4-4-4-4 → 4-6-5 |
| [**DurationInput**](https://input-cn.vercel.app/components/duration-input) | `number` — seconds | `90m`, `1:30` and `1.5h` are the same number |
| [**ColorInput**](https://input-cn.vercel.app/components/color-input) | `string` — hex | Any format in, live WCAG ratio, contrast warns rather than blocks |
| [**CronInput**](https://input-cn.vercel.app/components/cron-input) | `string` — expression | Plain-English description, next-run preview, `minInterval` |
| [**FileSizeInput**](https://input-cn.vercel.app/components/filesize-input) | `number` — bytes | MB and MiB stay distinct — a 4.9% gap that rejects real uploads |
| [**IpInput**](https://input-cn.vercel.app/components/ip-input) | `string` — address | v4, v6 and CIDR, with the host range computed |
| [**MentionInput**](https://input-cn.vercel.app/components/mention-input) | `{ text, ids }` | Ids track the text, so you never notify a deleted mention |

Plus, on all of them: declarative validation, smart paste, dev-mode warnings,
four surface variants, three sizes, and a Zod schema companion.

> [!NOTE]
> There is also [`@inputcn/testing`](./packages/testing) — 11 `fill*` helpers and
> rule-based assertions, because driving a masked field from a test is its own
> small nightmare.

## Install

**As source you own** — the component lands in your repo, `@inputcn/core` comes
from npm. Edit the border, drop a control, rename the props.

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/phone-input.json
```

**As a dependency** — if you'd rather get fixes via `npm update`.

```bash
npm i @inputcn/phone
```

Either way, import the stylesheet once:

```tsx
import "@inputcn/core/styles.css"
```

## Validation is a prop

No schema, no resolver, no regex.

```tsx
<PhoneInput    required mobileOnly countries={["US", "CA"]} />
<CurrencyInput required positive max={100000} />
<MaskedInput   mask="###.###.###-##" complete />
```

Errors stay quiet until the first blur, then clear live the moment the value
becomes valid — the half most implementations forget.

Already using react-hook-form? The components detect it and go silent, letting
your `<FormMessage>` own the error. `{...field}` spreads with no glue:

```tsx
import { phoneSchema } from "@inputcn/phone/schema"

const schema = z.object({ phone: phoneSchema({ country: "US" }) })

<FormControl><PhoneInput {...field} /></FormControl>
```

## Theming

Every colour and radius reads a shadcn CSS variable. Nothing is hardcoded, so
changing `--primary` or `--radius` restyles every field with no code change.

```tsx
<PhoneInput variant="filled" size="sm" />
```

`variant` — `outline` · `filled` · `underline` · `elevated`
`size` — `sm` (28px) · `default` (32px) · `lg` (38px)

## Project status

**Pre-1.0.** All eleven components are complete, tested and published. The API is
stable in practice but not yet frozen — see [ROADMAP.md](./ROADMAP.md).

| | |
|---|---|
| Components | 11, all shipped |
| Tests | 498 passing, 27 files |
| Typecheck | clean — root, every package, and the docs site |
| Published to npm | yes, `0.1.x` under `@inputcn` |
| Registry hosted | yes, at [input-cn.vercel.app/r](https://input-cn.vercel.app/r/index.json) |
| Screen readers | **not verified** — see below |

> [!CAUTION]
> **Accessibility is automated-only so far.** 50 axe-core checks run on every
> commit and caught four real ARIA bugs, all written up in
> [ACCESSIBILITY.md](./ACCESSIBILITY.md). But no NVDA, JAWS or VoiceOver run has
> been performed. Until one has, the honest description is *structurally
> accessible, not screen-reader verified*.

## Development

```bash
pnpm install
pnpm dev        # demo harness  → http://localhost:5180
pnpm docs       # docs site     → http://localhost:5182
pnpm test       # 498 tests
pnpm typecheck  # root + every package + the docs site
pnpm build      # packages + registry
```

Both apps alias to package **source**, so editing the library hot-reloads.

Three things are generated rather than written, and each has a `--check` mode
wired into `pnpm typecheck` so it cannot silently drift:

| Command | Generates | From |
|---|---|---|
| `pnpm registry` | `public/r/*.json` | The component source itself |
| `pnpm readmes` | `packages/*/README.md` | `scripts/readme-meta.mjs` + the extracted types |
| `pnpm site-url <url>` | Every public URL | `site.config.json` |

Props tables on the docs site come from
`apps/docs/scripts/extract-props.mjs`, which reads the real interfaces — so a
renamed prop fails CI instead of quietly making a page wrong.

## Not building, deliberately

- **OTP input** — [input-otp](https://github.com/guilhermerodz/input-otp) does
  22M downloads a week and already powers shadcn/ui's own component.
- **A form library** — react-hook-form is excellent. Single-field validation is
  in scope; submission and cross-field rules are not.
- **Anything needing a network call** — no address autocomplete, no AI. Zero
  runtime services keeps this maintainable and free.

## Licence

MIT. Not affiliated with or endorsed by shadcn.
