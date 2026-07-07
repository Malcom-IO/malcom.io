# Malcom IO — Site Review & Roadmap

_A decision-making roadmap from a 7-perspective site review (2026‑07‑07): UI/UX design,
frontend engineering, accessibility, SEO/performance, prospective customer, parent, and
CEO/brand. Tick the boxes as you decide; jot decisions in the log at the bottom._

**How to use this:** everything below is a proposal, not a commitment. Tier A is where the
leverage is. Each item says what it is, **why** it matters (and which reviewers flagged it),
**what I'd need from you**, rough **effort**, and a checkbox + notes for your call.

Legend: `[ ]` open · `[~]` decided, not started · `[x]` done · effort **S/M/L**

---

## TL;DR — the two findings

1. **The craft is strong; the substance is thin.** Every reviewer praised the design system,
   the QuillQuest privacy/support pages, the copy, and the SEO hygiene. And every business lens
   (prospective customer, parent, CEO) reached the *same* conclusion independently: **there is
   no proof.** No portfolio, no About/founder, a "medical software / health interoperability"
   claim with zero evidence, and QuillQuest — the best proof of craft — walled off from the
   studio pitch. This is the highest-leverage work and it needs **your** real information.

2. **A large batch of safe polish was sitting right there** — shipped in **PR #17** (merged).

---

## Already shipped (baseline — don't re-decide these)

- [x] **PR #17 — site polish pass**: bigger hero eyebrow; tighter hero; QuillQuest CTA flipped
  (real "Email me" is now primary); gallery fade cue; centered docs; **fixed mobile horizontal
  overflow**; contact-form a11y (errors announced + focus management) & **fixed Enter‑to‑submit**;
  `<main>` + skip link; contrast fixes; `prefers-reduced-motion`; removed the live `/auth`
  placeholder; dropped unused `@angular/animations` + dead CSS; **trailing-slash canonicals**;
  **JSON‑LD** (Organization, WebSite, MobileApplication, FAQPage, Breadcrumbs).
- [x] Earlier: Angular 22 migration, GitHub Pages hosting, dark redesign + brand identity,
  QuillQuest landing/privacy/support, Cloudflare Worker contact form, 1200×630 OG card,
  `robots.txt` + `sitemap.xml`, `og:image` dimensions.

---

## Tier A — Strategic / trust (highest leverage · needs your content)

> The whole panel agrees: fixing even one or two of these changes what a serious buyer concludes.
> I can build the structure/design for all of them; the **words and proof have to be yours.**

### A1 · About / founder identity — `[ ]`  · effort **S**
- **What:** an About section (and/or `/about`) — your name, a photo, real background (especially
  any healthcare/engineering credentials), whether it's you solo or a studio + partners, location,
  years building, and LinkedIn/GitHub links.
- **Why:** flagged by **CEO (P0)**, **customer (P0)**, **parent (P1)**. For a boutique studio,
  *you are the brand.* Anonymity is the single biggest trust hole — the site reads as a capable
  but faceless freelancer, which is disqualifying for a serious/regulated engagement.
- **Need from you:** name, photo, 2–4 sentences of real bio, links.
- **Decision/notes:** _______________________________________________

### A2 · Proof of work / case studies — `[ ]`  · effort **M**
- **What:** a "Selected work" strip on `/home` — 1–3 projects (anonymized is fine) as
  problem → what you built → an outcome/metric. Plus **feature QuillQuest on `/home`** as studio
  proof ("we design & ship real products end-to-end").
- **Why:** **customer (P0)**, **CEO (P1)**. The only "work" shown today is an unreleased kids'
  game; there's nothing to verify you can deliver. One credible case study beats the current page.
- **Need from you:** 1–3 projects you can describe (even NDA'd/anonymized) with a rough outcome.
- **Decision/notes:** _______________________________________________

### A3 · Healthcare evidence — or dial the claim back — `[ ]`  · effort **M**
- **What:** back the "medical software / health interoperability" claim with concrete signals —
  HL7/FHIR, EHR integrations, HIPAA/BAA posture, where PHI lives — and at least one engagement.
  If there's nothing to show yet, **soften the claim** to what's true.
- **Why:** **customer (P0)**, **CEO (P0)**. An unbacked healthcare claim reads as a *red flag* to
  the exact (skeptical, compliance-driven) buyer it targets — worse than making no claim.
- **Need from you:** is healthcare real current work, a direction, or aspirational? Any standards
  you actually work in? Compliance posture?
- **Decision/notes:** _______________________________________________

### A4 · Sharpen the positioning — `[ ]`  · effort **S–M**
- **What:** rewrite the hero to name **who** you serve and **why you**, and replace the two "vibe"
  cards ("Happiness", "Adventure") with concrete capabilities (e.g. Integrations/APIs, Product
  engineering, Health-data). Move from "we build anything interesting" → an ownable position.
- **Why:** **CEO (P0)**, **customer (P1)**. "We build custom solutions… anything interesting" is
  the most commoditized sentence in software services and reads hobbyist for a paid engagement.
- **Need from you:** the one buyer/vertical you most want, and which 3 things you actually sell.
- **Decision/notes:** _______________________________________________

---

## Tier B — Technical / growth (bigger calls · mostly I can do solo)

### B1 · Analytics + Search Console — `[ ]`  · effort **S–M**
- **What:** privacy-friendly, cookieless analytics (**Cloudflare Web Analytics** — you already use
  CF — or Plausible/Fathom) + verify in **Google Search Console**, submit the sitemap, add Bing.
  Track contact submits and QuillQuest "notify me" as goals.
- **Why:** **SEO (P1)**. Zero measurement today — no idea what converts. Cookieless keeps
  QuillQuest's "no tracking" story intact (it's on the marketing site, not the app).
- **Need from you:** pick a tool; do the GSC domain verification (DNS TXT at your registrar).
- **Decision/notes:** _______________________________________________

### B2 · Drop FontAwesome (perf) — `[ ]`  · effort **M**
- **What:** replace the ~10 icons used with inline SVGs and remove FontAwesome entirely.
- **Why:** **dev (P1)**, **SEO (P1)**. ~233 KB of webfonts (incl. a 114 KB *brands* font for one
  Apple logo) + most of a 320 KB CSS file, for ~10 glyphs. Biggest single perf win on the site.
- **Need from you:** nothing — I can do this.
- **Decision/notes:** _______________________________________________

### B3 · Real "notify me" email capture — `[ ]`  · effort **M**
- **What:** replace the raw `mailto:` with a one-field email capture + instant confirmation
  ("You're on the list — one email, at launch."). Reuse the Cloudflare Worker pattern.
- **Why:** **parent (P1)**, **customer (P1)**. The mailto opens a blank draft most people won't
  send, gives no confirmation, and signals a tiny operation — and it's the #1 action you want now.
- **Need from you:** OK to add a tiny Worker + a store (KV / a Google Sheet / Resend audience).
- **Decision/notes:** _______________________________________________

### B4 · Tasteful motion — `[ ]`  · effort **M**
- **What:** subtle scroll-reveal on section entrances (opacity + small rise) and a very slow
  hero-spiral drift — all gated behind `prefers-reduced-motion`.
- **Why:** **UI/UX (P2)**. The site is almost entirely static; for a studio that *sells craft*,
  a little considered motion signals it. (Risk: overdone motion reads as generic — keep it minimal.)
- **Need from you:** a yes; taste check on the result.
- **Decision/notes:** _______________________________________________

### B5 · Apex `malcom.io` → `https://www.malcom.io` as a 301 — `[ ]`  · effort **S**
- **What:** change the apex domain forward from a **302 → http** to a **301 → https** (direct).
- **Why:** **SEO (P1)**. Today `malcom.io` 302-redirects to *http* www (insecure hop + weaker
  signal). Apple's listing points at www, so this is also a safety net for the required URLs.
- **Need from you:** this is a **registrar/DNS setting** (the apex is managed there, not in the
  repo) — you'd flip it; I can't. Set the domain forward to permanent (301) + https.
- **Decision/notes:** _______________________________________________

### B6 · (Optional) Cloudflare in front of Pages for caching — `[ ]`  · effort **M**
- **What:** front the site with Cloudflare and cache hashed `*.js/*.css/*.woff2/*.webp` long/immutable.
- **Why:** **dev (P2)**, **SEO (P2)**. GitHub Pages caps everything at `max-age=600`, so repeat
  visitors re-validate constantly. Only worth it if repeat-visit perf matters.
- **Decision/notes:** _______________________________________________

---

## Tier C — Smaller polish / nice-to-haves (deferred, low urgency)

### C1 · QuillQuest — parent-trust additions — `[ ]`
- **Educational proof (parent P0):** show real sample words per level, an educator/reading-specialist
  quote, and/or a 20–30s silent demo GIF of hear‑it → spell‑it → feedback. _(needs your content.)_ · **M**
- **"See what my kid would do" (parent P1):** a small grade/age selector revealing sample words +
  starting level — makes the "adaptive" claim tangible. _(needs the word lists.)_ · **M**
- **Screen-time reassurance (parent P2):** one line like "built for short 5–10 min sessions" and a
  no-guilt framing of streaks; optional screen-time FAQ. · **S**
- **"Free — and staying free" (parent P2):** an explicit line to kill the "what's the catch?" doubt. · **S**
- **Tighten "Coming to the App Store — 2026" (parent P2):** narrow to a season ("Fall 2026") once known. · **S**

### C2 · Engineering hygiene — `[ ]`
- **Zoneless + OnPush (dev P2):** app is near-static and already uses signals; going zoneless drops
  the zone.js polyfill and the manual `NgZone.run()` in the Turnstile callback. · **M**
- **`strict` + `strictTemplates` in tsconfig (dev P2):** modern Angular defaults; stronger safety. · **S–M**
- **Turnstile: lazy-load per-page + use `turnstile.ready()` (dev/SEO P2):** the script loads on all 5
  pages though only the contact form needs it; the render uses `setTimeout` polling vs the ready hook. · **M**
- **More tests (dev P2):** `SeoTitleStrategy`, `ToastService`, contact submit/validation are untested
  though `npm test` gates the deploy. · **M**
- **Surface Worker error messages (dev P2):** the Worker returns useful errors; the UI shows one generic toast. · **S**
- **Move full-res source PNGs out of `public/` (dev P1-ish):** ~5–6 MB of unused originals deploy
  (incl. unused iPad screenshots); the site serves only the small WebPs. · **S**

### C3 · SEO / PWA polish — `[ ]`
- **Web manifest fields (SEO P2):** add `start_url`, `id`, `scope`, `lang`, `description`, a maskable
  icon, and `display: minimal-ui` if you want basic installability. · **S**
- **Root `/` meta-refresh target (SEO P2):** point it at `/home/` to shave a 301 hop. · **S**
- **LCP preload + lighter OG PNG (SEO P2):** minor; `fetchpriority` already covers most of it. · **S**

---

## Decisions log

| Date | Item | Decision | Notes |
| --- | --- | --- | --- |
| 2026‑07‑07 | PR #17 polish | Merged & shipped | — |
|  |  |  |  |
|  |  |  |  |

---

## Appendix — condensed findings by reviewer

Full context behind the roadmap. Severities are each reviewer's own (P0 = broken/blocking,
P1 = should fix, P2 = polish).

### UI/UX designer
- **P1** Hero eyebrow too small vs the display headline → **shipped (#17)** as a hero-only bump.
- **P2** Home hero has a large vertical dead-zone on tall screens → **shipped (#17)** (tighter min-height/padding).
- **P2** Site is almost entirely static — add tasteful scroll-reveal + slow spiral drift → **B4**.
- **P2** QuillQuest CTA hierarchy inverted (loud button did nothing) → **shipped (#17)**.
- **P2** Desktop gallery gave no "scrolls sideways" cue → **shipped (#17)** (fade cue).
- **P2** Nav/footer inconsistent between studio and QuillQuest → **shipped (#17)** (unified footer).
- **P2** Contact errors could show before interaction → **shipped (#17)** (gated on touched).
- **P2** Custom links lacked focus-visible → **shipped (#17)**.
- **KEEP:** the mono-display type system, the dark palette + card system, the snap-gallery mechanic.

### Frontend engineer
- **P1** Live `/auth` "auth works!" placeholder → **shipped (#17)** (removed).
- **P1** Full FontAwesome for ~10 icons (~233 KB fonts) → **B2**.
- **P1** ~7–8 MB unused source PNGs deployed (incl. iPad shots) → **C2**.
- **P1** Contact form: broken Enter-to-submit + imperative validation → **shipped (#17)**.
- **P2** Unused `@angular/animations` → **shipped (#17)** (removed).
- **P2** No `strict`/`strictTemplates`; **P2** default change detection / zone.js → **C2**.
- **P2** Turnstile script on every page + `setTimeout` polling → **C2**.
- **P2** Stale README → **shipped (#17)** (fixed). **P2** minimal tests → **C2**. **P2** dead CSS → **shipped (#17)**.
- **P2** GH Pages 10-min cache cap → **B6**. **P2** Worker errors not surfaced → **C2**.
- **KEEP:** correct hydration handling, clean `SeoTitleStrategy`, modern Angular idioms, solid deploy workflow.

### Accessibility (WCAG 2.2 AA)
- **P0** Contact-form errors not identified/associated/announced → **shipped (#17)**.
- **P1** No `<main>` on home; **P1** no skip link; **P1** required not programmatic; **P1** form border
  fails non-text contrast; **P1** gallery not keyboard-operable → **all shipped (#17)**.
- **P2** Placeholder contrast, `prefers-reduced-motion`, decorative-icon `aria-hidden`, `aria-current`,
  nav labels, coming-soon pseudo-button, footer target size, redundant textarea aria → **shipped (#17)**.
- **KEEP:** contrast is strong almost everywhere (muted grey passes), focus visibility intact, honeypot
  correct, heading structure clean, labels associated, zoom/reflow allowed, `lang="en"`.

### SEO / performance
- **P1** Canonical/og:url/sitemap pointed at no-slash URLs that 301 → **shipped (#17)** (trailing slash).
- **P1** No JSON-LD → **shipped (#17)** (Org, WebSite, MobileApplication, FAQPage, Breadcrumbs).
- **P1** Apex 302→http → **B5**. **P1** FontAwesome bloat → **B2**. **P1** No analytics/Search Console → **B1**.
- **P2** Turnstile on every page → **C2**. **P2** root meta-refresh target → **C3**. **P2** manifest minimal → **C3**.
  **P2** GH Pages caching → **B6**. **P2** LCP preload / OG PNG weight → **C3**.
- **KEEP:** per-route titles/descriptions/OG (incl. image dims), system fonts (no FOUT), non-render-blocking
  CSS, real 404, robots+sitemap, complete favicon set.

### Prospective customer (B2B buyer)
- **P0** Healthcare claim with zero evidence → **A3**. **P0** No portfolio/case studies → **A2**.
  **P0** No About/team/founder → **A1**.
- **P1** Hero/value cards vague & inward-looking → **A4**. **P1** QuillQuest (unreleased kids' game) as the
  only showcase undercuts B2B credibility → **A2**. **P1** Contact conversion thin (no next step/SLA/visible email) → **B3**/A.
- **P2** Unsupported "on budget/on schedule"; no process/engagement model; no social proof/tenure → **A2/A4**.
- **KEEP:** the site itself proves front-end craft; the QuillQuest privacy/support pages are the most
  trust-building content; "private/healthy by design" is a real, ownable ethos; healthcare is the right niche.

### Parent (QuillQuest audience)
- **P0** "It teaches" is all claims, no proof (no sample words, educator voice, or demo) → **C1**.
- **P1** "Made by a parent" is anonymous → **A1**. **P1** raw `mailto:` is high-friction → **B3**.
  **P1** No "what my specific kid would do" preview → **C1** (grade selector).
- **P2** Screen-time reassurance thin / streak worry; **P2** "free forever" certainty; **P2** "2026" vague → **C1**.
- **P2** ~12 px mobile horizontal jiggle → **shipped (#17)** (fixed).
- **KEEP:** instant clarity + the badge row; the privacy policy (biggest trust win); honest FAQ;
  "fun, not childish", recorded voices, the Ivy/Owen/Mia characters; clean mobile layout.

### CEO / brand strategist
- **P0** The founder is the brand and is entirely absent → **A1**. **P0** No position ("we build anything") → **A4**.
  **P0** Healthcare claim with no evidence is worse than none → **A3**.
- **P1** QuillQuest is your best proof and it's siloed off the studio pitch → **A2**.
  **P1** The site's job is ambiguous; the funnel serves neither goal → **A4**/A2.
- **KEEP:** QuillQuest's page is the copy model to emulate; design/brand/technical execution is genuinely
  good; "private by design" is ownable; healthcare is the right strategic bet — *back it with evidence.*
