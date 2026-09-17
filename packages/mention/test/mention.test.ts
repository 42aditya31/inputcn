import { describe, expect, it } from "vitest"

import {
  activeQuery,
  applyMention,
  extractIds,
  initials,
  makeValue,
  search,
  type Person,
} from "../src/mention.js"

const PEOPLE: Person[] = [
  { id: "u1", name: "Ada Lovelace", handle: "ada" },
  { id: "u2", name: "Grace Hopper", handle: "grace" },
  { id: "u3", name: "Alan Turing", handle: "alan" },
  { id: "u4", name: "Ada Byron", handle: "adabyron" },
]

describe("activeQuery", () => {
  it("finds the query the caret is inside", () => {
    const text = "hey @ad"
    expect(activeQuery(text, 7)).toEqual({ start: 4, end: 7, query: "ad" })
  })

  it("opens on a bare @", () => {
    expect(activeQuery("hey @", 5)?.query).toBe("")
  })

  it("does not trigger inside an email address", () => {
    // "user@example.com" must not open a picker.
    expect(activeQuery("user@example.com", 16)).toBeNull()
  })

  it("does not trigger once whitespace intervenes", () => {
    expect(activeQuery("email me @ 5pm", 14)).toBeNull()
  })

  it("returns null when there is no @ before the caret", () => {
    expect(activeQuery("hello", 5)).toBeNull()
  })
})

describe("search", () => {
  it("ranks prefix matches above substring matches", () => {
    const results = search(PEOPLE, "ada")
    expect(results[0]?.handle).toBe("ada")
  })

  it("matches on name as well as handle", () => {
    expect(search(PEOPLE, "hopper")[0]?.id).toBe("u2")
  })

  it("returns everyone for an empty query", () => {
    expect(search(PEOPLE, "")).toHaveLength(4)
  })

  it("respects the limit", () => {
    expect(search(PEOPLE, "", 2)).toHaveLength(2)
  })
})

describe("applyMention", () => {
  it("replaces the query and leaves a trailing space", () => {
    const text = "hey @ad"
    const q = activeQuery(text, 7)!
    const out = applyMention(text, q, PEOPLE[0]!)
    expect(out.text).toBe("hey @ada ")
    expect(out.caret).toBe(9)
  })

  it("preserves text after the caret", () => {
    const text = "hey @ad, how are you"
    const q = activeQuery(text, 7)!
    expect(applyMention(text, q, PEOPLE[0]!).text).toBe("hey @ada , how are you")
  })
})

describe("extractIds", () => {
  it("finds mentions in the text", () => {
    expect(extractIds("hey @ada and @grace", PEOPLE)).toEqual(["u1", "u2"])
  })

  it("returns first-appearance order", () => {
    expect(extractIds("@grace then @ada", PEOPLE)).toEqual(["u2", "u1"])
  })

  it("de-duplicates", () => {
    expect(extractIds("@ada @ada @ada", PEOPLE)).toEqual(["u1"])
  })

  it("does not let a short handle shadow a longer one", () => {
    // "@adabyron" must resolve to u4, not match "@ada" first.
    expect(extractIds("hi @adabyron", PEOPLE)).toEqual(["u4"])
  })

  it("requires a word boundary", () => {
    expect(extractIds("email ada@example.com", PEOPLE)).toEqual([])
    expect(extractIds("@adaX", PEOPLE)).toEqual([])
  })

  it("matches a handle followed by punctuation", () => {
    expect(extractIds("thanks @ada!", PEOPLE)).toEqual(["u1"])
    expect(extractIds("@ada, @grace.", PEOPLE)).toEqual(["u1", "u2"])
  })

  it("returns nothing for empty text", () => {
    expect(extractIds("", PEOPLE)).toEqual([])
  })
})

describe("makeValue", () => {
  it("recomputes ids so editing a mention out removes the notification", () => {
    const before = makeValue("hey @ada and @grace", PEOPLE)
    expect(before.ids).toEqual(["u1", "u2"])

    const after = makeValue("hey @ada", PEOPLE)
    expect(after.ids).toEqual(["u1"])
  })
})

describe("initials", () => {
  it("takes first and last", () => {
    expect(initials("Ada Lovelace")).toBe("AL")
    expect(initials("Katherine Coleman Goble Johnson")).toBe("KJ")
  })

  it("handles a single name", () => {
    expect(initials("Prince")).toBe("PR")
  })

  it("never returns empty", () => {
    expect(initials("")).toBe("?")
    expect(initials("   ")).toBe("?")
  })
})
