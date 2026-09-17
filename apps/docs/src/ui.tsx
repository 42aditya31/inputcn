import { useState, type ReactNode } from "react"

import { installCmd } from "./site.js"

/* ---------------------------------------------------------------- *
 * Syntax highlighting
 *
 * Deliberately tiny. A docs page needs strings, comments and component
 * names to be distinguishable; it does not need a parser, and it certainly
 * does not need to ship a 200 kB grammar to get one.
 * ---------------------------------------------------------------- */

const KEYWORDS =
  /\b(?:import|from|export|const|let|function|return|await|async|type|interface|new|default)\b/

const TOKEN =
  /(\/\/[^\n]*|\{\/\*[\s\S]*?\*\/\})|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Z][\w.]*)/g

function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0

  while ((m = TOKEN.exec(code)) !== null) {
    if (m.index > last) out.push(plain(code.slice(last, m.index), out.length))
    const cls = m[1] ? "c" : m[2] ? "s" : "t"
    out.push(
      <span key={out.length} className={cls}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < code.length) out.push(plain(code.slice(last), out.length))
  return out
}

/** Keywords are only highlighted outside strings and comments. */
function plain(text: string, key: number): ReactNode {
  // Wrapping the pattern in a capture group makes split() interleave the
  // matches, so every odd index is a keyword.
  const parts = text.split(new RegExp(`(${KEYWORDS.source})`, "g"))
  return (
    <span key={key}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="k">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  )
}

export function Code({ code }: { code: string }) {
  return (
    <pre className="code">
      <code>{highlight(code)}</code>
    </pre>
  )
}

/* ---------------------------------------------------------------- *
 * Copy
 * ---------------------------------------------------------------- */

function useCopy(): [boolean, (text: string) => void] {
  const [done, setDone] = useState(false)

  function copy(text: string) {
    // Clipboard can be denied (insecure origin, permission). The text is on
    // screen and selectable, so there is nothing useful to fall back to.
    navigator.clipboard?.writeText(text).catch(() => {})
    setDone(true)
    window.setTimeout(() => setDone(false), 1400)
  }

  return [done, copy]
}

/** The hero command pill: the whole thing is the button. */
export function CopyCmd({ cmd }: { cmd: string }) {
  const [done, copy] = useCopy()
  return (
    <button className="cmd" type="button" onClick={() => copy(cmd)}>
      <span className="txt">
        <span className="p">$</span> {cmd}
      </span>
      <span className="tag">{done ? "copied" : "copy"}</span>
    </button>
  )
}

/** The install bar on a docs page, with a package-manager switch. */
export function InstallBar({ registry, pkg }: { registry: string; pkg: string }) {
  const [tab, setTab] = useState<"shadcn" | "npm">("shadcn")
  const [done, copy] = useCopy()

  const cmd = tab === "shadcn" ? installCmd(registry) : `npm i ${pkg}`

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Install method">
        {(["shadcn", "npm"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="install">
        <code>
          <span className="p">$</span> {cmd}
        </code>
        <span className="sp" />
        <button type="button" onClick={() => copy(cmd)}>
          {done ? "copied" : "copy"}
        </button>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- *
 * Tables
 * ---------------------------------------------------------------- */

export function Table({
  cols,
  rows,
}: {
  cols: readonly string[]
  rows: (readonly ReactNode[])[]
}) {
  const two = cols.length === 2
  return (
    <div className={two ? "table two" : "table"} role="table">
      <div className="thead" role="row">
        {cols.map((c, i) => (
          <span key={i} role="columnheader">
            {c}
          </span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div className="trow" key={i} role="row">
          {r.map((cell, j) => (
            <span key={j} className={["a", "b", "c"][j] ?? "c"} role="cell">
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- *
 * Icons
 * ---------------------------------------------------------------- */

export function Sun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function Moon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

export function Menu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function Star() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.3l6.5-.9L12 2.5z" />
    </svg>
  )
}

export function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zm7 11l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
    </svg>
  )
}

export function Github() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.1 4.7 18.1 5 18.1 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
    </svg>
  )
}
