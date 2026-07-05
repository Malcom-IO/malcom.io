# malcom.io

The marketing site for [Malcom IO](https://www.malcom.io) — a single-page Angular
application with a landing page, a contact form, and a dedicated landing page for the
**QuillQuest** mobile game.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Angular 22 (standalone components, `@angular/build` esbuild builder) |
| Language | TypeScript 6 |
| Styling | Bootstrap 5 + FontAwesome 7 (SCSS) |
| Forms | Reactive Forms + [`ng-recaptcha-2`](https://www.npmjs.com/package/ng-recaptcha-2) |
| Notifications | small in-house `ToastService` (see `src/app/shared`) |
| Unit tests | Vitest (`@angular/build:unit-test`) |
| Rendering | Prerendered / SSG (`@angular/ssr`, static output) |
| Hosting | GitHub Pages (static, custom domain `www.malcom.io`) |

## Prerequisites

- **Node.js 24 LTS** (or ≥ 22.22.3). The repo pins the version in [`.nvmrc`](./.nvmrc):

  ```bash
  nvm use        # reads .nvmrc -> Node 24
  npm install
  ```

## Development

```bash
npm start        # dev server at http://localhost:4200/ (live reload)
npm run build    # prerendered static build -> dist/browser/ (one .html per route)
npm test         # unit tests (Vitest); use CI=true npm test for a single run
```

Every route is **prerendered to static HTML** (`outputMode: static`), so the site needs
no server at runtime and deep links work on any static host. reCAPTCHA is guarded to run
only in the browser (never during prerender).

## Project structure

```
src/
  app/
    app.component.*        # root shell: <router-outlet> + <app-toast>
    app.config.ts          # providers (router, http, animations, zone CD)
    app.routes.ts          # '' -> /home, /home, /quillquest, /auth
    home/                  # landing page (hero, features, contact)
    contact/              # reCAPTCHA-protected contact form
    quillquest/           # QuillQuest mobile-game landing page
    auth/                 # placeholder (reserved for future AWS auth)
    shared/               # ToastService + ToastComponent
  scss/                   # global styles (Bootstrap 5, FontAwesome, brand colors)
  index.html
public/                   # static assets (favicon, images) copied as-is
```

## Routes

| Path | Page |
| --- | --- |
| `/home` | Main Malcom IO landing page (default) |
| `/quillquest` | QuillQuest mobile-game landing page |
| `/auth` | Placeholder, reserved for future authentication |

## QuillQuest

`/quillquest` is scaffolded with placeholder copy, feature cards, screenshot slots, and
App Store / Google Play buttons. To finish it, edit
`src/app/quillquest/quillquest.component.*`:

- Replace the placeholder copy and the `appStoreUrl` / `playStoreUrl` / `privacyUrl` values.
- Drop real screenshots under `public/assets/quillquest/` and swap the placeholder
  `.qq-screenshot` blocks for `<img>` tags.
- Replace the hero gradient in `quillquest.component.scss` with real key art.

## Contact form

The form posts to an AWS API Gateway endpoint
(`.../prod/contact-us`, hard-coded in `contact.component.ts`) and is protected by Google
reCAPTCHA (site key in `contact.component.html`). The reCAPTCHA script is loaded from
`index.html`.

## Deployment

Deployed to **GitHub Pages** via [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):
on every push to `master`/`main` it installs (Node 24 from `.nvmrc`), runs the unit tests,
builds the prerendered site, and publishes `dist/browser/`.

- The custom domain `www.malcom.io` is set via [`public/CNAME`](./public/CNAME).
- `public/.nojekyll` disables Jekyll processing.
- The workflow copies `index.csr.html` → `404.html` as a client-side-render fallback for
  any unmatched URL.

One-time setup: in the GitHub repo, **Settings → Pages → Source = GitHub Actions**, then
point DNS `www.malcom.io` (CNAME) at `<user>.github.io`.

> Previously hosted on AWS Amplify (hosting only — the contact form's API Gateway is
> separate infrastructure and is unaffected by the hosting move).
