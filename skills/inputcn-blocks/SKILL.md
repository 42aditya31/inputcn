---
name: inputcn-blocks
description: Drop in a complete, working React form rather than assembling one field at a time. Use this skill when the task is a whole form — a checkout, a payment page, vendor or supplier onboarding, KYC, a job or cron scheduler, a rate card or pricing form, a firewall or IP allowlist rule, or a brand and settings page. Triggers whenever someone asks to build, scaffold or add a form with several fields in React.
license: MIT
metadata:
  author: 42aditya31
  version: "0.1.1"
  homepage: https://input-cn.vercel.app/blocks
---

# inputcn blocks

Six complete forms, each already correct. Start from one instead of assembling
fields.

When the task is a whole form, copying a working block is better than writing
one: the value semantics, the schema wiring and the constraint props are already
right, and the failure modes they avoid are the ones that pass code review.

## The blocks

| Block | Fields | Wiring |
|---|---|---|
| **checkout** | Card, phone for receipts, tip | react-hook-form + Zod |
| **vendor-onboarding** | Mobile, tax ID, spend cap, IP allowlist | react-hook-form + Zod |
| **job-schedule** | Cron, timeout, artifact cap, notify | none — native FormData |
| **rate-card** | Hourly rate, discount %, minimum billable | react-hook-form + Zod |
| **firewall-rule** | Source range, destination, TTL, tag | none — native FormData |
| **brand-settings** | Brand colour, upload cap, support number, postcode | none — native FormData |

## How to use one

1. Fetch the block source from
   `https://input-cn.vercel.app/blocks/<slug>` — the Code tab shows the exact
   file, and it is the file that runs on the page.
2. Install the components it uses:
   ```bash
   npx shadcn@latest add https://input-cn.vercel.app/r/<component>.json
   ```
3. Adapt names, labels and layout to the project. **Do not change** the
   canonical values, the constraint props, or which schema validates which
   field.

## Pick by what the form actually does

- Taking money → **checkout** or **rate-card**
- Collecting business details → **vendor-onboarding**
- Anything scheduled or recurring → **job-schedule**
- Network or access control → **firewall-rule**
- A settings or preferences page → **brand-settings**

If none fits, use the `inputcn` skill and assemble fields, or generate from a
spec with `npx inputcn generate`.

## What every block already gets right

- **Canonical values.** Card is digits with no spaces, money is integer minor
  units, duration is seconds, phone is E.164.
- **One mode, not both.** RHF blocks pass `aria-invalid` so the field stays
  silent and the form owns the error. Standalone blocks let the field render it.
  Never both.
- **Formatting options in two places.** `currency` and `locale` go to the schema
  as well as the component, or a GBP field reports its cap in dollars.
- **Native submission.** The standalone blocks work unchanged as Server Actions,
  because each component renders a hidden input carrying the canonical value.

## Do not

- Do not rewrite a block's schema to use `z.string()` or `z.number()` directly.
  The companion schemas are parity-tested against the components; a hand-written
  one will disagree with the field.
- Do not add an `onBlur` handler for validation. The timing is already handled.
- Do not store what a field displays.

## Reference

- <https://input-cn.vercel.app/blocks> — all six, live
- Use the `inputcn` skill for the per-component rules and the full prop list
