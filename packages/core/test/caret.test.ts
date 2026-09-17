import { describe, expect, it } from "vitest"

import {
  applyFormatted,
  countSignificantBefore,
  isDeletingEvent,
  nextCaretPosition,
  offsetAfterSignificant,
} from "../src/caret.js"

describe("countSignificantBefore", () => {
  it("counts digits to the left of the caret", () => {
    expect(countSignificantBefore("(415) 555-2671", 0)).toBe(0)
    expect(countSignificantBefore("(415) 555-2671", 1)).toBe(0) // "("
    expect(countSignificantBefore("(415) 555-2671", 4)).toBe(3) // "(415"
    expect(countSignificantBefore("(415) 555-2671", 14)).toBe(10)
  })

  it("clamps an out-of-range index", () => {
    expect(countSignificantBefore("123", 99)).toBe(3)
  })
})

describe("offsetAfterSignificant", () => {
  it("finds the offset after the nth digit", () => {
    expect(offsetAfterSignificant("(415) 555-2671", 3)).toBe(4)
    expect(offsetAfterSignificant("(415) 555-2671", 6)).toBe(9)
  })

  it("returns 0 for a count of zero so typing prepends", () => {
    expect(offsetAfterSignificant("(415) 555", 0)).toBe(0)
  })

  it("clamps past the end", () => {
    expect(offsetAfterSignificant("(415)", 99)).toBe(5)
  })
})

describe("nextCaretPosition", () => {
  it("keeps the caret after the same digit when a separator is inserted", () => {
    // User typed "4" at the end of "(41" → mask reformats to "(414) "
    const pos = nextCaretPosition({
      previousText: "(414",
      previousCaret: 4,
      nextText: "(414) ",
    })
    // 3 digits before caret → offset 4, then hop the ") " to the next slot
    expect(pos).toBe(6)
  })

  it("holds position when typing mid-string", () => {
    // "(415) 555-2671", caret after "5" at index 4, insert "9" → "(4195) 55-2671"…
    const pos = nextCaretPosition({
      previousText: "(4195) 555-267",
      previousCaret: 5, // 4 digits to the left: 4,1,9,5
      nextText: "(419) 555-5267",
    })
    expect(countSignificantBefore("(419) 555-5267", pos)).toBe(4)
  })

  it("does not hop separators when deleting", () => {
    // Backspacing "(415) " back to "(415" must leave the caret on the digit,
    // otherwise a second Backspace appears to do nothing.
    const pos = nextCaretPosition({
      previousText: "(415) ",
      previousCaret: 6,
      nextText: "(415",
      deleting: true,
    })
    expect(pos).toBe(4)
  })

  it("puts the caret at the start when nothing precedes it", () => {
    expect(
      nextCaretPosition({ previousText: "(415", previousCaret: 0, nextText: "(415) 5" }),
    ).toBe(1) // hops the "(" onto the first real slot
  })
})

describe("applyFormatted", () => {
  function mountInput(value: string, caret: number) {
    const el = document.createElement("input")
    el.value = value
    document.body.appendChild(el)
    el.focus()
    el.setSelectionRange(caret, caret)
    return el
  }

  it("rewrites the value and restores a meaningful caret", () => {
    const el = mountInput("(414", 4)
    applyFormatted(el, "(414) ")
    expect(el.value).toBe("(414) ")
    expect(el.selectionStart).toBe(6)
    el.remove()
  })

  it("is a no-op when the text is unchanged", () => {
    const el = mountInput("(415) 555-2671", 4)
    applyFormatted(el, "(415) 555-2671")
    expect(el.selectionStart).toBe(4)
    el.remove()
  })

  it("does not touch selection on an unfocused element", () => {
    const el = document.createElement("input")
    el.value = "123"
    document.body.appendChild(el)
    el.blur()
    applyFormatted(el, "1-23")
    expect(el.value).toBe("1-23")
    el.remove()
  })

  it("survives a full round trip of typing ten digits", () => {
    const el = mountInput("", 0)
    const mask = (d: string) => {
      const t = d.slice(0, 10)
      if (t.length <= 3) return t.length ? `(${t}` : ""
      if (t.length <= 6) return `(${t.slice(0, 3)}) ${t.slice(3)}`
      return `(${t.slice(0, 3)}) ${t.slice(3, 6)}-${t.slice(6)}`
    }
    for (const digit of "4155552671") {
      const caret = el.selectionStart ?? 0
      el.value = el.value.slice(0, caret) + digit + el.value.slice(caret)
      el.setSelectionRange(caret + 1, caret + 1)
      applyFormatted(el, mask(el.value.replace(/\D/g, "")))
    }
    expect(el.value).toBe("(415) 555-2671")
    expect(el.selectionStart).toBe(14)
    el.remove()
  })
})

describe("isDeletingEvent", () => {
  it("trusts inputType when present", () => {
    expect(isDeletingEvent({ inputType: "deleteContentBackward" }, 5, 4)).toBe(true)
    expect(isDeletingEvent({ inputType: "insertText" }, 4, 5)).toBe(false)
    // inputType wins even when lengths suggest otherwise (mask added separators)
    expect(isDeletingEvent({ inputType: "deleteContentBackward" }, 4, 6)).toBe(true)
  })

  it("falls back to length comparison", () => {
    expect(isDeletingEvent(null, 5, 4)).toBe(true)
    expect(isDeletingEvent({}, 4, 5)).toBe(false)
  })
})
