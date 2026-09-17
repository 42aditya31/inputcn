import { useState } from "react"

export type Theme = "light" | "dark"

const KEY = "inputcn-theme"

/**
 * The inline script in index.html has already set `data-theme` before first
 * paint, so the initial value is read back from the DOM rather than recomputed.
 * That keeps this hook effect-free: the attribute is written in the event
 * handler, which is where the change actually happens.
 */
export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, set] = useState<Theme>(
    () => (document.documentElement.dataset["theme"] as Theme | undefined) ?? "dark",
  )

  function apply(next: Theme) {
    document.documentElement.dataset["theme"] = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Private mode / blocked storage. The theme still applies for this visit.
    }
    set(next)
  }

  return [theme, apply]
}
