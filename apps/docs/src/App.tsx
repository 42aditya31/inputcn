import { BY_SLUG } from "./content/components.js"
import { GUIDE_BY_SLUG, GUIDES } from "./content/guides.js"
import { Footer } from "./layout/Footer.js"
import { Nav } from "./layout/Nav.js"
import { ComponentPageView } from "./pages/ComponentPage.js"
import { ComponentsIndex } from "./pages/ComponentsIndex.js"
import { GuidePageView } from "./pages/GuidePage.js"
import { Home } from "./pages/Home.js"
import { NotFound } from "./pages/NotFound.js"
import { usePath } from "./router.js"
import { useHead } from "./use-head.js"

const FIRST_GUIDE = GUIDES[0]!

/**
 * Route table.
 *
 *   /                      landing
 *   /components            the eleven, as cards
 *   /components/:slug      one component: live demo, generated props, examples
 *   /docs                  redirects to the first guide
 *   /docs/:slug            one guide
 */
function route(path: string) {
  if (path === "/") return <Home />
  if (path === "/components") return <ComponentsIndex />

  if (path.startsWith("/components/")) {
    const c = BY_SLUG.get(path.slice("/components/".length))
    return c ? <ComponentPageView c={c} /> : <NotFound />
  }

  if (path === "/docs") return <GuidePageView guide={FIRST_GUIDE} />

  if (path.startsWith("/docs/")) {
    const g = GUIDE_BY_SLUG.get(path.slice("/docs/".length))
    return g ? <GuidePageView guide={g} /> : <NotFound />
  }

  return <NotFound />
}

export default function App() {
  const path = usePath()
  useHead(path)

  return (
    <>
      <Nav />
      {/* Keyed so a page change remounts rather than reconciling one doc page
          into another — the demos hold their own state and should reset. */}
      <div key={path}>{route(path)}</div>
      <Footer />
    </>
  )
}
