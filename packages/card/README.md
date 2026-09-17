<div align="center">

# @inputcn/card

**Brand detection, Luhn, and grouping that reflows mid-type.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fcard?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/card) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/card-input)

[Live demo](https://input-cn.vercel.app/components/card-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Number, expiry and CVC as one component with one canonical value. Grouping reflows as the brand is detected — 4-4-4-4 for Visa, 4-6-5 for Amex — and the CVC length follows it.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/card-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/card
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<CardInput
  label="Card details"
  value={card}         // "4242424242424242" — digits only
  onChange={setCard}
  name="card"
  expiryName="exp"
  cvcName="cvc"
  brands={["visa", "mastercard"]}
  notExpired
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `string` | digits only | `"4242424242424242"` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **Focus advances correctly.** Only when the number is a valid length for its brand **and** passes Luhn. Visa accepts 16, 18 and 19 digits, so advancing on the first valid length strands anyone with a 16-digit card.
- **Rejects by name.** `brands` produces “We do not accept American Express”, not “invalid card”.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `brands?` | `readonly CardBrand[]` | Restrict to the brands your PSP actually accepts. |
| `notExpired?` | `boolean` | Reject a card whose expiry has passed. Requires an expiry value. |
| `requireCvc?` | `boolean` | Require the CVC to be filled to the brand's length. |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { cardSchema } from "@inputcn/card/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `expiry?` | `string` | Expiry as typed, e.g. "04 / 28". Controlled separately from the number. |
| `defaultExpiry?` | `string` | — |
| `onExpiryChange?` | `(value: string) => void` | — |
| `cvc?` | `string` | — |
| `defaultCvc?` | `string` | — |
| `onCvcChange?` | `(value: string) => void` | — |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout?` | `CardLayout` | `stacked` is three fields; `single` is one row, Stripe-style. |
| `expiryName?` | `string` | Field names for native submission. |
| `cvcName?` | `string` | — |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

> [!WARNING]
> This is not a PCI-compliant capture path on its own. It is an input; the compliance boundary is your payment processor iframe.

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
