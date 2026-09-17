# inputcn

**The inputs shadcn/ui doesn't ship.** Phone, currency, masked text — the fields
every product needs and every product rebuilds badly.

<!-- TODO(pre-launch): replace with a 10s GIF of PhoneInput. Per the PRD the
     GIF is the single highest-converting element in this file; shipping
     without it wastes the launch. -->

```bash
npx shadcn@latest add https://inputcn.dev/r/phone-input.json
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

| Component | Emits | Highlights |
|---|---|---|
| **PhoneInput** | `string` — E.164 | Searchable country selector, 18 countries, live national formatting, trunk-prefix handling, `mobileOnly` |
| **CurrencyInput** | `number` — minor units | Integer-only so no float touches a price, locale-correct, zero-decimal currencies, 3 layouts |
| **MaskedInput** | `string` — raw | `#`/`A`/`*` tokens, 12 presets, true caret preservation |

Plus, on all of them: declarative validation, smart paste, dev-mode warnings,
four surface variants, three sizes, and a Zod schema companion.

## Install

**As source you own** — the component lands in your repo, `@inputcn/core` comes
from npm. Edit the border, drop a control, rename the props.

```bash
npx shadcn@latest add https://inputcn.dev/r/phone-input.json
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

**Pre-release.** The three components above are complete, tested and building.
Nine more are planned — see [ROADMAP.md](./ROADMAP.md).

| | |
|---|---|
| Tests | 155 passing |
| Typecheck | clean, root and per-package |
| Published to npm | not yet |
| Registry hosted | not yet — URLs above assume a deploy |

## Development

```bash
pnpm install
pnpm dev        # demo harness at http://localhost:5180
pnpm test
pnpm typecheck
pnpm build      # packages + registry
```

The demo app aliases to package **source**, so editing the library hot-reloads.

## Not building, deliberately

- **OTP input** — [input-otp](https://github.com/guilhermerodz/input-otp) does
  22M downloads a week and already powers shadcn/ui's own component.
- **A form library** — react-hook-form is excellent. Single-field validation is
  in scope; submission and cross-field rules are not.
- **Anything needing a network call** — no address autocomplete, no AI. Zero
  runtime services keeps this maintainable and free.

## Licence

MIT. Not affiliated with or endorsed by shadcn.
