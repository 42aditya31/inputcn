import { COMPONENTS } from "../content/components.js"
import { Link } from "../router.js"

export function ComponentsIndex() {
  return (
    <>
      <div className="page-hero">
        <div className="gridlines wide" />
        <div className="glow left" />
        <div className="page-hero-in">
          <div className="eyebrow">Component library</div>
          <h1 className="gradient-title">Eleven inputs. One contract.</h1>
          <p>
            Each component emits one canonical value, forwards its ref to the primary input,
            and ships a matching Zod schema. Open any card for its documentation and a live
            demo.
          </p>
        </div>
      </div>

      <div className="sec" style={{ paddingTop: 36, paddingBottom: 90 }}>
        <div className="lib-grid">
          {COMPONENTS.map((c, i) => (
            <Link className="lib-card" key={c.slug} to={`/components/${c.slug}`}>
              <div className="top">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="nm">{c.name}</span>
                <span className="sp" style={{ flex: 1 }} />
                <span className="pill-t">{c.t}</span>
              </div>
              <p>{c.tagline}</p>
              <div className="val">
                <span className="l">value</span>
                <span className="v">{c.example}</span>
              </div>
              <div className="go">
                <span>Open docs</span>
                <i>→</i>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
