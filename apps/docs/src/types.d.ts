// Vite's ?raw import returns the file's source as a string. Used by the block
// registry so the code shown on the page is the code that runs.
declare module "*?raw" {
  const content: string
  export default content
}
