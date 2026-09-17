<div align="center">

# @inputcn/filesize

**MB and MiB are different numbers, and it keeps them different.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Ffilesize?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/filesize) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/filesize-input)

[Live demo](https://input-cn.vercel.app/components/filesize-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Emits bytes. `MB` is 1000² and `MiB` is 1024² — a 4.9% gap, which is exactly the difference between “a 100 MB limit” and a user's file being rejected.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/filesize-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/filesize
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<FileSizeInput
  label="Upload limit"
  value={bytes}        // 1048576
  onChange={setBytes}
  max="500 MB"
  binary={false}       // MB (1000²) rather than MiB (1024²)
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `number` | bytes | `1048576` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **No silent conversion.** The two unit systems stay distinct rather than being quietly normalised.
- **Locale-safe grouping.** The byte count is grouped with an explicit locale, so it does not render as `2,50,00,000` on a machine set to en-IN.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `min?` | `SizeBound` | — |
| `max?` | `SizeBound` | — |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { fileSizeSchema } from "@inputcn/filesize/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `binary?` | `boolean` | Use KiB/MiB/GiB and read ambiguous units as powers of 1024. Default false. |
| `bareUnit?` | `string` | Unit assumed when the user types a bare number. Default "MB". |
| `precision?` | `number` | Decimals when formatting. Default 2. |
| `locale?` | `string` | Grouping locale for the raw byte readout. Default "en-US". |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `showBytes?` | `boolean` | Show the raw byte count as a trailing affix. Default true. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
