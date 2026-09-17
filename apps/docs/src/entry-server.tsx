import { renderToString } from "react-dom/server"

import App from "./App.js"
import { setServerPath } from "./router.js"
import { canonicalFor, jsonLdFor, keywordsFor, metaFor } from "./seo.js"
import { SITE_URL, TWITTER } from "./site.js"

/**
 * Build-time rendering, used by scripts/prerender.mjs.
 *
 * Not a server. This runs once per route during the build and writes static
 * HTML, so a crawler — or anything that does not execute JavaScript — gets the
 * real page instead of an empty div.
 */

export interface Rendered {
  html: string
  head: string
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function render(
  path: string,
  ogImage = "og.svg",
  ogWidth = 1200,
  ogHeight = 630,
): Rendered {
  setServerPath(path)

  const meta = metaFor(path)
  const url = canonicalFor(path)
  const image = `${SITE_URL}/${ogImage}`

  const head = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="keywords" content="${esc(keywordsFor(meta))}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="index, follow" />`,

    `<meta property="og:site_name" content="inputcn" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:type" content="${meta.kind === "home" ? "website" : "article"}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="${ogWidth}" />`,
    `<meta property="og:image:height" content="${ogHeight}" />`,

    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:creator" content="${esc(TWITTER)}" />`,

    `<script type="application/ld+json" id="inputcn-jsonld">${JSON.stringify(
      jsonLdFor(meta),
    ).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ")

  return { html: renderToString(<App />), head }
}

/** The paths the build writes out. */
export { ROUTES } from "./seo.js"
