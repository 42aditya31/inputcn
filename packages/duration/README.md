<div align="center">

# @inputcn/duration

**90m, 1:30 and 1.5h are the same number.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fduration?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/duration) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/duration-input)

[Live demo](https://input-cn.vercel.app/components/duration-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Accepts the three ways people actually write durations and emits seconds. `multipleOf` takes a duration too, so the message reads “must be a multiple of 15 minutes” rather than “must be a multiple of 900”.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/duration-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/duration
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<DurationInput
  label="Session timeout"
  value={seconds}      // 5400
  onChange={setSeconds}
  min="30s"
  max="4h"
  multipleOf="15m"
  layout="segmented"   // or "text" | "presets"
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `number` | seconds | `5400` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **Three input styles.** Free text, segmented h/m/s, or preset pills.
- **ISO 8601 out too.** The hook exposes `PT1H30M` alongside the seconds.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `min?` | `DurationBound` | — |
| `max?` | `DurationBound` | — |
| `multipleOf?` | `DurationBound` | Must be a whole multiple of this. Accepts "15m". |
| `maxUnit?` | `DurationUnit` | Largest unit shown when formatting. Default "d". |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { durationSchema } from "@inputcn/duration/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `bareUnit?` | `DurationUnit` | What a bare number means. Default "m". |
| `presets?` | `readonly string[]` | Presets offered by the `presets` layout. |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout?` | `DurationLayout` | PRD §6. `text` is fastest for keyboard users; `segmented` is unambiguous. |
| `showNormalised?` | `boolean` | Show the normalised value as a trailing affix. Default true. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
