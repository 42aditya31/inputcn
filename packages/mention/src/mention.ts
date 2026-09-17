/**
 * Mention parsing. Framework-free.
 *
 * Canonical value is `{ text, ids }` — the text as written, plus the ids of
 * everyone actually mentioned in it. Both matter: the text is what you render,
 * the ids are who you notify, and deriving one from the other at send time is
 * how people get notified for a mention that was edited away.
 */

import { scrub } from "@inputcn/core/paste"

export interface Person {
  id: string
  /** Display name. */
  name: string
  /** The @handle, without the "@". */
  handle: string
  /** Optional secondary line — team, role, email. */
  detail?: string
  /** Optional badge, e.g. "Owner". */
  badge?: string
}

export interface MentionValue {
  text: string
  /** Ids present in `text`, in first-appearance order, de-duplicated. */
  ids: string[]
}

export const EMPTY_MENTION: MentionValue = Object.freeze({ text: "", ids: [] })

/** Where an active `@query` sits in the text, if the caret is inside one. */
export interface ActiveQuery {
  /** Index of the "@". */
  start: number
  /** Index just past the query, i.e. the caret. */
  end: number
  /** The text between "@" and the caret. */
  query: string
}

// Handles are conservative on purpose: letters, digits, dot, dash, underscore.
// Anything looser starts swallowing punctuation that ends a sentence.
const HANDLE_CHAR = /[\w.-]/

/**
 * Find the mention query the caret is currently inside.
 *
 * Returns null when the caret is not after an "@", or when whitespace
 * intervenes — so "email me @ 5pm" never opens the picker.
 */
export function activeQuery(text: string, caret: number): ActiveQuery | null {
  const at = text.lastIndexOf("@", Math.max(0, caret - 1))
  if (at === -1) return null

  // An "@" only starts a mention at a word boundary, so "user@example.com"
  // does not trigger the picker.
  if (at > 0 && HANDLE_CHAR.test(text[at - 1]!)) return null

  const between = text.slice(at + 1, caret)
  if (between.length > 0 && !/^[\w.-]*$/.test(between)) return null

  return { start: at, end: caret, query: between }
}

/** Filter people by name or handle, ranked so prefix matches come first. */
export function search(people: readonly Person[], query: string, limit = 8): Person[] {
  const q = query.trim().toLowerCase()
  if (!q) return people.slice(0, limit)

  const prefix: Person[] = []
  const contains: Person[] = []

  for (const p of people) {
    const name = p.name.toLowerCase()
    const handle = p.handle.toLowerCase()
    if (handle.startsWith(q) || name.startsWith(q)) prefix.push(p)
    else if (handle.includes(q) || name.includes(q)) contains.push(p)
  }

  return [...prefix, ...contains].slice(0, limit)
}

/** Replace the active query with a chosen handle. Returns text and new caret. */
export function applyMention(
  text: string,
  active: ActiveQuery,
  person: Person,
): { text: string; caret: number } {
  const before = text.slice(0, active.start)
  const after = text.slice(active.end)
  // A trailing space is what lets the user keep typing without it becoming
  // part of the handle.
  const inserted = `@${person.handle} `
  return { text: before + inserted + after, caret: before.length + inserted.length }
}

/**
 * True when position `i` ends a handle.
 *
 * Handles may contain "." and "-" (first.last), which makes a trailing one
 * ambiguous: in "@grace." the dot is sentence punctuation, but in "@first.last"
 * it is part of the handle. Resolve it by looking one further — a dot or dash
 * NOT followed by a word character is punctuation.
 */
function boundaryAfter(text: string, i: number): boolean {
  const ch = text[i]
  if (ch === undefined) return true
  if (!HANDLE_CHAR.test(ch)) return true
  if (ch === "." || ch === "-") {
    const next = text[i + 1]
    return next === undefined || !/\w/.test(next)
  }
  return false
}

/**
 * Extract the ids mentioned in text.
 *
 * Handles are matched at word boundaries and de-duplicated, so editing a
 * mention out of the text removes the notification with it.
 */
export function extractIds(text: string, people: readonly Person[]): string[] {
  if (!text) return []

  // Longest handle first, so "@ada" inside "@adalovelace" cannot shadow it.
  const sorted = [...people].sort((a, b) => b.handle.length - a.handle.length)

  const found: Array<{ id: string; at: number }> = []
  const claimed: Array<[number, number]> = []

  for (const p of sorted) {
    const needle = `@${p.handle}`
    let from = 0
    for (;;) {
      const at = text.indexOf(needle, from)
      if (at === -1) break
      from = at + needle.length

      const beforeOk = at === 0 || !HANDLE_CHAR.test(text[at - 1]!)
      const afterOk = boundaryAfter(text, at + needle.length)
      const overlaps = claimed.some(([s, e]) => at < e && at + needle.length > s)

      if (beforeOk && afterOk && !overlaps) {
        claimed.push([at, at + needle.length])
        found.push({ id: p.id, at })
      }
    }
  }

  // First-appearance order, de-duplicated.
  found.sort((a, b) => a.at - b.at)
  const seen = new Set<string>()
  const out: string[] = []
  for (const f of found) {
    if (!seen.has(f.id)) {
      seen.add(f.id)
      out.push(f.id)
    }
  }
  return out
}

/** Build a value from text, recomputing ids so the two can never disagree. */
export function makeValue(text: string, people: readonly Person[]): MentionValue {
  return { text, ids: extractIds(text, people) }
}

/** Initials for an avatar. "Ada Lovelace" → "AL". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts.at(-1)![0]!).toUpperCase()
}

/** Smart paste — scrub clipboard junk, keep the text as written. */
export function parsePastedMention(
  input: string,
  people: readonly Person[],
): MentionValue | null {
  const text = scrub(input)
  if (!text) return null
  return makeValue(text, people)
}
