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
  logo: 'https://www.malcom.io/apple-touch-icon.png',
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
  operatingSystem: 'iOS',
  applicationCategory: 'EducationalApplication',
  url: 'https://www.malcom.io/quillquest/',
  image: QQ_OG_IMAGE,
  description: 'A free, offline spelling game for grades 3–8 — no ads, no tracking, no accounts.',
  audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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
      {
        '@type': 'ListItem',
        position: 1,
        name: 'QuillQuest',
        item: 'https://www.malcom.io/quillquest/',
      },
      { '@type': 'ListItem', position: 2, name, item: `https://www.malcom.io${path}` },
    ],
  };
}

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    component: HomeComponent,
    title: 'Malcom IO — Building Better',
    data: {
      description:
        'Malcom IO builds custom software — medical software, health interoperability, ' +
        'and the QuillQuest mobile game — with a passion for improving the world.',
      jsonLd: [ORG, WEBSITE],
    } satisfies SeoData,
  },
  {
    path: 'quillquest',
    component: QuillquestComponent,
    title: 'QuillQuest — A spelling adventure for kids | Malcom IO',
    data: {
      ogTitle: 'QuillQuest',
      description:
        'QuillQuest is a free, offline spelling game for grades 3–8 — no ads, no tracking, ' +
        'no accounts. Hear a word, spell it, and climb the ranks.',
      ogImage: QQ_OG_IMAGE,
      ogImageAlt: 'QuillQuest — a spelling adventure for kids',
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
        'QuillQuest collects nothing and sends nothing off the device — no ads, tracking, ' +
        'analytics, or accounts. Private by design.',
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
        'Help and FAQ for QuillQuest, the free offline spelling game for kids. ' +
        'Questions? Email contact@malcom.io.',
      ogImage: QQ_OG_IMAGE,
      jsonLd: [FAQ_PAGE, quillquestBreadcrumb('Support', '/quillquest/support/')],
    } satisfies SeoData,
  },
  { path: '**', redirectTo: '/home' },
];
