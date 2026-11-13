import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';

/** localStorage key; the inline script in index.html reads the same one. */
export const THEME_KEY = 'theme';
/** Browser-chrome color per theme; matches --ground in _tokens.scss. */
export const THEME_COLORS = { dark: '#20242a', light: '#f1f6f0' } as const;
export type Theme = keyof typeof THEME_COLORS;

/**
 * The navbar's light / dark switch. The theme lives on <html> (data-theme and
 * Bootstrap's data-bs-theme), stamped before first paint by the inline script
 * in index.html: a saved choice wins, otherwise the system setting. This button
 * flips it and saves the choice. CSS picks the icon from the theme on <html>, so
 * the prerendered markup is the same for every visitor; the pressed state for
 * assistive technology is filled in once the page is running.
 */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle"
      aria-label="Dark mode"
      title="Switch between light and dark mode"
      [attr.aria-pressed]="dark()"
      (click)="toggle()"
    >
      <svg class="theme-toggle-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <path
          d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          fill="none"
        />
      </svg>
      <svg class="theme-toggle-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11z" fill="currentColor" />
      </svg>
    </button>
  `,
})
export class ThemeToggleComponent {
  private readonly doc = inject(DOCUMENT);
  /** Null until the browser has run; then whether dark is on. */
  readonly dark = signal<boolean | null>(null);

  constructor() {
    afterNextRender(() => {
      const read = () =>
        this.dark.set(this.doc.documentElement.getAttribute('data-theme') !== 'light');
      read();
      // The inline script restamps the theme when the system setting changes and
      // nothing is saved; keep the pressed state in step. It runs first, having
      // registered first.
      this.doc.defaultView
        ?.matchMedia?.('(prefers-color-scheme: light)')
        .addEventListener?.('change', read);
    });
  }

  toggle(): void {
    const root = this.doc.documentElement;
    const next: Theme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    root.setAttribute('data-bs-theme', next);
    this.dark.set(next === 'dark');
    this.doc
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', THEME_COLORS[next]));
    try {
      this.doc.defaultView?.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private windows can refuse storage; the choice then lasts for this page.
    }
  }
}
