import type { ReactNode } from "react"

import { NAV, neighbours } from "../content/nav.js"
import { Link, usePath } from "../router.js"

export interface TocEntry {
  id: string
  label: string
}

/**
 * The three-column docs shell: section nav, the page, and its table of
 * contents. The TOC links are plain anchors so the browser handles the jump
 * and the URL keeps the hash — a router has no business in an in-page scroll.
 */
export function DocsLayout({
  eyebrow,
  title,
  lede,
  toc,
  children,
  note,
}: {
  eyebrow: string
  title: string
  lede: ReactNode
  toc: TocEntry[]
  children: ReactNode
  note?: ReactNode
}) {
  const path = usePath()
  const { prev, next } = neighbours(path)

  return (
    <div className="docs">
      <nav className="docs-side" aria-label="Documentation">
        {NAV.map((g) => (
          <div className="grp" key={g.group}>
            <div className="eyebrow">{g.group}</div>
            <div className="links">
              {g.items.map((i) => (
                <Link
                  key={i.href}
                  to={i.href}
                  {...(i.href === path ? { "aria-current": "page" as const } : {})}
                >
                  {i.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <main className="docs-main">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="doc-lede">{lede}</p>

        {children}

        {note ? <p className="doc-note">{note}</p> : null}

        <div className="pager">
          {prev ? (
            <Link to={prev.href}>
              <i>←</i>
              <span>{prev.label}</span>
            </Link>
          ) : null}
          {next ? (
            <Link className="next" to={next.href}>
              <span>{next.label}</span>
              <i>→</i>
            </Link>
          ) : null}
        </div>
      </main>

      <aside className="docs-toc">
        <div className="in">
          <div className="eyebrow">On this page</div>
          <div className="links">
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`}>
                {t.label}
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
