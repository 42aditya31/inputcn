import { COMPONENTS } from "./components.js"
import { GUIDES } from "./guides.js"
import type { NavGroup, NavItem } from "./types.js"

/**
 * The docs sidebar, and the order prev/next walks.
 *
 * Groups come out in the order the guides declare them, so adding a page is a
 * one-line change in guides.tsx and nothing here needs touching.
 */
function groupGuides(): NavGroup[] {
  const order: string[] = []
  const byGroup = new Map<string, NavItem[]>()

  for (const g of GUIDES) {
    if (!byGroup.has(g.group)) {
      byGroup.set(g.group, [])
      order.push(g.group)
    }
    byGroup.get(g.group)!.push({ slug: g.slug, label: g.label, href: `/docs/${g.slug}` })
  }

  return order.map((group) => ({ group, items: byGroup.get(group)! }))
}

export const NAV: NavGroup[] = [
  ...groupGuides(),
  {
    group: "Components",
    items: COMPONENTS.map((c) => ({
      slug: c.slug,
      label: c.name,
      href: `/components/${c.slug}`,
    })),
  },
]

/** Flattened, for the prev/next pager at the foot of every docs page. */
export const FLAT: NavItem[] = NAV.flatMap((g) => g.items)

export function neighbours(href: string): { prev?: NavItem; next?: NavItem } {
  const i = FLAT.findIndex((item) => item.href === href)
  if (i === -1) return {}
  const prev = i > 0 ? FLAT[i - 1] : undefined
  const next = i < FLAT.length - 1 ? FLAT[i + 1] : undefined
  return { ...(prev ? { prev } : {}), ...(next ? { next } : {}) }
}
