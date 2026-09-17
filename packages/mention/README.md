<div align="center">

# @inputcn/mention

**@-mentions whose ids track the text they came from.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fmention?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/mention) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/mention-input)

[Live demo](https://input-cn.vercel.app/components/mention-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Emits both the text and the ids present in it. Edit a handle away and its id goes with it, so you never notify someone whose name is no longer in the comment.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/mention-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/mention
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<MentionInput
  label="Comment"
  people={team}
  value={comment}      // { text: "hi @ada", ids: ["u1"] }
  onChange={setComment}
  maxMentions={3}
  layout="rich"
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `MentionValue` | text plus the ids in it | `{ text, ids }` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **Ids follow the text.** Deleting a handle removes its id from the value, so the notification list cannot go stale.
- **Not inside an email.** `user@example` does not open the picker.
- **Blast-radius cap.** `maxMentions` limits the notification before it is sent.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `maxLength?` | `number` | — |
| `minMentions?` | `number` | — |
| `maxMentions?` | `number` | Caps notification blast radius. |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { mentionSchema } from "@inputcn/mention/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `people` | `readonly Person[]` | — |
| `limit?` | `number` | Suggestions shown at once. Default 8. |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout?` | `MentionLayout` | `compact` fits more people on screen; `rich` disambiguates duplicate names. |
| `rows?` | `number` | — |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

> [!WARNING]
> The textarea is not a `combobox`. ARIA 1.2 permits that role on an `<input>`, not on a multi-line control, so the suggestion count is announced through a polite live region instead.

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
