import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoComponent } from '../shared/logo.component';

/**
 * Chrome for the QuillQuest marketing page: the fixed navbar and the footer,
 * matching the studio pages'. Page content is projected into <main> via
 * <ng-content>.
 *
 * It wrapped three pages until 2026-08-17, when privacy / support / For Schools
 * moved to QuillQuest's own site (now quillquest.net); only the landing page uses
 * it now, but it stays a component so the chrome isn't duplicated inline.
 */
@Component({
  selector: 'app-quillquest-shell',
  imports: [DatePipe, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <header id="header">
      <nav
        class="navbar navbar-expand-lg fixed-top malcom-navbar"
        data-bs-theme="dark"
        aria-label="Primary"
      >
        <div class="container">
          <a class="navbar-brand" routerLink="/"><app-logo></app-logo></a>
          <ul class="navbar-nav ms-auto flex-row gap-4">
            <li class="nav-item"><a class="nav-link" routerLink="/">Home</a></li>
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/quillquest"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                [routerLinkActiveOptions]="{ exact: false }"
                >QuillQuest</a
              >
            </li>
            <li class="nav-item">
              <a class="nav-link" [routerLink]="['/']" fragment="contact">Contact</a>
            </li>
          </ul>
        </div>
      </nav>
    </header>

    <main id="main-content"><ng-content></ng-content></main>

    <footer class="page-footer">
      <div
        class="container py-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
      >
        <a routerLink="/" class="text-decoration-none"><app-logo></app-logo></a>
        <nav class="d-flex flex-wrap gap-4 font-monospace small page-footer-nav" aria-label="Footer">
          <a routerLink="/">Home</a>
          <a routerLink="/quillquest">QuillQuest</a>
          <a [routerLink]="['/']" fragment="contact">Contact</a>
        </nav>
        <div class="text-muted-2 font-monospace small">© {{ currentDate | date: 'yyyy' }} Malcom IO</div>
      </div>
    </footer>
  `,
})
export class QuillquestShellComponent {
  currentDate = new Date();
}
