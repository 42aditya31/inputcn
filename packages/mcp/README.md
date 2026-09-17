<div align="center">

# @inputcn/mcp

**Let an agent look up the real answer instead of guessing.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fmcp?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/mcp) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/docs/mcp)

[Documentation](https://input-cn.vercel.app/docs) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

An MCP server exposing what an AI agent would otherwise invent: the real prop list, the canonical value each component emits, the ready-made blocks, and a generator that refuses an invalid spec.

Every answer is read from the same extracted interfaces the documentation is built from, so the server cannot tell an agent something the library does not do.

## Install

```bash
npm i @inputcn/mcp
```

## Usage

```tsx
{
  "mcpServers": {
    "inputcn": { "command": "npx", "args": ["-y", "@inputcn/mcp"] }
  }
}
```

## What makes it different

- **Six tools.** `list_components`, `get_props`, `canonical_value`, `list_blocks`, `validate_spec`, `generate_form`.
- **The one that matters.** `canonical_value` answers “what do I actually store” — the question agents get wrong, producing a phone field that saves the display string.
- **Installation is already solved.** shadcn's own MCP server reads any spec-compliant registry, so adding `@inputcn` to `components.json` works with no code from us.

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
