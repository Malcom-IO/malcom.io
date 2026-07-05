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
    this.show('success', title, message);
  }

  error(message: string, title = ''): void {
    this.show('error', title, message);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(type: ToastType, title: string, message: string): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, title, message }]);
    setTimeout(() => this.dismiss(id), 6000);
  }
}
