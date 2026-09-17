#!/usr/bin/env node
/**
 * Turn the SPA into 27 real HTML pages.
 *
 * Before this ran, every route served the same `<div id="root"></div>` with
 * the same title. A crawler saw an empty page, so none of the component pages
 * could rank for anything, and a shared link had no preview.
 *
 * Runs after `vite build` and `vite build --ssr`. For each route it renders the
 * app to a string, injects it plus the route's head tags into the client
 * index.html, and writes the file at the path the route is served from.
 *
 * The client still boots with createRoot, not hydrateRoot — deliberately.
 * Several demos derive from `new Date()` (CronInput previews the next runs),
 * so hydration would report a mismatch on every load. Replacing the markup
 * costs one frame and removes a whole class of noise.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = resolve(HERE, "..")
const DIST = join(APP, "dist")
const SSR = join(APP, "dist-ssr", "entry-server.js")

const ROOT = resolve(APP, "../..")
const CONFIG = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8"))
const SITE = CONFIG.siteUrl

const template = readFileSync(join(DIST, "index.html"), "utf8")
const { render, ROUTES } = await import(pathToFileURL(SSR).href)

if (!template.includes("<div id=\"root\"></div>")) {
  console.error("index.html does not contain the expected root div; refusing to guess.")
  process.exit(1)
}

/**
 * Social cards.
 *
 * X and Facebook do not render SVG in an og:image — they want PNG or JPEG. The
 * designed card ships as public/og.svg, and a PNG export of it is the one
 * asset this build cannot produce on its own. Prefer the PNG when it is there
 * and say so loudly when it is not, rather than silently shipping a card that
 * will not render.
 */
const hasPng = existsSync(join(DIST, "og.png"))
const ogImage = hasPng ? "og.png" : "og.svg"

/**
 * Read the real pixel size out of the PNG header rather than declaring one.
 * Announcing dimensions that do not match the file makes some platforms crop
 * it oddly and others skip the card entirely, and the mismatch is invisible
 * until someone shares a link.
 */
function pngSize(path) {
  const b = readFileSync(path)
  if (b.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), bytes: b.length }
}

const og = hasPng ? pngSize(join(DIST, "og.png")) : null
const ogSize = og ?? { width: 1200, height: 630, bytes: 0 }

// The favicon is requested on literally every page view, so its weight is the
// one asset size that is never amortised.
const faviconPath = join(DIST, "favicon.png")
const favicon = existsSync(faviconPath) ? pngSize(faviconPath) : null

let written = 0

for (const route of ROUTES) {
  const { html, head } = render(route.path, ogImage, ogSize.width, ogSize.height)

  const page = template
    // Everything the build put in <head> stays — icons, manifest, theme-color.
    // Only the fallback title and description are dropped, because the route
    // supplies its own and two of either is worse than none.
    //
    // The attribute can sit on its own line in the source template, so the
    // pattern cannot assume the tag is written on one line.
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta\s[^>]*name="description"[^>]*>\s*/, "")
    .replace("</head>", `  ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)

  const out =
    route.path === "/"
      ? join(DIST, "index.html")
      : join(DIST, route.path.slice(1), "index.html")

  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, page, "utf8")
  written++
}

/* ------------------------------------------------------------------ *
 * sitemap.xml — generated from the same route list, so it cannot list
 * a page that does not exist or miss one that does.
 * ------------------------------------------------------------------ */

const today = new Date().toISOString().slice(0, 10)

const priority = (path) => {
  if (path === "/") return "1.0"
  if (path === "/components") return "0.9"
  if (path.startsWith("/components/")) return "0.8"
  return "0.7"
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  (r) => `  <url>
    <loc>${SITE}${r.path === "/" ? "" : r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority(r.path)}</priority>
  </url>`,
).join("\n")}
</urlset>
`

writeFileSync(join(DIST, "sitemap.xml"), sitemap, "utf8")

/* ------------------------------------------------------------------ *
 * robots.txt
 * ------------------------------------------------------------------ */

writeFileSync(
  join(DIST, "robots.txt"),
  `User-agent: *
Allow: /

# The registry is for package managers, not for search results.
Disallow: /r/

Sitemap: ${SITE}/sitemap.xml
`,
  "utf8",
)

console.log(
  `prerendered ${written} routes → dist/` +
    `\n  sitemap.xml (${ROUTES.length} urls)` +
    `\n  robots.txt` +
    `\n  og:image → /${ogImage}`,
)

if (og && (og.width !== 1200 || og.height !== 630)) {
  console.warn(
    [
      "",
      `  ! public/og.png is ${og.width}x${og.height}; the standard card is 1200x630.`,
      "    The tags declare the real size so it will still render, but an off-ratio",
      "    card is cropped differently on each platform.",
      "",
    ].join("\n"),
  )
}

if (og && og.bytes > 1_000_000) {
  console.warn(
    [
      `  ! public/og.png is ${(og.bytes / 1024 / 1024).toFixed(1)} MB. Under 300 KB is`,
      "    plenty at this size, and some scrapers give up on large images.",
      "",
    ].join("\n"),
  )
}

if (favicon && favicon.bytes > 100_000) {
  console.warn(
    [
      `  ! public/favicon.png is ${favicon.width}x${favicon.height} and`,
      `    ${(favicon.bytes / 1024 / 1024).toFixed(1)} MB. It is only the fallback — icon.svg`,
      "    is served to current browsers — but Safari still downloads it for the",
      "    home-screen icon. A 180x180 export under 20 KB would be plenty.",
      "",
    ].join("\n"),
  )
}

if (!hasPng) {
  console.warn(
    "\n  ! public/og.png is missing, so social cards fall back to og.svg.\n" +
      "    X and Facebook do not render SVG, so they will show no image.\n" +
      "    Export public/og.svg to a 1200x630 PNG and save it as public/og.png.\n",
  )
}
