import { describe, expect, it } from "vitest"

import {
  formatFileSize,
  isValidFileSize,
  parseFileSize,
  parsePastedFileSize,
} from "../src/filesize.js"

describe("parseFileSize", () => {
  it("parses the common spellings", () => {
    expect(parseFileSize("25 MB")).toBe(25_000_000)
    expect(parseFileSize("25MB")).toBe(25_000_000)
    expect(parseFileSize("25 megabytes")).toBe(25_000_000)
    expect(parseFileSize("1.5 GB")).toBe(1_500_000_000)
  })

  it("keeps MB and MiB distinct — the 4.9% that rejects a user's file", () => {
    expect(parseFileSize("1 MB")).toBe(1_000_000)
    expect(parseFileSize("1 MiB")).toBe(1_048_576)
    expect(parseFileSize("1 MiB")).not.toBe(parseFileSize("1 MB"))
  })

  it("never reinterprets an explicit binary unit", () => {
    // Even in binary mode, MiB means MiB — it is already unambiguous.
    expect(parseFileSize("1 MiB", { binary: true })).toBe(1_048_576)
  })

  it("reads ambiguous units as binary when asked", () => {
    expect(parseFileSize("1 MB", { binary: true })).toBe(1_048_576)
    expect(parseFileSize("1 GB", { binary: true })).toBe(1_073_741_824)
  })

  it("applies the bare unit to a lone number", () => {
    expect(parseFileSize("25", { bareUnit: "MB" })).toBe(25_000_000)
    expect(parseFileSize("25")).toBe(25) // default is bytes
  })

  it("accepts thousands separators", () => {
    expect(parseFileSize("1,500 KB")).toBe(1_500_000)
  })

  it("returns null — not 0 — for junk, so invalid stays distinct from empty", () => {
    expect(parseFileSize("")).toBeNull()
    expect(parseFileSize("big")).toBeNull()
    expect(parseFileSize("25 XB")).toBeNull()
    expect(parseFileSize("-5 MB")).toBeNull()
  })

  it("agrees with isValidFileSize", () => {
    expect(isValidFileSize("25 MB")).toBe(true)
    expect(isValidFileSize("nope")).toBe(false)
  })
})

describe("formatFileSize", () => {
  it("picks the most readable unit", () => {
    expect(formatFileSize(0)).toBe("0 B")
    expect(formatFileSize(512)).toBe("512 B")
    expect(formatFileSize(25_000_000)).toBe("25 MB")
    expect(formatFileSize(1_500_000_000)).toBe("1.5 GB")
  })

  it("uses binary units when asked", () => {
    expect(formatFileSize(1_048_576, { binary: true })).toBe("1 MiB")
    expect(formatFileSize(1_048_576)).toBe("1.05 MB")
  })

  it("never shows fractional bytes", () => {
    expect(formatFileSize(999)).toBe("999 B")
  })

  it("respects a forced unit", () => {
    expect(formatFileSize(25_000_000, { unit: "KB" })).toBe("25000 KB")
  })

  it("round-trips through parseFileSize", () => {
    for (const bytes of [512, 25_000_000, 1_500_000_000]) {
      expect(parseFileSize(formatFileSize(bytes))).toBe(bytes)
    }
  })

  it("round-trips in binary mode too", () => {
    for (const bytes of [1024, 1_048_576, 1_073_741_824]) {
      expect(parseFileSize(formatFileSize(bytes, { binary: true }))).toBe(bytes)
    }
  })
})

describe("parsePastedFileSize", () => {
  it("extracts a size from a sentence", () => {
    expect(parsePastedFileSize("Max upload: 25 MB")).toBe(25_000_000)
    expect(parsePastedFileSize("limit is 1.5GB per file")).toBe(1_500_000_000)
  })

  it("scrubs clipboard junk", () => {
    expect(parsePastedFileSize("​25 MB")).toBe(25_000_000)
  })

  it("returns null when there is no size", () => {
    expect(parsePastedFileSize("no limit")).toBeNull()
    expect(parsePastedFileSize("")).toBeNull()
  })
})
