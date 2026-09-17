import { useEffect } from "react"

import { canonicalFor, jsonLdFor, keywordsFor, metaFor } from "./seo.js"
import { SITE_URL, TWITTER } from "./site.js"

/**
 * Keep the document head in step with the current route.
 *
 * The prerendered HTML already carries the correct tags for the entry page, so
 * this exists for client-side navigation — a crawler that renders JavaScript,
 * and a human sharing a link they navigated to rather than landed on.
 *
 * This is a real effect, not a disguised derivation: `document.head` is an
 * external system, and synchronising with one is exactly what useEffect is for.
 */
export function useHead(path: string): void {
  useEffect(() => {
    const meta = metaFor(path)
    const url = canonicalFor(path)

    document.title = meta.title

    setMeta("name", "description", meta.description)
    setMeta("name", "keywords", keywordsFor(meta))
    setLink("canonical", url)

    setMeta("property", "og:title", meta.title)
    setMeta("property", "og:description", meta.description)
    setMeta("property", "og:url", url)
    setMeta("property", "og:type", meta.kind === "home" ? "website" : "article")

    setMeta("name", "twitter:title", meta.title)
    setMeta("name", "twitter:description", meta.description)
    setMeta("name", "twitter:card", "summary_large_image")
    setMeta("name", "twitter:creator", TWITTER)

    setMeta("name", "robots", meta.path === "/404" ? "noindex" : "index, follow")

    setJsonLd(jsonLdFor(meta))
  }, [path])
}

function setMeta(attr: "name" | "property", key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function setLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", rel)
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
}

/** One managed script tag, replaced wholesale rather than accumulated. */
function setJsonLd(blocks: object[]): void {
  const id = "inputcn-jsonld"
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement("script")
    el.id = id
    el.type = "application/ld+json"
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(blocks.length === 1 ? blocks[0] : blocks)
}

export { SITE_URL }
