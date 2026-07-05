import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuillquestComponent } from './quillquest/quillquest.component';
import { AuthComponent } from './auth/auth.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Malcom IO — Building Better' },
  { path: 'quillquest', component: QuillquestComponent, title: 'QuillQuest — Malcom IO' },
  { path: 'auth', component: AuthComponent, title: 'Sign In — Malcom IO' },
  { path: '**', redirectTo: '/home' },
];
