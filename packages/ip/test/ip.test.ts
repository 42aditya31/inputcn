import { describe, expect, it } from "vitest"

import {
  cidrRange,
  classify,
  fromInt,
  isLoopback,
  isMulticast,
  isPrivate,
  parseIp,
  parsePastedIp,
  toInt,
} from "../src/ip.js"

describe("parseIp", () => {
  it("parses a bare address", () => {
    const p = parseIp("192.168.1.1")!
    expect(p.octets).toEqual([192, 168, 1, 1])
    expect(p.hasPrefix).toBe(false)
    expect(p.prefix).toBe(32)
    expect(p.canonical).toBe("192.168.1.1")
  })

  it("parses a CIDR block", () => {
    const p = parseIp("10.0.0.0/24")!
    expect(p.prefix).toBe(24)
    expect(p.hasPrefix).toBe(true)
    expect(p.canonical).toBe("10.0.0.0/24")
  })

  it("rejects an out-of-range octet", () => {
    expect(parseIp("256.0.0.1")).toBeNull()
    expect(parseIp("1.2.3")).toBeNull()
  })

  it("rejects a leading zero, which some resolvers read as octal", () => {
    expect(parseIp("010.0.0.1")).toBeNull()
    // A single "0" is still a legitimate octet.
    expect(parseIp("0.0.0.0")).not.toBeNull()
  })

  it("rejects an out-of-range prefix", () => {
    expect(parseIp("10.0.0.0/33")).toBeNull()
    expect(parseIp("10.0.0.0/0")).not.toBeNull()
  })
})

describe("integer conversion", () => {
  it("round-trips", () => {
    for (const ip of ["0.0.0.0", "10.0.0.1", "192.168.1.1", "255.255.255.255"]) {
      expect(fromInt(toInt(parseIp(ip)!))).toBe(ip)
    }
  })

  it("stays unsigned at the top of the range", () => {
    // A signed shift would make this negative and break every comparison.
    expect(toInt(parseIp("255.255.255.255")!)).toBe(4_294_967_295)
  })
})

describe("cidrRange", () => {
  it("computes a /24", () => {
    const r = cidrRange(parseIp("10.0.0.0/24")!)
    expect(r.network).toBe("10.0.0.0")
    expect(r.broadcast).toBe("10.0.0.255")
    expect(r.firstHost).toBe("10.0.0.1")
    expect(r.lastHost).toBe("10.0.0.254")
    expect(r.hosts).toBe(254)
    expect(r.netmask).toBe("255.255.255.0")
  })

  it("normalises an address inside the block to its network", () => {
    expect(cidrRange(parseIp("10.0.0.57/24")!).network).toBe("10.0.0.0")
  })

  it("special-cases /31 and /32 per RFC 3021", () => {
    // A /31 is a point-to-point link: both addresses are usable.
    const p31 = cidrRange(parseIp("10.0.0.0/31")!)
    expect(p31.hosts).toBe(2)
    // A /32 is a single host, not "2 minus 2".
    const p32 = cidrRange(parseIp("10.0.0.1/32")!)
    expect(p32.hosts).toBe(1)
  })

  it("handles /0 without overflowing", () => {
    const r = cidrRange(parseIp("0.0.0.0/0")!)
    expect(r.netmask).toBe("0.0.0.0")
    expect(r.broadcast).toBe("255.255.255.255")
    expect(r.hosts).toBe(4_294_967_294)
  })
})

describe("classification", () => {
  it("detects RFC 1918 private ranges", () => {
    for (const ip of ["10.0.0.1", "172.16.0.1", "172.31.255.254", "192.168.1.1"]) {
      expect(isPrivate(parseIp(ip)!), ip).toBe(true)
    }
    // 172.32 is outside the 172.16–172.31 block.
    expect(isPrivate(parseIp("172.32.0.1")!)).toBe(false)
    expect(isPrivate(parseIp("8.8.8.8")!)).toBe(false)
  })

  it("detects loopback and multicast", () => {
    expect(isLoopback(parseIp("127.0.0.1")!)).toBe(true)
    expect(isMulticast(parseIp("224.0.0.1")!)).toBe(true)
    expect(isMulticast(parseIp("240.0.0.1")!)).toBe(false)
  })

  it("labels the address class", () => {
    expect(classify(parseIp("10.0.0.1")!)).toBe("private")
    expect(classify(parseIp("127.0.0.1")!)).toBe("loopback")
    expect(classify(parseIp("169.254.1.1")!)).toBe("link-local")
    expect(classify(parseIp("8.8.8.8")!)).toBeNull()
  })
})

describe("parsePastedIp", () => {
  it("extracts an address from a log line", () => {
    expect(parsePastedIp("client 192.168.1.44 connected")).toBe("192.168.1.44")
    expect(parsePastedIp("allow from 10.0.0.0/8;")).toBe("10.0.0.0/8")
  })

  it("scrubs clipboard junk", () => {
    expect(parsePastedIp("​10.0.0.1 ")).toBe("10.0.0.1")
  })

  it("returns null when there is no address", () => {
    expect(parsePastedIp("no address here")).toBeNull()
    expect(parsePastedIp("999.999.999.999")).toBeNull()
  })
})
