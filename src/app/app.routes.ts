import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuillquestComponent } from './quillquest/quillquest.component';
import { AuthComponent } from './auth/auth.component';
import { SeoData } from './shared/seo-title-strategy';

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
    title: 'QuillQuest — Malcom IO',
    data: {
      ogTitle: 'QuillQuest',
      description: 'QuillQuest — a mobile game crafted by Malcom IO.',
      // TODO: add a dedicated share image once available, e.g.
      // ogImage: 'https://www.malcom.io/assets/quillquest/og.png',
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
