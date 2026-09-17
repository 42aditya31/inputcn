import config from "../../../site.config.json"

/**
 * The public URL, read from the one file that holds it.
 *
 * Nothing in this app should ever write the URL out by hand: it changes the
 * day the site is deployed, and a second copy of it is a copy that will be
 * missed. Change it with `pnpm site-url <url>` from the repo root.
 */
export const SITE_URL: string = config.siteUrl
export const REPO_URL: string = config.repoUrl
export const TWITTER: string = config.twitter

/** The shadcn command that installs one registry item. */
export function installCmd(registryItem: string): string {
  return `npx shadcn@latest add ${SITE_URL}/r/${registryItem}.json`
}
