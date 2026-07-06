# Contact form Worker

A Cloudflare Worker that powers the malcom.io contact form: it verifies a
Cloudflare **Turnstile** token, then emails the submission via **Resend**.

No secrets live in this folder. `TURNSTILE_SECRET` and `RESEND_API_KEY` are stored
in Cloudflare (encrypted) and injected at runtime — safe to keep in the public repo.

## What you need first

1. **Cloudflare account** → create a **Turnstile** widget for `malcom.io`
   (dashboard → Turnstile → Add). You get a **site key** (public, goes in the site)
   and a **secret key** (server-side).
2. **Resend account** → verify **malcom.io** as a sending domain (add the DKIM/SPF
   records it gives you at your DNS host), and create an **API key**.

## Deploy

```bash
cd contact-worker
npm install
npx wrangler login

# secrets — stored in Cloudflare, never committed:
npx wrangler secret put TURNSTILE_SECRET   # paste the Turnstile secret key
npx wrangler secret put RESEND_API_KEY      # paste the Resend API key

npx wrangler deploy
```

`deploy` prints the Worker URL, e.g. `https://malcom-contact.<subdomain>.workers.dev`.
Hand that URL + your **Turnstile site key** over to wire up the front-end form.

## Config (`wrangler.toml`)

- `MAIL_TO` — where submissions are emailed (`marcus@malcom.io`).
- `MAIL_FROM` — the sender; must be on your Resend-verified domain
  (`contact@malcom.io`). Until the domain is verified, Resend only lets you send
  from `onboarding@resend.dev` to your own account email — useful for a first test.

## Local test

```bash
npx wrangler dev
```
