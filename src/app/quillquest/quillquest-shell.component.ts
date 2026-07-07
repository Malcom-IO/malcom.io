import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoComponent } from '../shared/logo.component';

/**
 * Shared chrome for the three QuillQuest pages (landing / privacy / support):
 * the fixed navbar and the cross-linked footer. Page content is projected
 * into <main> via <ng-content>, so every page stays consistent and the
 * three canonical URLs always cross-link.
 */
@Component({
  selector: 'app-quillquest-shell',
  imports: [DatePipe, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <header id="header">
      <nav class="navbar navbar-expand-lg fixed-top malcom-navbar" data-bs-theme="dark">
        <div class="container">
          <a class="navbar-brand" routerLink="/home"><app-logo></app-logo></a>
          <ul class="navbar-nav ms-auto flex-row gap-4">
            <li class="nav-item"><a class="nav-link" routerLink="/home">Home</a></li>
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/quillquest"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: false }"
                >QuillQuest</a
              >
            </li>
          </ul>
        </div>
      </nav>
    </header>

    <main><ng-content></ng-content></main>

    <footer class="page-footer">
      <div
        class="container py-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
      >
        <a routerLink="/home" class="text-decoration-none"><app-logo></app-logo></a>
        <nav class="d-flex flex-wrap gap-4 font-monospace small" aria-label="QuillQuest pages">
          <a routerLink="/home">Home</a>
          <a routerLink="/quillquest">QuillQuest</a>
          <a routerLink="/quillquest/support">Support</a>
          <a routerLink="/quillquest/privacy">Privacy</a>
        </nav>
        <div class="text-muted-2 font-monospace small">© {{ currentDate | date: 'yyyy' }} Malcom IO</div>
      </div>
    </footer>
  `,
})
export class QuillquestShellComponent {
  currentDate = new Date();
}
