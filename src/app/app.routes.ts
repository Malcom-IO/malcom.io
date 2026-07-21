import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuillquestComponent } from './quillquest/quillquest.component';
import { QuillquestPrivacyComponent } from './quillquest/quillquest-privacy.component';
import { QuillquestSupportComponent } from './quillquest/quillquest-support.component';
import { SeoData } from './shared/seo-title-strategy';
import { QUILLQUEST_FAQS } from './quillquest/quillquest-faqs';

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
  url: 'https://www.malcom.io/quillquest/',
  image: QQ_OG_IMAGE,
  description:
    'A free, offline learning game for grades 3–8 — spelling and times tables in one app, ' +
    'with no ads, no tracking, and no accounts.',
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

const FAQ_PAGE = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: QUILLQUEST_FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

function quillquestBreadcrumb(name: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.malcom.io/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'QuillQuest',
        item: 'https://www.malcom.io/quillquest/',
      },
      { '@type': 'ListItem', position: 3, name, item: `https://www.malcom.io${path}` },
    ],
  };
}

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
    path: 'quillquest',
    component: QuillquestComponent,
    title: 'QuillQuest — Spelling & times tables for kids | Malcom IO',
    data: {
      ogTitle: 'QuillQuest',
      description:
        'QuillQuest is a free, offline learning game for grades 3–8 — spelling and times tables ' +
        'in one app. No ads, no tracking, no accounts. Pick a realm and climb the ranks.',
      ogImage: QQ_OG_IMAGE,
      ogImageAlt: 'QuillQuest — spelling and times tables for kids',
      jsonLd: QUILLQUEST_APP,
    } satisfies SeoData,
  },
  {
    path: 'quillquest/privacy',
    component: QuillquestPrivacyComponent,
    title: 'QuillQuest — Privacy Policy | Malcom IO',
    data: {
      ogTitle: 'QuillQuest — Privacy Policy',
      description:
        'QuillQuest collects nothing personal — no ads, tracking, analytics, or accounts. ' +
        'The full game plays offline; optional extra audio downloads once, carrying no ' +
        'personal data. Private by design.',
      ogImage: QQ_OG_IMAGE,
      jsonLd: quillquestBreadcrumb('Privacy Policy', '/quillquest/privacy/'),
    } satisfies SeoData,
  },
  {
    path: 'quillquest/support',
    component: QuillquestSupportComponent,
    title: 'QuillQuest — Support | Malcom IO',
    data: {
      ogTitle: 'QuillQuest — Support',
      description:
        'Help and FAQ for QuillQuest, the free offline spelling & times-tables game for kids. ' +
        'Questions? Email contact@malcom.io.',
      ogImage: QQ_OG_IMAGE,
      jsonLd: [FAQ_PAGE, quillquestBreadcrumb('Support', '/quillquest/support/')],
    } satisfies SeoData,
  },
  { path: '**', redirectTo: '' },
];
