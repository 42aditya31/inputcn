# Accessibility

> **Evidence, not assertion.** Most component libraries claim accessibility.
> This document says what was actually tested, how, and — just as importantly
> — what has **not** been verified yet.

**Target:** WCAG 2.2 AA
**Last audited:** 2026-09-17
**Automated coverage:** 50 tests, run on every commit

---

## Status at a glance

| Area | Status | How it is verified |
|---|---|---|
| Automated rule checks | ✅ Passing | axe-core 4.13, 11 components × 5 states, in CI |
| Labelling | ✅ Passing | Every component asserted to associate its label with a control |
| Keyboard operation | ✅ Passing | 9 tests covering every interactive element |
| Error announcement | ✅ Passing | `aria-describedby` + `role="alert"`, asserted |
| Reduced motion | ✅ Present | `prefers-reduced-motion` honoured in the stylesheet |
| Forced colours | ✅ Present | `forced-colors: active` block in the stylesheet |
| Colour contrast | ⚠️ Not machine-checked | See [Known gaps](#known-gaps) |
| **Screen readers** | ❌ **Not verified** | See [Known gaps](#known-gaps) |

---

## What the automated suite covers

`packages/core/test/a11y.test.tsx` — 50 tests, every one of which runs in CI.

**axe-core, 11 components × 5 states**
Default, disabled, showing an error, with a picker open, and in every layout
that changes DOM structure. Ruleset: `wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa`, `wcag22aa`, `best-practice`.

**Labelling** — each component is asserted to render a `<label>` whose `for`
resolves to a real control, and to accept `aria-label` when no visible label
is wanted. This is the most common real-world failure, so it is checked
structurally rather than trusted.

**Error announcement** — the message is linked by `aria-describedby`, carries
`role="alert"`, and is asserted **not** to appear before the first blur.
Announcing on every keystroke is what makes a field unusable with a screen
reader, so the silence is a requirement, not an omission.

**Keyboard** — every interactive element is reachable and operable:

| Component | Verified |
|---|---|
| PhoneInput | Tab to trigger · Enter opens · focus moves to search · ↑↓ navigate · Enter selects · **Escape returns focus to the trigger** |
| CurrencyInput | ↑↓ step the value |
| DurationInput (segmented) | Tab between h/m/s · ↑↓ step and wrap at the unit boundary |
| CronInput (builder) | Day toggles are real buttons, focusable and pressable |
| MentionInput | Full flow with no mouse: type, ↑↓, Enter |
| ColorInput | Swatches focusable and pressable; the OS colour picker is **out** of the tab order, since the text field is the accessible control |
| All | `disabled` removes the whole component from the tab order |

---

## Bugs this audit found

Every one of these was in shipped code and had passed the component test suite.
They are listed because "we ran axe" means nothing without saying what it
caught.

1. **`role="combobox"` on a `<textarea>` (MentionInput)** — invalid. ARIA 1.2
   permits that role on an `<input>`, not on a multi-line control. Removed; a
   `<textarea>` is already a textbox and legitimately supports
   `aria-activedescendant`, and a polite live region now announces the
   suggestion count. *One of my own tests had asserted the invalid role — the
   test encoded the bug, and was corrected too.*

2. **`role="dialog"` with no accessible name (PhoneInput)** — the country
   popover is a filtered listbox, not a dialog. The role was wrong in the
   first place and has been removed rather than papered over with a label.

3. **Unnamed `listbox` (Phone and Mention)** — both pickers now carry an
   `aria-label`.

4. **`<li>` breaking the listbox→option relationship (both pickers)** — ARIA
   requires `option` to be a *direct* child of `listbox`. The list-item
   wrappers sat in between, so screen readers saw a listbox with no options.
   The wrappers now carry `role="presentation"`.

---

## Known gaps

Stated plainly rather than omitted.

### ❌ Screen readers have not been tested

**No NVDA, JAWS or VoiceOver run has been performed.** Automated tooling
catches structural problems — a missing name, a broken role relationship — but
it cannot tell you whether the experience is *usable*. Those are different
questions, and only the second one matters to someone actually using the
field.

Specifically unverified:

- Whether the error is announced once, at the right moment, in a useful order
- Whether the mention live region interrupts typing in practice
- Whether the country picker's filtering is followable without sight
- Whether `aria-activedescendant` on the mention textarea is announced at all
  by each screen reader — support here varies
- Whether the segmented duration field reads as three related controls or as
  three unrelated boxes

**This is the single largest gap in the project.** It needs a human with a
screen reader, and there is no automated substitute. Until it is done, this
library should be described as *"structurally accessible, not yet
screen-reader verified."*

### ⚠️ Colour contrast is not machine-checked here

axe's `color-contrast` rule is disabled in the suite, because jsdom has no
layout engine — every check resolves against an unstyled document and reports
false positives.

Mitigations: ColorInput's own WCAG luminance maths is unit-tested against the
reference values (black-on-white = 21:1), and the stylesheet derives every
colour from the host's shadcn tokens, so contrast is inherited from a theme
the consumer already controls. But **the rendered components have not been
contrast-checked in a real browser**, and should be before v1.0.

### ⚠️ `region` rule disabled

Components render as fragments, not pages, so there is no landmark structure
for them to sit in. A page-level concern, not a component one.

---

## Running the audit

```bash
pnpm test packages/core/test/a11y.test.tsx
```

Failures print the rule, impact, offending markup and the Deque help URL, so
they are actionable without re-running anything.

---

## Before v1.0

- [ ] **NVDA on Windows** — full pass, transcript published here
- [ ] **VoiceOver on macOS and iOS** — full pass, transcript published here
- [ ] **Contrast check in a real browser** across all four variants, both themes
- [ ] **Keyboard pass at 200% zoom** and at 320px width
- [ ] **Windows High Contrast Mode** visual check
- [ ] Publish a VPAT so procurement teams have something to file
