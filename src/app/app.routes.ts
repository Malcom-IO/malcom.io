import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuillquestComponent } from './quillquest/quillquest.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { SeoData } from './shared/seo-title-strategy';

// Purpose-built 1200×630 share card (twitter:card is summary_large_image, so a
// square icon would get cropped). Regenerate with scripts/make-og-card.mjs if edited.
const QQ_OG_IMAGE = 'https://www.malcom.io/assets/quillquest/og-card.png';

// ------------------------------------------------------------------ JSON-LD
// The founder, linked both ways with ORG. `sameAs` names the canonical profiles so
// search engines (and anyone checking) can tell the real Marcus from a lookalike.
const PERSON_ID = 'https://www.malcom.io/#marcus';
const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Marcus Malcom',
  jobTitle: 'Founder & Principal Engineer',
  url: PERSON_ID,
  image: 'https://www.malcom.io/assets/img/marcus-640.webp',
  worksFor: { '@type': 'Organization', name: 'Malcom IO LLC', url: 'https://www.malcom.io/' },
  sameAs: ['https://www.linkedin.com/in/marcusmalcom/', 'https://github.com/Malcom-IO'],
};

const ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Malcom IO',
  legalName: 'Malcom IO LLC',
  url: 'https://www.malcom.io/',
  logo: 'https://www.malcom.io/assets/img/logo.png',
  // No email here on purpose: the contact form (with Turnstile) is the ask, and
  // JSON-LD is the most scrapable place on the page to put an address.
  founder: { '@id': PERSON_ID },
  sameAs: ['https://github.com/Malcom-IO'],
  description:
    'Custom healthcare software built to be audited: 21 CFR Part 11 audit trails, HIPAA-aware ' +
    'backends, eCRF/EDC workflows and health data interoperability.',
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
    'A free learning game for grades 3–8 — spelling, times tables, division and touch typing. ' +
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
    title: 'Malcom IO — Custom software for regulated healthcare',
    data: {
      jsonLd: [ORG, PERSON, WEBSITE],
    } satisfies SeoData,
  },
  // Keep the old /home URL working — it redirects to the canonical root.
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    // The studio's marketing page for QuillQuest. The product's own site is
    // quillquest.net (a separate repo) — privacy, support and For Schools
    // live there and were retired from here on 2026-08-17; /support and /for-schools
    // 404 by design, no redirect stubs. /privacy is the STUDIO's own policy now (see
    // below) and links to quillquest.net/privacy for anyone who lands on it for the game.
    path: 'quillquest',
    component: QuillquestComponent,
    title: 'QuillQuest — Spelling, times tables, division & typing | Malcom IO',
    data: {
      ogTitle: 'QuillQuest',
      // Kept under ~155 chars so search results don't truncate it.
      description:
        'A free learning game for grades 3–8: spelling, times tables, division and touch ' +
        'typing. No ads, no tracking, no accounts. Play it at quillquest.net.',
      ogImage: QQ_OG_IMAGE,
      ogImageAlt: 'QuillQuest — spelling, times tables, division and touch typing for kids',
      jsonLd: QUILLQUEST_APP,
    } satisfies SeoData,
  },
  {
    // The studio's own policy (contact form only). QuillQuest's policy stays on
    // quillquest.net; this page links to it for anyone who lands here looking for it.
    path: 'privacy',
    component: PrivacyComponent,
    title: 'Privacy policy | Malcom IO',
    data: {
      description:
        'What www.malcom.io collects (only what you type into the contact form), how the form ' +
        'works, and how to ask for your message to be deleted.',
    } satisfies SeoData,
  },
  { path: '**', redirectTo: '' },
];
