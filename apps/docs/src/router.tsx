import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react"

/**
 * A router, at the size this site needs one.
 *
 * Twenty-six static routes, no loaders, no nested outlets, no data layer.
 * The History API plus useSyncExternalStore is the whole implementation, and
 * it keeps the docs site honest about the "no runtime dependencies" line it
 * prints in its own hero.
 */

const listeners = new Set<() => void>()

/**
 * The path being prerendered. Only ever set by the build-time renderer, which
 * runs one route at a time in a single-threaded process, so a module-level
 * value is safe here in a way it would not be in a long-lived server.
 */
let serverPath = "/"

export function setServerPath(path: string): void {
  serverPath = path
}

function emit() {
  for (const l of listeners) l()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener("popstate", cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("popstate", cb)
  }
}

/** Trailing slashes are stripped so /docs/ and /docs are one route. */
function normalise(path: string): string {
  const clean = path.replace(/\/+$/, "")
  return clean === "" ? "/" : clean
}

export function navigate(to: string) {
  if (normalise(to) === normalise(location.pathname)) return
  history.pushState(null, "", to)
  // Scrolling belongs here rather than in an effect: it is a consequence of
  // the click, not of the render that follows it.
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  emit()
}

export function usePath(): string {
  return useSyncExternalStore(
    subscribe,
    () => normalise(location.pathname),
    () => serverPath,
  )
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    // Modified clicks, middle clicks and anything already handled stay with
    // the browser, so "open in new tab" keeps working.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return
    }
    e.preventDefault()
    navigate(to)
  }

  return <a href={to} onClick={handle} {...rest} />
}
