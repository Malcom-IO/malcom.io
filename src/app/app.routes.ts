import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuillquestComponent } from './quillquest/quillquest.component';
import { SeoData } from './shared/seo-title-strategy';

// Purpose-built 1200×630 share card (twitter:card is summary_large_image, so a
// square icon would get cropped). Regenerate with scripts/make-og-card.mjs if edited.
const QQ_OG_IMAGE = 'https://www.malcom.io/assets/quillquest/og-card.png';

// ------------------------------------------------------------------ JSON-LD
const ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Malcom IO',
  url: 'https://www.malcom.io/',
  logo: 'https://www.malcom.io/assets/img/logo.png',
  email: 'contact@malcom.io',
  description:
    'Malcom IO builds custom software — medical software, health interoperability, ' +
    'and the QuillQuest mobile game.',
};

const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Malcom IO',
  url: 'https://www.malcom.io/',
};

const QUILLQUEST_APP = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'QuillQuest',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'EducationalApplication',
  // The app's own site, not this page. The product moved to its own domain,
  // quillquest.net, on 2026-09-04 (it lived at quillquest.malcom.io from 2026-08-04);
  // this page is the studio's marketing surface for it. (The page's own
  // canonical/og:url still resolve to /quillquest/.)
  url: 'https://quillquest.net/',
  image: QQ_OG_IMAGE,
  description:
    'A free learning game for grades 3–8 — spelling, times tables and touch typing. ' +
    'The iOS and Android apps play offline. No ads, no tracking, and no accounts.',
  audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
  // Live on both stores — App Store (2026-07-15) + Google Play (2026-07-21).
  // InStock reflects that the app is now downloadable.
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  publisher: { '@type': 'Organization', name: 'Malcom IO' },
};

export const routes: Routes = [
  {
    // Serve the homepage at the ROOT so the bare domain (the URL people share)
    // prerenders to dist/browser/index.html with real title/description/OG/JSON-LD
    // instead of a blank "Redirecting" stub. (description omitted → canonical
    // DEFAULT_DESCRIPTION from the SEO strategy.)
    path: '',
    component: HomeComponent,
    title: 'Malcom IO — Building Better',
    data: {
      jsonLd: [ORG, WEBSITE],
    } satisfies SeoData,
  },
  // Keep the old /home URL working — it redirects to the canonical root.
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    // The studio's marketing page for QuillQuest. The product's own site is
    // quillquest.net (a separate repo) — privacy, support and For Schools
    // live there and were retired from here on 2026-08-17. Those three paths now
    // 404 by design: no redirect stubs, the page's copy points at that domain.
    path: 'quillquest',
    component: QuillquestComponent,
    title: 'QuillQuest — Spelling, times tables & typing | Malcom IO',
    data: {
      ogTitle: 'QuillQuest',
      description:
        'QuillQuest is a free learning game for grades 3–8 — spelling, times tables and touch ' +
        'typing. No ads, no tracking, no accounts. Built by Malcom IO; play it at ' +
        'quillquest.net.',
      ogImage: QQ_OG_IMAGE,
      ogImageAlt: 'QuillQuest — spelling, times tables and touch typing for kids',
      jsonLd: QUILLQUEST_APP,
    } satisfies SeoData,
  },
  { path: '**', redirectTo: '' },
];
