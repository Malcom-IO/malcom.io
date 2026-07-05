import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div
      class="toast-container position-fixed top-0 end-0 p-3"
      style="z-index: 1090;"
      aria-live="polite"
      aria-atomic="true"
    >
      @for (t of toast.toasts(); track t.id) {
        <div
          class="toast show align-items-center border-0 mb-2"
          [class.text-bg-success]="t.type === 'success'"
          [class.text-bg-danger]="t.type === 'error'"
          role="alert"
        >
          <div class="d-flex">
            <div class="toast-body">
              @if (t.title) {
                <strong class="d-block">{{ t.title }}</strong>
              }
              {{ t.message }}
            </div>
            <button
              type="button"
              class="btn-close btn-close-white me-2 m-auto"
              (click)="toast.dismiss(t.id)"
              aria-label="Close"
            ></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
