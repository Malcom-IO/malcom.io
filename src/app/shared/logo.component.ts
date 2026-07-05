import { Component } from '@angular/core';

/** Brand lockup: the golden-spiral mark + the "Malcom IO" wordmark. */
@Component({
  selector: 'app-logo',
  template: `
    <img class="logo-mark" src="/assets/img/mark.svg" alt="" aria-hidden="true" width="30" height="30" />
    <span class="logo-word font-monospace"><span class="green-text fw-bold">Malcom</span> IO</span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        line-height: 1;
      }
      .logo-mark {
        width: 1.55em;
        height: 1.55em;
        flex: none;
        display: block;
      }
    `,
  ],
})
export class LogoComponent {}
