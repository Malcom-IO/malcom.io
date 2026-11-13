import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

/**
 * The navbar's light / dark switch. The theme itself lives on <html> and is
 * owned by ThemeService; CSS picks the icon and the word from it, so the
 * button's markup is the same in either theme and needs no state of its own.
 */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle"
      title="Switch between light and dark mode"
      (click)="theme.toggle()"
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
      <!-- The visible word is the button's name: it says what a press will do. -->
      <span class="theme-toggle-text"
        ><span class="theme-toggle-to-light">Light</span
        ><span class="theme-toggle-to-dark">Dark</span
        ><span class="visually-hidden"> mode</span></span
      >
    </button>
  `,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
}
