/**
 * The app is served from the site root in development and from a sub-folder in
 * production (`https://montana.doobagency.com/new`), so that the previous
 * website can keep running at the domain root against the same dashboard.
 *
 * CRA inlines `process.env.PUBLIC_URL` at build time — "" locally, "/new" for
 * the production build (see `.env.production`). Everything that leaves React
 * Router's control (full page loads, payment callbacks, asset fetches) has to
 * go through here, or it lands on the old site instead.
 */
const BASE = process.env.PUBLIC_URL || "";

export default BASE;

/** Absolute URL for a path inside this deployment, e.g. hardRedirect targets. */
export function appPath(path) {
  return BASE + path;
}

/** Same, but including the origin — for payment gateway callback URLs. */
export function appUrl(path) {
  return window.location.origin + BASE + path;
}

/** Leave the app entirely — full page load, not a router navigation. */
export function hardRedirect(path) {
  window.location.href = BASE + path;
}

/**
 * `window.location.pathname` with the deployment folder removed, so route
 * matching sees "/cart" rather than "/new/cart".
 */
export function routePath() {
  const path = window.location.pathname;
  if (BASE && path.startsWith(BASE)) return path.slice(BASE.length) || "/";
  return path;
}
