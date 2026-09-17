import { useState } from "react"

import { Link, usePath } from "../router.js"
import { REPO_URL } from "../site.js"
import { Github, Menu, Moon, Star, Sun } from "../ui.js"
import { useStars } from "../use-stars.js"
import { useTheme } from "../use-theme.js"

const LINKS = [
  ["Home", "/"],
  ["Docs", "/docs"],
  ["Components", "/components"],
  ["Blocks", "/blocks"],
  ["Form contract", "/docs/props-contract"],
  ["Validation", "/docs/two-modes"],
] as const

/** A link is "on" when the current path is inside its section. */
function isOn(href: string, path: string): boolean {
  if (href === "/") return path === "/"
  if (href === "/docs") return path.startsWith("/docs")
  if (href === "/components") return path.startsWith("/components")
  if (href === "/blocks") return path.startsWith("/blocks")
  return path === href
}

export function Nav() {
  const path = usePath()
  const [theme, setTheme] = useTheme()
  const [open, setOpen] = useState(false)
  const stars = useStars()

  const next = theme === "dark" ? "light" : "dark"

  return (
    <>
      <header className="nav">
        <div className="nav-in">
          <Link className="brand" to="/" aria-label="inputcn home">
            <b>inputcn</b>
            <span>v1.0</span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.slice(1).map(([label, href]) => (
              <Link key={href} to={href} {...(isOn(href, path) ? { "data-on": "" } : {})}>
                {label}
              </Link>
            ))}
          </nav>

          <span className="nav-sp" />

          <div className="nav-end">
            <button
              className="nav-btn icon"
              type="button"
              onClick={() => setTheme(next)}
              aria-label={`Switch to ${next} theme`}
              title={`Switch to ${next} theme`}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>

            <a
              className="nav-btn icon"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub repository"
              title="GitHub repository"
            >
              <Github />
            </a>

            {/* Straight to the repo's Star action. GitHub has no URL that
                stars on your behalf — that would be a one-click CSRF — so this
                is as close as it gets: the repo page, with Star in view. */}
            <a
              className="nav-btn star"
              href={`${REPO_URL}#-star`}
              target="_blank"
              rel="noreferrer noopener"
              title="Star inputcn on GitHub"
            >
              <Star />
              <span>Star</span>
              {stars !== null ? <b>{stars.toLocaleString("en-GB")}</b> : null}
            </a>

            <button
              className="nav-btn icon burger"
              type="button"
              aria-expanded={open}
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>

      <div className="drawer" {...(open ? { "data-open": "" } : {})}>
        {LINKS.map(([label, href]) => (
          <Link key={href} to={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </div>
    </>
  )
}
