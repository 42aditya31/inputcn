import { Link } from "../router.js"

export function NotFound() {
  return (
    <div className="page-hero">
      <div className="gridlines wide" />
      <div className="glow left" />
      <div className="page-hero-in">
        <div className="eyebrow">404</div>
        <h1 className="gradient-title">No page here.</h1>
        <p>
          The link is wrong or the page moved. Try the{" "}
          <Link to="/components">component library</Link> or the{" "}
          <Link to="/docs">documentation</Link>.
        </p>
      </div>
    </div>
  )
}
