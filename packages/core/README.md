<div align="center">

# @inputcn/core

**The engine behind every inputcn field.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fcore?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/core) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app)

[Documentation](https://input-cn.vercel.app/docs) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Caret-safe masking, validity rules, smart paste and dev-mode warnings. You rarely install this directly — every inputcn component depends on it, and the shadcn registry adds it for you.

It is a real npm dependency rather than copied source, because nobody wants to fork a caret engine, and a bug fixed here should reach you through `npm update`.

## Install

```bash
npm i @inputcn/core
```

## Usage

```tsx
import { useField } from "@inputcn/core"
import { nextCaretPosition } from "@inputcn/core/caret"
import "@inputcn/core/styles.css"
```

## What makes it different

- **Caret preservation.** The caret is tracked as a count of significant characters to its left, not a string offset, so reformatting mid-type never throws the cursor to the end.
- **Validity during render.** Computed from the current value on every render, never stored in state and never produced by an effect — so the displayed error can never lag a keystroke behind.
- **Two modes, auto-detected.** A field owns its error message standalone, and goes quiet inside a form library. Detected from `aria-invalid`, `aria-describedby` or a form context.
- **Token-driven styles.** One stylesheet that reads your shadcn CSS variables. No hardcoded colour, radius or font.

## Entry points

Every module is importable on its own, so you take only what you use.

| Import | What it is |
|---|---|
| `@inputcn/core` | Everything below, re-exported |
| `@inputcn/core/caret` | Caret tracking: `nextCaretPosition`, the core of the whole library |
| `@inputcn/core/mask` | Template masking primitives |
| `@inputcn/core/paste` | Clipboard normalisation — zero-width spaces, smart quotes, NBSP |
| `@inputcn/core/validity` | Rule builders: `min`, `max`, `multipleOf`, `pattern` and friends |
| `@inputcn/core/messages` | Message resolution and the built-in English defaults |
| `@inputcn/core/provider` | `InputcnProvider` — optional; the defaults work without it |
| `@inputcn/core/use-field` | The hook every component is built on |
| `@inputcn/core/use-masked-value` | Masked value state with caret preservation |
| `@inputcn/core/use-latest` | `useEvent` — a stable callback reference |
| `@inputcn/core/warn` | Dev-mode warnings, stripped in production |
| `@inputcn/core/types` | Shared types, including `BaseFieldProps` |
| `@inputcn/core/styles.css` | The stylesheet. Import once. |

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
