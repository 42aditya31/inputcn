import { defineConfig } from "tsup"

export default defineConfig({
  // Test helpers only ever run in a test environment, so there is no
  // client/server split to make here.
  entry: ["src/index.ts", "src/fill.ts", "src/assert.ts", "src/render.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: "es2022",
  external: [
    "react",
    "react-dom",
    "@testing-library/react",
    "@testing-library/dom",
    "@testing-library/user-event",
    /^@inputcn\//,
  ],
})
