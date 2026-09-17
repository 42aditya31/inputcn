import { useCallback, useInsertionEffect, useRef } from "react"

/**
 * A callback whose identity never changes but which always sees the latest
 * props. Lets us attach handlers without making every consumer wrap their
 * `onChange` in `useCallback` — and without stale closures.
 *
 * `useInsertionEffect` runs before layout effects, so the ref is current by
 * the time any effect or event handler could read it.
 * (advanced-use-latest / advanced-event-handler-refs.)
 */
export function useEvent<A extends unknown[], R>(
  fn: ((...args: A) => R) | undefined,
): (...args: A) => R | undefined {
  const ref = useRef<typeof fn>(fn)

  useInsertionEffect(() => {
    ref.current = fn
  })

  return useCallback((...args: A) => ref.current?.(...args), [])
}

/** Read-only access to the latest value without subscribing to it. */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value)
  useInsertionEffect(() => {
    ref.current = value
  })
  return ref
}
