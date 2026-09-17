import { BLOCKS } from "../content/blocks.js"
import { BY_SLUG } from "../content/components.js"
import { Link } from "../router.js"

export function BlocksIndex() {
  return (
    <>
      <div className="page-hero">
        <div className="gridlines wide" />
        <div className="glow left" />
        <div className="page-hero-in">
          <div className="eyebrow">Blocks</div>
          <h1 className="gradient-title">Whole forms, not ingredients.</h1>
          <p>
            Six complete forms, live on the page and wired the way you would actually ship
            them. Copy the code, or hand the whole thing to your agent in one click.
          </p>
        </div>
      </div>

      <div className="sec" style={{ paddingTop: 36, paddingBottom: 90 }}>
        <div className="lib-grid">
          {BLOCKS.map((b, i) => (
            <Link className="lib-card" key={b.slug} to={`/blocks/${b.slug}`}>
              <div className="top">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="nm">{b.name}</span>
                <span style={{ flex: 1 }} />
                <span className="pill-t">{b.wiring === "No form library" ? "no deps" : "rhf + zod"}</span>
              </div>

              <p>{b.tagline}</p>

              <div className="block-uses">
                {b.uses.map((u) => (
                  <span className="block-chip" key={u}>
                    {BY_SLUG.get(u)?.name ?? u}
                  </span>
                ))}
              </div>

              <div className="go">
                <span>Open block</span>
                <i>→</i>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
