# malcom.io

The marketing site for [Malcom IO](https://www.malcom.io) — a prerendered Angular app with a
dark editorial design, a contact form, and a dedicated landing page for the **QuillQuest**
mobile game. Hosted on GitHub Pages; the contact form runs on a Cloudflare Worker. **No AWS.**

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Angular 22 (standalone components, `@angular/build` esbuild builder) |
| Language | TypeScript 6 |
| Styling | Bootstrap 5 (dark theme) + FontAwesome 7 (SCSS) |
| Forms / spam | Reactive Forms + [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) |
| Contact backend | Cloudflare Worker → [Resend](https://resend.com) email — see [`contact-worker/`](./contact-worker) |
| Notifications | small in-house `ToastService` (`src/app/shared`) |
| Rendering | Prerendered / SSG (`@angular/ssr`, static output) |
| Hosting | GitHub Pages (static, custom domain `www.malcom.io`) |
| Unit tests | Vitest (`@angular/build:unit-test`) |

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

Every route is **prerendered to static HTML** (`outputMode: static`), so the site needs no
server at runtime and deep links work on any static host. Turnstile is guarded to run only in
the browser (never during prerender).

## Project structure

```
src/
  app/
    app.component.*        # root shell: <router-outlet> + <app-toast>
    app.config.ts          # providers (router, http, animations, zone CD, SEO title strategy)
    app.routes.ts          # '' -> /home, /home, /quillquest, /auth
    home/                  # landing page (hero, what-we-do, approach, contact)
    contact/              # Turnstile-protected contact form -> Cloudflare Worker
    quillquest/           # QuillQuest mobile-game landing page
    auth/                 # placeholder (reserved for future auth)
    shared/               # ToastService/Component, LogoComponent, SeoTitleStrategy
  scss/                   # global dark theme (Bootstrap 5, FontAwesome, brand tokens)
  index.html
public/                   # static assets (favicons, images, CNAME) copied as-is
contact-worker/           # Cloudflare Worker: Turnstile verify + Resend email
```

## Design

Dark editorial theme — charcoal ground, brand green `#28a745`, monospace display + eyebrows,
bordered cards, and a golden-ratio spiral motif (favicon, logo mark, hero, social share card).
The design tokens and reusable patterns (`.eyebrow`, `.brand-card`, `.h-section`, buttons,
navbar, footer) live in `src/scss/styles.scss`; Bootstrap's dark theme is enabled via
`data-bs-theme="dark"` in `index.html`.

## Routes

| Path | Page |
| --- | --- |
| `/home` | Main Malcom IO landing page (default) |
| `/quillquest` | QuillQuest mobile-game landing page |
| `/auth` | Placeholder, reserved for future authentication |

## Contact form

Protected by **Cloudflare Turnstile** (site key in `contact.component.ts`; the Turnstile
script is loaded from `index.html`) and POSTs to a **Cloudflare Worker** at
`malcom-contact.malcomio.workers.dev`. The Worker verifies the Turnstile token and emails the
submission via **Resend** — fully serverless, no AWS. A hidden honeypot field silently drops
bots. See [`contact-worker/README.md`](./contact-worker/README.md) for the Worker, its config,
and how secrets/deploys work.

## QuillQuest

`/quillquest` is scaffolded with placeholder copy, feature cards, screenshot slots, and
App Store / Google Play buttons. To finish it, edit `src/app/quillquest/quillquest.component.*`:

- Replace the placeholder copy and the `appStoreUrl` / `playStoreUrl` / `privacyUrl` values.
- Drop real screenshots under `public/assets/quillquest/` and swap the placeholder
  `.qq-screenshot` blocks for `<img>` tags.
- Replace the hero gradient in `quillquest.component.scss` with real key art.

## Deployment

Deployed to **GitHub Pages** via [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):
on every push to `main` it installs (Node 24 from `.nvmrc`), runs the unit tests, builds the
prerendered site, and publishes `dist/browser/`. The deploy step **auto-retries** GitHub Pages'
occasionally-flaky backend.

- Custom domain `www.malcom.io` via [`public/CNAME`](./public/CNAME); `public/.nojekyll` disables Jekyll.
- `index.csr.html` is copied to `404.html` as a client-side-render fallback for unmatched URLs.
- Pages source: **Settings → Pages → Source = GitHub Actions**; DNS `www.malcom.io` (CNAME) → `malcom-io.github.io`.

The site and its contact form run entirely on **GitHub Pages + Cloudflare** — no AWS.
