<div align="center">

# @inputcn/currency

**Register-style entry. Integer minor units, never a float.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fcurrency?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/currency) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/currency-input)

[Live demo](https://input-cn.vercel.app/components/currency-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Digits fill from the right like a cash register, so the caret can never drift into the middle of a number. Separators, symbol placement and fraction digits come from `Intl` for the active locale and currency — including zero-decimal currencies such as JPY.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/currency-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/currency
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<CurrencyInput
  label="Price"
  value={price}        // 129900 — an integer count of minor units
  onChange={setPrice}
  currency="GBP"
  positive
  max={100000}         // also in minor units: £1,000.00
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `number` | integer minor units | `129900` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **No float, ever.** Parsing, stepping and formatting all operate on the integer. `0.1 + 0.2` never gets near a price.
- **Locale-correct.** `1.234,50` and `$1,234.50` both parse. The separator convention is detected, not assumed.
- **Three layouts.** `inline`, `display` for pricing pages, `stepper` for quantities.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `min?` | `number` | Minor units. |
| `max?` | `number` | Minor units. |
| `positive?` | `boolean` | — |
| `negative?` | `boolean` | — |
| `nonZero?` | `boolean` | — |
| `wholeUnitsOnly?` | `boolean` | Reject fractional currency units (e.g. whole dollars only). |
| `multipleOf?` | `number` | Minor units the value must be a multiple of. |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { moneySchema } from "@inputcn/currency/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `currency?` | `string` | ISO 4217. Default "USD". |
| `locale?` | `string` | BCP 47. Default "en-US". |
| `allowNegative?` | `boolean` | Allow typing a negative value with "-". Default false. |
| `step?` | `number` | Stepper increment in minor units. Default one whole unit. |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout?` | `CurrencyLayout` | PRD §6 layouts. `inline` is the default form-row shape. |
| `showCode?` | `boolean` | Show the ISO code as a trailing affix. Default true. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
