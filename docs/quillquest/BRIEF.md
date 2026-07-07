# QuillQuest launch pages — brief for malcom.io

**Handoff from the QuillQuest project (`/Users/marcus/projects/quillquest`).**
Task: publish three pages on malcom.io that QuillQuest's App Store submission
needs. The page copy lives alongside this file — see `privacy.md`, `support.md`,
`landing.md` in this folder (they're the source of truth for wording).

## Context
QuillQuest is a free, offline iOS **spelling game for grades 3–8 (roughly ages 8–14)** —
no ads, no tracking, no accounts, collects nothing. It grades itself and adapts to each kid.
It's being submitted to the App Store as
a **free** app (shared to help families; no monetization). Apple **requires** a
hosted Privacy Policy URL and a Support URL; a marketing/landing page is optional
but wanted (it doubles as the "share with families" link).

## What to build
Create three pages, **matching malcom.io's existing framework, layout, styling,
navigation, and conventions** (you know the stack — place files and wire routing/
nav the way the rest of the site does). Use the site's header/footer/theme. Adapt
the Markdown in `privacy.md` / `support.md` / `landing.md` to fit the site.

Canonical URLs (entered into App Store Connect, so keep them stable):

| Page | URL path | Source file | App Store Connect field |
|---|---|---|---|
| Privacy Policy | `/quillquest/privacy` | `privacy.md` | Privacy Policy URL (required) |
| Support | `/quillquest/support` | `support.md` | Support URL (required) |
| Landing / product | `/quillquest` | `landing.md` | Marketing URL (optional) |

## Owner fill-ins (leave as clearly-marked TODOs)
- Privacy Policy **effective date**.
- **App Store download link** on the landing page (add once the listing is live).

Contact email throughout: **contact@malcom.io**.

## Artwork (in `assets/` beside this brief — self-contained, high-res, transparent)
Use these on the **landing page** (`/quillquest`). Optimize/resize for web per the
site's image pipeline (the sources are ~1000px PNGs, ~1 MB each).
- **`assets/quillquest-icon.png`** (1024², gold quill on navy starfield) — the hero
  logo / brand mark, and a good favicon/social-share (og:image) source.
- **`assets/buddy-ivy.png`**, **`buddy-owen.png`**, **`buddy-mia.png`** (transparent
  character mascots — Ivy the hedgehog, Owen the porcupine, Mia the echidna) — use as
  friendly accents (e.g. a row near "For the whole family" or the hero). They're
  transparent PNGs, so they sit on any background.
The privacy/support pages don't need artwork — keep them plain.

## Screenshots (App Store screens — Marcus will add these)
The landing page should have a **screenshots section** (a clean, responsive gallery).
These are the same shots used for the App Store listing. The final **6-shot set** (iPhone
1320×2868 + iPad 2064×2752): **1 Home** (Quest Map) · **2 Trail** (winding level map) ·
**3 Round** (character + letter tiles + keyboard) · **4 Reveal** (correct spelling + "you
wrote") · **5 Summary** (Stage Clear! stars + XP) · **6 Players** (multi-kid profiles).
Per-shot captions are in the QuillQuest repo at `docs/app-store-listing.md` (the canonical
source for all copy). Design the gallery for ~6 tall phone screenshots; don't block the
page's launch on them.

> **Canonical copy:** all listing/marketing wording (subtitle, description, captions, and the
> corrected **grades 3–8 / ~ages 8–14** audience) lives in the QuillQuest repo
> `docs/app-store-listing.md`. This folder's `landing.md` / `privacy.md` / `support.md` are
> the page-ready adaptations; keep them in sync with that file.

## Notes
- Keep it consistent with the rest of malcom.io (personal site — match its tone/design).
- Privacy/support are functional-legal — keep them simple and readable; don't over-design.
- The landing page can be more polished; leave room for App Store screenshots later.
- Don't invent claims — everything in the copy is verified true of the app (offline, collects nothing, free, no IAP).
- When done, confirm the three canonical URLs resolve so Marcus can paste them into App Store Connect.
