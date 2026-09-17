import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./tokens.css"
// The library's own stylesheet. In a real app this is one import too.
import "@inputcn/core/styles.css"
import "./harness.css"

import App from "./App.js"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
