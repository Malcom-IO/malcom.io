import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'malcom.io';
  private readonly doc = inject(DOCUMENT);

  /**
   * Move keyboard focus to the current page's <main>. A bare href="#main-content"
   * resolves against <base href="/"> to "/#main-content", causing a cross-path
   * navigation instead of a same-page skip — so intercept and focus directly.
   */
  skipToMain(event: Event): void {
    event.preventDefault();
    const main = this.doc.getElementById('main-content');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
      main.scrollIntoView();
    }
  }
}
