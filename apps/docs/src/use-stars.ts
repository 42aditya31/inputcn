import { useEffect, useState } from "react"

import { REPO_SLUG } from "./site.js"

const KEY = "inputcn-stars"

/**
 * The repository's star count, for the Star button.
 *
 * Fetched from the unauthenticated GitHub API, which allows 60 requests an
 * hour per IP. That is plenty for a docs site and nowhere near guaranteed, so
 * every failure path ends the same way: return null, and the button renders
 * without a count rather than with a wrong one or a spinner that never stops.
 *
 * Cached in sessionStorage so navigating the site costs one request per visit,
 * not one per page.
 */
export function useStars(): number | null {
  const [stars, setStars] = useState<number | null>(() => {
    try {
      const cached = sessionStorage.getItem(KEY)
      return cached ? Number(cached) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (stars !== null) return

    const controller = new AbortController()

    fetch(`https://api.github.com/repos/${REPO_SLUG}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { stargazers_count?: number } | null) => {
        const n = data?.stargazers_count
        if (typeof n !== "number") return
        setStars(n)
        try {
          sessionStorage.setItem(KEY, String(n))
        } catch {
          // Private mode. The count still shows for this page.
        }
      })
      .catch(() => {
        // Rate limited, offline, or blocked. No count, no error, no retry.
      })

    return () => controller.abort()
  }, [stars])

  return stars
}
