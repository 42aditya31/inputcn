<div align="center">

# @inputcn/ip

**v4, v6 and CIDR, with the host range worked out for you.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fip?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/ip) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/ip-input)

[Live demo](https://input-cn.vercel.app/components/ip-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Shows the computed host range for a CIDR block, so an allow-list entry can be checked before it is saved.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/ip-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/ip
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<IpInput
  label="Allowed range"
  value={cidr}         // "10.0.0.0/24"
  onChange={setCidr}
  requirePrefix
  maxPrefix={24}
  noPrivate
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `string` | address or CIDR | `"10.0.0.0/24"` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **maxPrefix earns its keep.** It is what stops somebody allow-listing `0.0.0.0/0` by accident.
- **Paste a log line.** The address is extracted from surrounding text.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `noPrivate?` | `boolean` | Reject RFC 1918 private ranges. |
| `noLoopback?` | `boolean` | Reject 127.0.0.0/8. |
| `noMulticast?` | `boolean` | Reject 224.0.0.0/4. |
| `minPrefix?` | `number` | Smallest prefix allowed. `minPrefix={8}` rejects /0 through /7. The constraint that earns its keep: it stops an admin allow-listing 0.0.0.0/0 by accident. |
| `maxPrefix?` | `number` | Largest prefix allowed. `maxPrefix={24}` rejects /25 and narrower. |
| `requirePrefix?` | `boolean` | Require an explicit /n suffix. |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { cidrSchema } from "@inputcn/ip/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `showRange?` | `boolean` | Show the computed host range for a CIDR block. Default true. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
