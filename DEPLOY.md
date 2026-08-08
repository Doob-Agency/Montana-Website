# Deploying the redesigned storefront to `/new`

The redesign runs beside the current site instead of replacing it: the old
storefront keeps the domain root, the dashboard keeps `/admin`, and this build
goes into `/new`. All three talk to the same dashboard.

```
montana.doobagency.com/          → old storefront   (untouched)
montana.doobagency.com/admin     → Laravel dashboard
montana.doobagency.com/new       → this branch      (feat/concept-b-homepage)
```

## Build

```bash
npm ci
npm run build
```

`.env.production` sets `PUBLIC_URL=/new`, so the bundle, the favicon, the
manifest and every file under `public/assets` are emitted with a `/new/`
prefix, and React Router is mounted with the same basename. The build prints
`The project was built assuming it is hosted at /new/.` — if it does not, the
env file was not picked up and the deploy will 404 on every asset.

`REACT_APP_API_URL` in `.env` points at `https://montana.doobagency.com/admin`.
It is read at build time, not at runtime, so changing it means rebuilding.

## Upload

Copy the **contents** of `build/` into `public_html/new/` (not the `build`
folder itself). `public/.htaccess` is part of the build output, so
`build/.htaccess` must land in `public_html/new/.htaccess` — many FTP clients
hide dotfiles, and without it every deep link (`/new/cart`, `/new/all-products`)
returns Apache's 404 instead of the app.

Nothing outside `public_html/new/` is touched, so the old site and the dashboard
are unaffected by a deploy here.

## After deploying, check

1. `https://montana.doobagency.com/new` loads and the order bar shows a branch.
2. `https://montana.doobagency.com/new/all-products` reloads directly without a
   404 — that is the `.htaccess` rewrite working.
3. `https://montana.doobagency.com/` still serves the old site.
4. Devtools → Network shows no request to `/static/…` at the domain root; every
   asset should be under `/new/`.

## Moving it to the root later

When the redesign takes over the domain:

1. Set `PUBLIC_URL=/` in `.env.production`.
2. Change `RewriteBase` and the rewrite target in `public/.htaccess` from
   `/new/` to `/`.
3. Rebuild and upload into `public_html/`.

No source change is needed — every path in the app already goes through
`process.env.PUBLIC_URL` (see `src/basePath.js`).
