# What to build for the AI era

> Seven ideas, ranked. Plain language. What each one is, why it would spread,
> how hard it is, and which one to build first.

---

## The one thing to understand before reading the ideas

Almost every "AI feature" on a developer website today is **a chatbot in the
corner that nobody uses.** Do not build that.

Here is the actual shift, and it is bigger than a chatbot:

**Developers are no longer your users. Their agents are.**

A developer says *"add a phone field to this form"* and never opens your site.
So the question is not "how do I make my website feel AI-ish". It is:

> When an agent builds a form, what makes it pick **your** library — and get it
> **right**?

And here is the part most people miss. Agents are not bad at *finding* libraries.
They are bad at **value semantics**. Ask any agent to build a phone field and it
will happily write code that stores `(415) 555-2671` in your database. Ask for a
price field and it will store `1234.50` as a float. The code looks perfect. It
passes review. It is wrong, and it ships.

**That is the exact problem inputcn already solves.** You just have not pointed
it at agents yet.

### What you already have that almost nobody else does

| Asset | Why it matters for agents |
|---|---|
| `props.generated.json` | A machine-readable list of **every real prop**, extracted from the types. An agent reading this *cannot* invent a prop. |
| The canonical-value contract | One rule, mechanically checkable. "Did the agent store E.164 or the display string?" is a yes/no question. |
| `data-rule` on every error | A test can assert **which rule failed**, not a sentence. Agents can verify their own work. |
| `@inputcn/testing` | Agents write bad tests for formatted inputs. You ship the helpers. |
| A hosted registry with CORS | Agents can already install from it. Today. |
| Zod companions with parity tests | The validator and the field cannot disagree. |

You are accidentally the most agent-ready component library in the category.
These ideas are about making that on purpose.

---

# The seven ideas

Ranked by **(how viral) × (how useful) ÷ (how hard)**.

---

## 1. "Build this with Claude Code" — the one-click button

**⭐ Do this first. Highest visibility for the least work.**

### What it is, simply

Every component page gets a button. Click it, and Claude Code opens **on their
machine, in their repo,** with a full prompt already typed.

### This is real and documented today

Claude Code registers a `claude-cli://` URL scheme. The exact format:

```
claude-cli://open?repo=owner/name&q=<url-encoded prompt>
```

| Detail | Value |
|---|---|
| Prompt length | up to **5,000 characters** |
| Where it opens | `repo=owner/name` (their clone) or `cwd=/abs/path` |
| Auto-runs? | **No.** The prompt is typed but not sent. They press Enter. |
| VS Code variant | `vscode://anthropic.claude-code/open` |
| Cursor | has its own `cursor://` prompt deeplink |

**Important gotcha:** GitHub strips custom URL schemes in Markdown, so this button
works on your site but not in your README. Put the raw URL in a code block there.

### The clever trick

Combine it with the Skill (idea #3). Instead of cramming 3,000 characters of
instructions into the URL, the link just **calls your skill**:

```
claude-cli://open?q=/inputcn%20build%20a%20checkout%20form%20with%20card%20and%20phone
```

Short link. All the real knowledge lives in the skill, on their machine, always
current. This is the pattern Anthropic's own docs recommend.

### Difficulty

**Easy. A weekend at most.** You already generate per-component code examples, so
you are 80% there.

---

## 2. Form Blocks — complete forms, not components 🆕

**⭐ The most viral thing on this list, and it is mostly content, not code.**

### What it is, simply

Nobody wants a phone input. They want a **checkout page**. Right now your site
sells eleven ingredients; this sells eight finished meals.

A gallery of complete, real, working forms:

| Block | What is in it |
|---|---|
| **Checkout** | Card, billing phone, country, currency total |
| **Vendor onboarding** | Phone, budget cap, tax ID, IP allowlist |
| **KYC / identity** | Phone, date, masked national ID, address |
| **Job scheduler** | Cron, duration, file-size cap, notify-by-mention |
| **Team invite** | Mentions, role, expiry duration |
| **Rate card** | Currency, percent, minimum duration |
| **Firewall rule** | IP + CIDR, port, duration, colour tag |
| **Brand settings** | Colour with contrast check, upload limit, phone |

Each one is **live on the page**, fully working, with three buttons:

```
[ Copy the code ]   [ Copy the AI prompt ]   [ Open in Claude Code ]
```

### Why this spreads, with evidence

**This format is already proven in exactly your ecosystem.** shadcn's most shared,
most cloned, most linked-to asset is not its components — it is its *blocks*. Whole
businesses exist selling shadcn blocks. People share a block link in a Slack
thread; nobody shares a link to a button component.

A block is a **screenshot with a URL attached**. That is the unit that travels.

### Why it is AI-native, not just a gallery

Because the block is *also* a prompt. A developer sees the checkout block, clicks
**Open in Claude Code**, and their agent receives:

```
Build a checkout form in this project using inputcn.

Fields:
- CardInput      name="card"     brands=["visa","mastercard"] notExpired
- PhoneInput     name="phone"    mobileOnly countries=["GB","US"]
- CurrencyInput  name="total"    currency="GBP" positive max=500000

Rules:
- react-hook-form with zodResolver
- use the companion schemas from each package
- pass currency and locale to BOTH the component and moneySchema
- canonical values only: phone is E.164, total is integer minor units
```

They never read your docs. They never learn your API. They got a correct form in
one click — and the block page is what made them click.

### The extra move: let people submit blocks

A `blocks/` folder and a PR template. Community blocks are the cheapest content
you will ever get, and every contributor becomes an advocate. This is how
`awesome-*` repos and shadcn block sites grew.

### Difficulty

**Low-medium, and it is the good kind of work.** No new technology — you already
have the components, the live-demo infrastructure, and the code generators. It is
mostly *writing eight good forms*, which is a weekend, and which doubles as the
best test suite you will ever have for your own library.

---

## 3. The `/inputcn` Claude Code Skill

### What it is, simply

A file developers install once. After that they type:

```
/inputcn build a vendor onboarding form with phone, budget and an IP allowlist
```

and the agent produces a correct form — right props, right canonical values, Zod
schema attached — because the skill *taught* it your rules.

### Why it matters more than it looks

A skill is not documentation. It is **instructions that load into the agent's
context at the moment it writes the code.** That is the difference between an
agent that has read about your library and an agent that is following your rules.

Your skill would carry:
- the canonical value table (this is the whole thing)
- `props.generated.json`, so it cannot invent a prop
- the "pass `currency` to the schema too" trap we hit building the test form
- the eight blocks from idea #2, as worked examples

### How distribution works in 2026

- A **skill** is a folder with a `SKILL.md` and YAML frontmatter.
- A **plugin** bundles skills, MCP servers and commands via `.claude-plugin/plugin.json`.
- A **marketplace** is just a GitHub repo. Users run `/plugin install`.

Community marketplaces carry thousands of skills and hundreds of thousands of
monthly visitors. Being listed is free distribution to exactly your audience.

### Difficulty

**Easy.** A Markdown file and a JSON manifest. The hard part is writing good
instructions, and you have already written them — they are your docs.

---

## 4. The `@inputcn` MCP server

### What it is, simply

MCP is the standard way an AI agent talks to an external system. shadcn already
ships an MCP server that can browse and install from **any** registry following
its spec.

**You already follow the spec.** So this mostly already works:

```json
// the user's components.json
{
  "registries": {
    "@inputcn": "https://input-cn.vercel.app/r/{name}.json"
  }
}
```

Now an agent told *"build a checkout form using @inputcn"* will browse your
registry, pick components and install them.

### The step beyond

Ship your **own** MCP server with tools the shadcn one does not have:

| Tool | What it does |
|---|---|
| `inputcn_list_blocks` | The eight blocks from idea #2 |
| `inputcn_get_props` | Real props, straight from `props.generated.json` |
| `inputcn_canonical_value` | "What does CurrencyInput emit?" → `129900`, integer minor units |
| `inputcn_build_schema` | Constraints in, matching Zod schema out |

### Difficulty

- Registry namespace: **already done.** Document it. One paragraph.
- Custom MCP server: **easy-medium.** Small SDK; your data is already JSON.

---

## 5. `form.inputcn.json` — ask the agent for a spec, not for code 🆕

**⭐ The most structurally interesting idea here. It changes what you ask the AI to do.**

### The insight

LLMs are **unreliable at nuanced React** and **extremely reliable at structured
JSON**. Everyone asks them for the thing they are worse at.

So stop asking for a form. Ask for a **description** of a form, and generate the
code yourself:

```jsonc
// form.inputcn.json — an agent writes this in one shot, correctly
{
  "name": "VendorOnboarding",
  "form": "react-hook-form",
  "fields": [
    { "type": "phone",    "name": "phone",  "label": "Mobile",
      "mobileOnly": true, "countries": ["GB", "US"] },
    { "type": "currency", "name": "budget", "label": "Monthly budget",
      "currency": "GBP",  "positive": true, "max": 1000000 },
    { "type": "ip",       "name": "allow",  "label": "Allowed range",
      "requirePrefix": true, "maxPrefix": 24 }
  ]
}
```

Then:

```bash
npx inputcn generate form.inputcn.json
```

and you get the **React component, the Zod schema, the tests and the types** —
all correct, all consistent, every time.

### Why this is the clever bit

Look at what just happened to the error surface:

| Asking the agent for | What can go wrong |
|---|---|
| A React form | Wrong props, float money, display string stored, schema drifts from the field, missing labels, broken refs — **dozens of failure modes** |
| 20 lines of JSON | A typo in a field name. **That is it.** |

You moved every hard decision from the model into your own generator, which is
deterministic and tested. The agent does the part it is good at — understanding
what the human meant — and nothing else.

### It also makes your other ideas work properly

This one file quietly becomes the backbone:

- **The visual builder (#6)** needs a save format. This is it.
- **The blocks (#2)** need a source of truth. Each block is one of these files.
- **The skill (#3)** gets a much simpler job: "emit this JSON shape".
- **Sharing:** a form is now a file you can paste into a Slack thread, attach to
  a ticket, or commit next to the component and regenerate on change.

### Why it might spread

Because it is a **genuinely new idea in this category**, and developers share ideas
that reframe a problem. The line writes itself:

> *"Don't let the AI write your form. Let it write the spec, and let the compiler
> write the form."*

That is an argument people repeat.

### Difficulty

**Medium.** The generator is a template function — you already generate
react-hook-form and Server Action examples on every component page, which is
the same job. The real work is designing the JSON shape well, because changing it
later is painful.

**Start tiny:** three field types, one output file, no tests. Prove it feels good
before generalising.

---

## 6. The visual form builder

### What it is, simply

Drag fields onto a canvas, set rules with checkboxes, see it working live. Then:

```
[ Copy the code ]   [ Copy the AI prompt ]   [ Open in Claude Code ]
```

### Why the third button is the interesting one

Everyone has built a form builder. What nobody has built is a form builder whose
**output is a prompt**, because until recently there was nothing to paste it into.

A visual builder is a poor way to build a *real* form — you always edit the code
afterwards. But it is a **brilliant way to write a precise prompt.** You are not
competing with the code editor. You are replacing the five minutes of typing out
requirements.

**Build it on top of idea #5.** The builder edits a `form.inputcn.json`; the code,
the prompt and the deep link are all views of that one file. Without a spec format
underneath, a builder becomes a pile of special cases.

### Difficulty

**Hard, and the easiest to get wrong.** Weeks, not a weekend, and a half-finished
builder is worse than none.

**Do not start here.** Ship #1 and #2, see whether anyone clicks, then #5, and
only then this.

---

## 7. `llms.txt` and `agents.md`, done properly

### What it is, simply

Plain text written for machines. You have `llms.txt`. Two additions:

- **`llms-full.txt`** — every prop, every canonical value, every block, in one flat
  file an agent can swallow whole.
- **`AGENTS.md`** in the repo — the rules an agent should follow when touching this
  codebase.

### Why bother

**Table stakes, not a differentiator.** It will not win you a single share. But it
is a few hours, and it is the substrate every other idea sits on.

### Difficulty

**Trivial.** Generate `llms-full.txt` from `props.generated.json` and the blocks,
and it can never drift.

---

# The honest summary

| # | Idea | Viral | Useful | Effort | Verdict |
|---|---|---|---|---|---|
| 1 | "Build with Claude Code" button | Medium | High | **Low** | **Do this first** |
| 2 | **Form Blocks** 🆕 | **Very high** | High | Low–Med | **The attraction** |
| 3 | `/inputcn` Skill | Low | **Very high** | **Low** | Quiet workhorse |
| 4 | MCP server | Low | High | Low–Med | Half done already |
| 5 | **`form.inputcn.json`** 🆕 | High | **Very high** | Medium | **The clever one** |
| 6 | Visual builder | High | Medium | **High** | Later, not now |
| 7 | `llms-full.txt` | None | Medium | Trivial | Just do it |

---

## The MVP — four weekends

Build the **loop**, not the features. Each piece makes the next one better.

```
Weekend 1   llms-full.txt + the /inputcn Skill + the @inputcn registry
            namespace documented.
            → An agent can now find and correctly use the library.

Weekend 2   "Build with Claude Code" buttons on all 11 component pages.
            → The site becomes usable from a browser in one click.
            → Ship a GIF. Measure the clicks.

Weekend 3   Eight Form Blocks, each live, each with its three buttons.
            → You now sell finished forms, not ingredients.
            → This is the page people actually link to.

Weekend 4   form.inputcn.json + npx inputcn generate, three field types.
            → The blocks become files. The builder gets a save format.
            → The reframe you can write a post about.
```

**Why this order:** weekend 1 makes you *work*. Weekend 2 makes you *visible*.
Weekend 3 makes you *shareable*. Weekend 4 makes you *interesting*. Each is
shippable alone — stop after any one and you still have something real.

---

## The one-line positioning

> **Don't make your AI write the form. Let it pick one, and let inputcn write it
> correctly.**

The blocks are what people see and share. The spec file is what makes the output
right every time. The skill and the MCP server are the plumbing that connects your
site to the place the work actually happens — which is no longer your site.

---

## Where to be careful

- **Do not build a chatbot.** Nobody uses them. You have real docs; a bot that
  paraphrases them is worse than the docs.
- **Do not put AI in the product itself.** Any runtime AI feature needs an API key
  and a bill, and breaks the zero-cost property that makes this project survivable
  for one unpaid maintainer. Everything above runs on the user's machine, with the
  user's own agent.
- **Design the spec format slowly.** `form.inputcn.json` is the one decision here
  that is expensive to change once people have files on disk. Ship three field
  types and live with it for a month before adding more.
- **Blocks must be real.** A block that does not handle its own edge cases is worse
  than no block, because people paste it into production.
- **Deep links do not work in GitHub Markdown.** Custom URL schemes are stripped.
  Site only.

---

## Sources

- [Claude Code deep links](https://code.claude.com/docs/en/deep-links) — `claude-cli://open`, `q` and `repo`, 5,000-char limit, never auto-executes
- [shadcn MCP server](https://ui.shadcn.com/docs/mcp) — third-party registries via `components.json` namespaces
- [Cursor deeplinks](https://cursor.com/docs/reference/deeplinks)
- [Claude Code plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Anthropic Agent Skills](https://github.com/anthropics/skills)
- [Preparing APIs for AI agents](https://buildwithfern.com/post/prepare-apis-documentation-ai-agent-consumption) — why human-only docs cause hallucinated props
- [AI hallucinations and documentation](https://www.mintlify.com/library/ai-hallucinations)
