<div align="center">

# @inputcn/cron

**Cron in, plain English and the next runs out.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fcron?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/cron) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/cron-input)

[Live demo](https://input-cn.vercel.app/components/cron-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Describes the expression in English and previews the next few runs, so a five-field string stops being a guess. An expression that is already equivalent is never rewritten — `1-5` stays `1-5` rather than becoming `1,2,3,4,5` the moment the field mounts.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/cron-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/cron
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<CronInput
  label="Schedule"
  value={cron}         // "0 9 * * 1-5"
  onChange={setCron}
  minInterval="5m"
  layout="builder"     // or "expression"
  showUpcoming
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `string` | expression | `"0 9 * * 1-5"` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **Human description.** “At 09:00, Monday to Friday.”
- **Catches the accident.** `minInterval` is what stops `* * * * *` reaching production.
- **Builder layout.** Frequency, time and day toggles, for people who do not write cron.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `minInterval?` | `IntervalBound` | Reject schedules that fire more often than this. The constraint that earns its keep — it stops someone scheduling a job every second and taking down a worker queue. |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { cronSchema } from "@inputcn/cron/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `previewCount?` | `number` | How many upcoming runs to compute for the preview. Default 3. |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout?` | `CronLayout` | `expression` for engineers, `builder` for everyone else. |
| `showDescription?` | `boolean` | Show the plain-English reading. Default true. |
| `showUpcoming?` | `boolean` | Show upcoming run times. Default true. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
