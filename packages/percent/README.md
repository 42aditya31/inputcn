<div align="center">

# @inputcn/percent

**Shows 12.5, emits 0.125. The confusion ends at the boundary.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fpercent?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/percent) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/percent-input)

[Live demo](https://input-cn.vercel.app/components/percent-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Users type percentages; maths wants fractions. The ×100 that usually lives in four different places in a codebase lives in exactly one here.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/percent-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/percent
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<PercentInput
  label="Discount rate"
  value={rate}         // 0.125
  onChange={setRate}   // the field shows 12.5
  max={0.5}
  precision={2}
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `number` | fraction | `0.125` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **One conversion point.** The component is the only place the factor of 100 exists.
- **Precision is on the display.** `precision` limits decimal places on the shown percentage, not on the stored fraction.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `min?` | `number` | As a fraction: 0.05 means 5%. |
| `max?` | `number` | As a fraction: 1 means 100%. |
| `positive?` | `boolean` | — |
| `integer?` | `boolean` | Reject fractional percentages — 12% yes, 12.5% no. |
| `precision?` | `number` | Maximum decimal places in the displayed percentage. Default 2. |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { percentSchema } from "@inputcn/percent/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `locale?` | `string` | — |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
