# QuillQuest site — pre-launch review fixes

**For the Claude session in `/Users/marcus/projects/malcom.io`.** These came out of a 5-agent
pre-launch review. The pages are already live and correct on the big facts (audience, level ladder,
voices, no-tracking); these are the remaining polish + one must-fix. Apply, then rebuild/redeploy.

## 🔴 Must fix before it's "done" (Apple reviewers open this URL)
1. **Privacy effective date placeholder.** `src/app/quillquest/quillquest-privacy.component.html:9`
   currently renders `Effective date: [ TODO — add on publish ]`. Replace with a real date —
   **`Effective date: July 7, 2026`** — and remove the `.doc-todo` span styling. Also update the
   source copy `docs/quillquest/privacy.md` to match. (A visible "TODO" on a live kids'-app privacy
   policy is a trust + App-Store-review risk.)

## 🟡 Should fix before public (trust polish, from the parent review)
2. **Landing — port the "made by a parent" line.** The store listing has it; the site only says
   "A Malcom IO game." Add a short human line (e.g. in the "Why parents trust it" area of
   `quillquest.component.html`): *"Made by a parent who wanted spelling practice their own kids would
   actually choose."* Biggest single trust-builder; it's currently missing.
3. **Landing — say "no in-app purchases."** Add it to the badges or the CTA copy — "Free" alone
   invites the "will it nickel-and-dime us?" worry.
4. **Landing — mention iPad.** The app is iPhone **and** iPad; the site is silent. Add "iPhone & iPad"
   in the hero or CTA.
5. **Landing — link privacy/support from the body.** They're only in the footer; a parent reading the
   trust cards wants a "Read our privacy policy →" link right there.
6. **CTA — give the "Coming soon" button a signal.** Both CTAs render a dead "Coming soon to the App
   Store" button with no timeline. Add a rough ETA (e.g. "Coming to the App Store — 2026") or a
   lightweight "notify me" email link so the live page doesn't feel unfinished. (`appStoreUrl` stays
   `null` until launch — see #9.)
7. **Support — add real troubleshooting FAQs.** The current FAQ is marketing-flavored (offline? cost?).
   Add, in `quillquest-support.component.ts`, at least:
   - **"No sound / a word won't play aloud?"** (audio is the core mechanic — the #1 likely issue: check
     the silent switch + volume).
   - **"Will we lose progress after an update or on a new device?"** (progress is on-device only).
   - **"How do I turn off the daily reminder?"** (Settings; it's off by default).
   Optionally add a "we usually reply within a few days" line.
8. **Add `public/robots.txt` and `public/sitemap.xml`** (currently missing). robots: allow all + a
   `Sitemap:` line; sitemap: the 4 routes (`/home`, `/quillquest`, `/quillquest/privacy`,
   `/quillquest/support`). Files under `public/**` land in the build automatically.

## ⚪ Nice-to-have / launch-day
9. **Launch day:** set `appStoreUrl` in `quillquest.component.ts` to the live App Store listing — both
   CTAs flip from "Coming soon" to a real download button automatically. (Add to the launch checklist.)
10. **Dedicated OG card.** `app.routes.ts` uses the square 1024² `icon.png` as `og:image`, but the page
    declares `twitter:card=summary_large_image` (≈1.91:1) → it gets cropped in shares. A purpose-built
    ~1200×630 QuillQuest card scrapes better (the main site already ships `og-card.png`).

## Verify
- Confirm the **apex → www redirect**: `https://malcom.io/quillquest/privacy` must 301 to
  `https://www.malcom.io/...` (the App Store listing now points at `www`). If the apex doesn't redirect,
  the required privacy URL could fail review.
- `ng build` passes; the three routes still prerender; redeploy.

Canonical copy remains `/Users/marcus/projects/quillquest/docs/app-store-listing.md`.
