<div align="center">

# @inputcn/color

**Hex out, any format in, with a live WCAG ratio.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fcolor?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/color) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/color-input)

[Live demo](https://input-cn.vercel.app/components/color-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Accepts hex, `rgb()` and `hsl()`, emits hex, and shows the contrast ratio against a colour you nominate.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/color-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/color
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<ColorInput
  label="Brand colour"
  value={brand}        // "#CDF25C"
  onChange={setBrand}
  contrastAgainst="#FFFFFF"
  minContrast={4.5}
  swatches={["#CDF25C", "#3A3FD6"]}
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `string` | hex | `"#CDF25C"` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **Contrast warns, it does not block.** An unreadable brand colour is a legal value. `minContrast` raises a warning, not an error.
- **Tested against the reference values.** The WCAG luminance maths is unit-tested — black on white is 21:1.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `contrastAgainst?` | `string` | Check contrast against this colour. The differentiating constraint: it stops a customer picking a brand colour nobody can read. |
| `minContrast?` | `number` | Minimum WCAG ratio. 4.5 is AA for body text, 3 is AA for large text. |
| `allowed?` | `readonly string[]` | Restrict to a palette. |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { colorSchema } from "@inputcn/color/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `outputFormat?` | `ColorFormat` | Output format for `onChange`. Default "hex" — the only lossless one. |
| `swatches?` | `readonly string[]` | Palette shown beneath the field. |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `nativePicker?` | `boolean` | Show the native OS picker alongside the text field. Default true. |
| `showSwatches?` | `boolean` | Show the swatch palette. Default true. |
| `showContrast?` | `boolean` | Show the live contrast reading when `contrastAgainst` is set. Default true. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

> [!WARNING]
> HSL round-trips are lossy by ±1 per channel because the conversion rounds to integers. Hex in, hex out is stable; hex → HSL → hex may move by one.

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
