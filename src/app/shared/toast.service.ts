import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

/**
 * Minimal, dependency-free toast notifications.
 * Replaces ngx-toastr (which does not yet publish an Angular 22 build).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  success(message: string, title = ''): void {
    this.show('success', title, message, 6000);
  }

  error(message: string, title = ''): void {
    // Errors/guidance require action, so they stay until manually closed
    // (WCAG 2.2.1 Timing Adjustable) — the toast has a close button.
    this.show('error', title, message, null);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(type: ToastType, title: string, message: string, autoDismissMs: number | null): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, title, message }]);
    if (autoDismissMs !== null) {
      setTimeout(() => this.dismiss(id), autoDismissMs);
    }
  }
}
