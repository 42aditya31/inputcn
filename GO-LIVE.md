# Go live — step by step

> Plain-English playbook for putting inputcn online so other people can use it.
> Follow it top to bottom. Do not skip **Step 3** — nothing works without it.

**Progress**

| | Step | State |
|---|---|---|
| ✅ | Code on GitHub | <https://github.com/42aditya31/inputcn> |
| ✅ | 1. Website deployed | <https://input-cn.vercel.app> |
| ✅ | 2. URLs pointed at it | `site.config.json` |
| ⬜ | **3. Publish to npm** | **You are here. Installs fail until this is done.** |
| ⬜ | 4. Test from a fresh project | |
| ⬜ | 5. Repo polish | |
| ⬜ | 6. Screen readers, then announce | |

**Where you are going:** someone types one command in their terminal and gets
your component in their project.

```
npx shadcn@latest add https://input-cn.vercel.app/r/phone-input.json
```

---

## The picture, in one minute

Three separate things have to be online. They are **not** the same thing, and
people mix them up:

| Thing | What it is | Where it lives | Needed for |
|---|---|---|---|
| **The website** | Your docs site | Vercel | People finding and reading about it |
| **The registry** | 12 `.json` files describing each component | The same Vercel site, at `/r/` | The `npx shadcn add` command |
| **`@inputcn/core`** | One real npm package | npm | The copied component actually running |

The website and the registry go up together — the registry files are served by
the same site. `@inputcn/core` is separate and goes to npm.

**Why `@inputcn/core` matters:** when someone runs `npx shadcn add`, the
component file is *copied into their repo*. That copied file starts with
`import { useField } from "@inputcn/core"`. If that package is not on npm,
their build fails immediately. **Deploying the website alone is not enough.**

---

## Step 1 — Deploy the website to Vercel ✅ DONE

> Live at <https://input-cn.vercel.app>. Kept here for when you redeploy or
> move it. **Time: 5 minutes. Cost: free.**

1. Go to **[vercel.com](https://vercel.com)** and sign in **with GitHub**.
   Use the **`42aditya31`** account, not the work one.
2. Click **Add New… → Project**.
3. Find **`inputcn`** in the list and click **Import**.
   - If you do not see it: click **Adjust GitHub App Permissions** and give
     Vercel access to the repo.
4. **Fix two things on the settings screen.** Vercel guesses, and it guesses
   wrong here, because this repo has two apps in it:

   | Field | Vercel suggests | Change it to |
   |---|---|---|
   | **Root Directory** | `apps/demo` | **`./`** — the repo root. Click **Edit**, then pick the top-level folder. |
   | **Project Name** | `inputcn-demo` | **`inputcn`** — this decides your URL. |
   | **Application Preset** | Vite | **Other** — but if you set Root Directory correctly, `vercel.json` overrides this anyway. |

   > **Why root and not `apps/docs`?** It is a pnpm workspace. The docs app
   > imports the component packages from `packages/`, which only exist if the
   > install runs from the root. `vercel.json` then points Vercel at
   > `apps/docs/dist` for the output.
   >
   > **`apps/demo` is the internal dev harness, not the docs site.** Deploying
   > it would publish the scratch page instead of your documentation.

5. Click **Deploy**.
6. Wait about two minutes.

You will get a URL like **`https://inputcn.vercel.app`** or
`https://inputcn-42aditya31.vercel.app`. **Copy it.** You need it in Step 2.

### Check it worked

Open these three in your browser:

| URL | You should see |
|---|---|
| `https://input-cn.vercel.app` | The homepage, with working inputs |
| `https://input-cn.vercel.app/components/phone-input` | A docs page — **not** a 404 |
| `https://input-cn.vercel.app/r/phone-input.json` | Raw JSON text |

> **If the second one 404s**, the routing rewrite is not being applied. Check
> that `vercel.json` is in the repo root and redeploy.

---

## Step 2 — Point the project at your new URL ✅ DONE

> Already run as `pnpm site-url https://input-cn.vercel.app`. Kept here because
> you run the same command again the day you buy a domain.

The project used to say `https://inputcn.dev`, which you do not own, so every
install command on the site was wrong.

**You do not have to hunt for them.** One command changes all of it:

```bash
pnpm site-url https://input-cn.vercel.app
```

Use *your* real URL. It will print what it changed — around 10 places, plus it
rebuilds all 12 registry files.

Then push it:

```bash
git add -A
git commit -m "chore: point at the live URL"
git push
```

Vercel redeploys on its own within a minute or two.

### What that command actually touched

You never need to edit these by hand, but so you know:

| File | Why |
|---|---|
| `site.config.json` | The one source of truth. Everything else reads this. |
| `README.md` | Static text, cannot read a config at runtime |
| `public/llms.txt` | Same |
| `public/r/*.json` | Rebuilt, because they contain full URLs inside |
| `packages/core/src/warn.ts` | Dev-mode warnings link to the docs. It is a published package, so it cannot read the config at runtime |

The website itself (hero, docs pages, install bars) reads `site.config.json`
directly at build time, so it updates with no find-and-replace at all.

> **Later, if you buy a domain:** point it at Vercel, then run
> `pnpm site-url https://inputcn.dev` and push. Same one command.

---

## Step 3 — Publish `@inputcn/core` to npm

**This is the step that makes installs actually work. Do not skip it.**

### 3a. Make an npm account

1. Sign up at **[npmjs.com](https://www.npmjs.com/signup)**.
2. Turn on **two-factor authentication** — npm requires it to publish.
3. Create the **organisation** named `inputcn`:
   **[npmjs.com/org/create](https://www.npmjs.com/org/create)** → pick the
   **free** plan. This is what lets you publish `@inputcn/...` names.

### 3b. Log in from your terminal

```bash
npm login
```

Check it worked:

```bash
npm whoami
```

### 3c. Use `pnpm publish`, never `npm publish`

**This is the single most important line in this file.**

The twelve component packages depend on core like this:

```json
"dependencies": { "@inputcn/core": "workspace:*" }
```

`workspace:*` is a **pnpm-only** instruction meaning "the copy in this repo".
It is not valid on npm.

- `pnpm publish` **rewrites it** to a real version (`^0.1.0`) as it packs.
- `npm publish` **does not**. It uploads `"workspace:*"` literally, and every
  single install fails with `No matching version found for @inputcn/core@workspace:*`.

You would not find out until a stranger tried to install it.

### 3d. Publish everything, in the right order

From the repo root:

```bash
# 1. Everything green first. Publishing is not undoable.
pnpm test
pnpm typecheck
pnpm build

# 2. See exactly what would be uploaded, without uploading it
pnpm -r --filter "./packages/*" publish --dry-run --no-git-checks
```

Read that output. Check that `dist/` files are listed and that `src/` is not.

Then, for real:

```bash
pnpm -r --filter "./packages/*" publish --no-git-checks
```

`-r` walks every package **in dependency order**, so core goes up before the
packages that need it. That ordering is why you do this from the root rather
than one folder at a time.

`--access public` is no longer needed — every `package.json` now carries
`"publishConfig": { "access": "public" }`.

> `--no-git-checks` skips pnpm's "are you on a clean branch" guard. Drop it if
> you would rather it check; just commit everything first.

### 3e. Prove core is really up

```bash
npm view @inputcn/core version
npm view @inputcn/phone dependencies
```

The second one **must** show a real version like `^0.1.0`. If it says
`workspace:*`, it was published with `npm` instead of `pnpm` — unpublish
within 72 hours (`npm unpublish @inputcn/phone --force`), fix, and republish
under a bumped version.

---

## Step 4 — Test it like a stranger would

**Do not skip this.** It is the only way to know the whole chain works.

Make a brand-new project somewhere else on your machine:

```bash
cd ~/Desktop
npx create-next-app@latest test-inputcn
cd test-inputcn
npx shadcn@latest init
```

Now install your component:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/phone-input.json
```

Then use it in a page, and run `npm run dev`.

| If it fails with… | The problem is |
|---|---|
| `404` or `could not fetch` | Step 1 or 2 — the site or the URL |
| `Cannot find module '@inputcn/core'` | Step 3 — core is not on npm |
| The field renders but looks unstyled | You did not import `@inputcn/core/styles.css` |

**When this works, you are live.** Everything after this is polish.

---

## Step 5 — Make the repo look alive

Small things, big difference to whether anyone trusts it.

1. **On the GitHub repo page**, click the ⚙️ next to "About" and set:
   - **Description:** `The inputs shadcn/ui doesn't ship. Phone, currency, card, duration, cron, colour, file size, IP, percent, mask and mentions.`
   - **Website:** your Vercel URL
   - **Topics:** `react` `shadcn-ui` `input` `forms` `typescript`
     `react-hook-form` `zod` `accessibility` `ui-components`
2. **Turn on GitHub Actions** so tests run on every push (see below).
3. **Add a screenshot** of the site to the top of `README.md`. People decide in
   four seconds.

---

## Step 6 — Before you tell anyone (the pre-1.0 list)

You can launch without these. You should not *announce* without them.

- [ ] **Screen-reader pass.** NVDA on Windows, VoiceOver on Mac. This is the
      biggest honest gap in the project and the site currently says so out
      loud. Fixing it means you can stop saying it.
- [ ] **Contrast check in a real browser** across all four variants, both
      themes. `jsdom` cannot do this.
- [ ] **Freeze the API** and start honouring semver from that point.
- [ ] **Dual Zod test run** — 3 and 4.
- [ ] **Verify React 18** as well as 19.

Only then: Twitter/X, Reddit (r/reactjs), Hacker News "Show HN".

---

## Common problems

**Vercel build fails: "command not found: pnpm"**
Project Settings → General → Node.js Version → 20. Vercel picks pnpm up from
`pnpm-lock.yaml` automatically.

**Vercel build fails: "frozen-lockfile"**
The lockfile is out of date with `package.json`. Run `pnpm install` locally,
commit `pnpm-lock.yaml`, push.

**Vercel says: "Invalid request: `headers[0]` should NOT have additional
property `comment`"**
Something in `vercel.json` has a key Vercel does not recognise. JSON has no
comment syntax, so you cannot annotate entries inside `headers` or `rewrites`.
Only `source`, `destination`, `headers`, `has` and `missing` are allowed.

**Vercel deployed the wrong thing / the site looks like a scratch page**
Root Directory was left as `apps/demo`. That is the internal dev harness. Set
it to `./` in Project Settings → General → Root Directory, then redeploy.

**Refreshing a docs page gives a 404**
`vercel.json` is missing or not in the repo root. It contains the rewrite rule
that sends every unknown path to `index.html`.

**"402 Payment Required" when publishing**
The package is missing `"publishConfig": { "access": "public" }`, so npm is
treating a scoped package as private. All thirteen already have it; if you add
a new package, copy that field across.

**"403 Forbidden" when publishing**
Either you are not logged in (`npm whoami`), or the `inputcn` organisation does
not exist yet (Step 3a).

**A user reports `No matching version found for @inputcn/core@workspace:*`**
Something was published with `npm publish` instead of `pnpm publish`. Only pnpm
knows how to turn `workspace:*` into a real version number. Check with
`npm view @inputcn/phone dependencies`; if it shows `workspace:*`, unpublish
within 72 hours and republish with pnpm.

**Git pushes with the wrong GitHub account**
This repo is pinned to the personal account. Check with:
```bash
git config user.email      # aditya.sharma4231.in@gmail.com
git remote -v              # git@github.com-42aditya31:...
```
The `github.com-42aditya31` part is not a typo — it is the SSH alias from
`~/.ssh/config` that picks the right key.

---

## Optional — run the tests automatically

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

Then add the badge to the top of `README.md`:

```markdown
![CI](https://github.com/42aditya31/inputcn/actions/workflows/ci.yml/badge.svg)
```

---

## The whole thing, as a checklist

```
[x] 1. Import the repo on Vercel, deploy            (5 min)
[x] 2. pnpm site-url <your-url>, commit, push       (2 min)
[ ] 3. npm org + npm login + pnpm -r publish            (20 min)
[ ] 4. Install it into a fresh project and prove it works
[ ] 5. Repo description, topics, website link, screenshot
[ ] 6. Screen readers + contrast, THEN announce
```

Steps 1–4 are what "live" means. Everything else can wait.
