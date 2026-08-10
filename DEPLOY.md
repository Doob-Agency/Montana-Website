# Deploying

Three storefronts share one dashboard on `montana.doobagency.com`, so the two
redesigns can be compared side by side against real data without either of them
taking the domain from the site that is already live.

```
montana.doobagency.com/          the previous site        (untouched)
montana.doobagency.com/admin     the Laravel dashboard
montana.doobagency.com/new       light + motion design    branch: feat/light-motion
montana.doobagency.com/new2      first redesign           branch: feat/concept-b-homepage
```

`/new` is the primary direction. `/new2` is kept as the alternative.

## Build

```bash
npm ci
npm run build
```

Each branch pins its own folder in `.env.production` (`PUBLIC_URL`) and in
`public/.htaccess` (`RewriteBase` and the rewrite target). The build prints the
folder it assumed — check that line matches the branch before uploading:

```
The project was built assuming it is hosted at /new2/.
```

`REACT_APP_API_URL` in `.env` points at `https://montana.doobagency.com/admin`
and is read at build time, so changing it means rebuilding.

## Upload

Copy the **contents** of `build/` into the matching folder — `public_html/new/`
or `public_html/new2/` — not the `build` folder itself.

`public/.htaccess` is part of the build output, so `build/.htaccess` must land
as `public_html/<folder>/.htaccess`. Many FTP clients hide dotfiles; without it
every deep link (`/new/cart`, `/new2/all-products`) returns Apache's 404 instead
of the app.

Nothing outside its own folder is touched, so deploying one never disturbs the
other two.

## After deploying, check

1. The folder loads and the order bar shows a branch.
2. A deep link reloads directly without a 404 — that is the rewrite working.
3. The domain root still serves the previous site.
4. Devtools → Network shows no request to `/static/…` at the domain root;
   every asset sits under the deployed folder.

## Moving one to the root

1. Set `PUBLIC_URL=/` in that branch's `.env.production`.
2. Change `RewriteBase` and the rewrite target in `public/.htaccess` to `/`.
3. Rebuild and upload into `public_html/`.

No source change is needed — every path already goes through
`process.env.PUBLIC_URL` (see `src/basePath.js`).
