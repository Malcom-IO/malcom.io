import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuillquestComponent } from './quillquest/quillquest.component';
import { QuillquestPrivacyComponent } from './quillquest/quillquest-privacy.component';
import { QuillquestSupportComponent } from './quillquest/quillquest-support.component';
import { AuthComponent } from './auth/auth.component';
import { SeoData } from './shared/seo-title-strategy';

const QQ_OG_IMAGE = 'https://www.malcom.io/assets/quillquest/icon.png';

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
    } satisfies SeoData,
  },
  {
    path: 'auth',
    component: AuthComponent,
    title: 'Sign In — Malcom IO',
    data: { robots: 'noindex' } satisfies SeoData,
  },
  { path: '**', redirectTo: '/home' },
];
