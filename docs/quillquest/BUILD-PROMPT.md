# BUILD PROMPT — QuillQuest pages on malcom.io

**For the Claude session working in `/Users/marcus/projects/malcom.io`.** Do exactly this.

## Goal
Ship the three real QuillQuest pages the App Store submission needs, replacing the current
placeholder. They must match malcom.io's existing framework, layout, styling, header/footer,
and conventions (Angular + SSR + Bootstrap; follow the `home` component's patterns and the
`SeoData` title strategy).

**Canonical URLs (already promised to App Store Connect — keep these paths exact):**
| Page | Route | Page content (source of truth) | App Store Connect field |
|---|---|---|---|
| Landing / product | `/quillquest` | `docs/quillquest/landing.md` | Marketing URL (optional) |
| Privacy Policy | `/quillquest/privacy` | `docs/quillquest/privacy.md` | Privacy Policy URL (**required**) |
| Support | `/quillquest/support` | `docs/quillquest/support.md` | Support URL (**required**) |

## Current state (what to fix)
- `src/app/quillquest/quillquest.component.ts` + `.html` is a **placeholder** with WRONG copy
  ("Craft Your Story", "Magical Worlds", "Compete & Collect") and `#` links. **Replace it** — QuillQuest
  is a **spelling game**, not a story/adventure RPG.
- `src/app/app.routes.ts` only has `/quillquest`. **Add** `/quillquest/privacy` and `/quillquest/support`.

## Build
1. **Landing (`/quillquest`)** — rewrite `QuillquestComponent` from `landing.md`. Real spelling-game
   copy, a features section, a **responsive screenshot gallery**, and a "Get it free on the App Store"
   CTA (leave the link as a clearly-marked TODO until the listing is live). Use the character art as
   friendly accents and the icon as the hero/brand mark.
2. **Privacy (`/quillquest/privacy`)** — new component + route, content from `privacy.md`. Plain,
   readable, legal — don't over-design. Leave the **effective date** as a marked TODO.
3. **Support (`/quillquest/support`)** — new component + route, content from `support.md`. Simple FAQ +
   the contact email. Cross-link Privacy.
4. Wire all three routes with proper `title` + `SeoData` `description` (match the existing pattern in
   `app.routes.ts`). SSR-safe (guard any `window`/`document`). Cross-link the three pages in a small
   footer nav.

## Artwork — already staged and ready under `public/assets/quillquest/` (reference as `/assets/quillquest/…`)
- `icon.png` — 1024² gold-quill brand mark. Hero logo + **og:image** source (there's an `ogImage` TODO
  in the `/quillquest` route data — fill it, e.g. `https://www.malcom.io/assets/quillquest/icon.png`).
- `buddy-ivy.png`, `buddy-owen.png`, `buddy-mia.png` — 600² transparent character mascots (Ivy, Owen,
  Mia). Friendly accents; sit on any background.
- `screenshots/iphone/qq-iphone-{1-home,2-trail,3-round,4-reveal,5-summary,6-players}.png` (1320×2868)
- `screenshots/ipad/qq-ipad-{1-home,2-trail,3-round,4-reveal,5-summary,6-players}.png` (2064×2752)

**Screenshot gallery order + captions** (same as the App Store listing):
1. **Home** — "Spelling worth leveling up"
2. **Trail** — "An adventure map to every word"
3. **Round** — "Hear it. Spell it. Nail it."
4. **Reveal** — "Feedback that actually teaches"
5. **Summary** — "Every word is a win"
6. **Players** — "One app, every kid"

Use the iPhone shots as the primary gallery (portrait). The iPad shots are optional/secondary — use if
the layout benefits. **Optimize** the images to the site's approach (compress, and consider WebP +
responsive `srcset`); the character PNGs and screenshots are staged full-quality but heavier than ideal.

## Hard rules
- **Audience is grades 3–8 (roughly ages 8–14)** — never print "ages 10–13" or "phonics".
- **Don't invent claims.** Everything in `landing.md` / `privacy.md` / `support.md` is verified true of
  the app (offline, collects nothing, free, no IAP, real recorded voices with a device-TTS fallback).
  The full, fact-checked listing (subtitle, keywords, description, accuracy notes) lives in the QuillQuest
  repo at `docs/app-store-listing.md` if you need more wording — but the three `.md` files here are the
  page-ready source.
- Contact email everywhere: **contact@malcom.io**.
- Leave clearly-marked TODOs for: App Store download link, Privacy effective date, og:image URL.

## Definition of done
- `ng build` passes; all three routes render with real content and no placeholder text remains.
- The three canonical URLs resolve and cross-link; images load from `/assets/quillquest/…`.
- Tell Marcus the three URLs are live so he can paste them into App Store Connect.
