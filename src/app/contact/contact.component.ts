import {
  Component,
  ViewChild,
  ElementRef,
  inject,
  PLATFORM_ID,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../shared/toast.service';
import { IconComponent } from '../shared/icon.component';

declare const turnstile: {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (el?: HTMLElement) => void;
};

// Cloudflare Worker (Turnstile verify + Resend email). Replaces the old AWS Lambda.
const CONTACT_ENDPOINT = 'https://malcom-contact.malcomio.workers.dev';
const TURNSTILE_SITE_KEY = '0x4AAAAAADwMRSPJhDBDL3BT';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  // The Turnstile widget (@if isBrowser) renders only in the browser, so the
  // form's DOM differs between prerender and client. Skip hydration for the
  // whole component — ngSkipHydration is only valid on a component host, not
  // on an arbitrary inner element (that raises NG0504).
  host: { ngSkipHydration: 'true' },
})
export class ContactComponent implements AfterViewInit {
  contactForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl(''),
    body: new FormControl(''),
    website: new FormControl(''), // honeypot — humans leave this empty
  });

  @ViewChild('turnstile') turnstileEl?: ElementRef<HTMLElement>;

  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly doc = inject(DOCUMENT);

  turnstileToken: string | null = null;
  sending = false;

  constructor(
    private httpClient: HttpClient,
    private toast: ToastService,
  ) {}

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.loadTurnstileScript();
      this.renderTurnstile();
    }
  }

  /**
   * Inject the Cloudflare Turnstile script only when the contact form mounts
   * (it lives on the home page). Keeps the third-party request off every other
   * route. renderTurnstile() polls for the global until it finishes loading.
   */
  private loadTurnstileScript(): void {
    const src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    if (this.doc.querySelector(`script[src="${src}"]`)) {
      return;
    }
    const script = this.doc.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    this.doc.head.appendChild(script);
  }

  /** Render the Turnstile widget, waiting for its async script to load. */
  private renderTurnstile(attempts = 0): void {
    if (!this.turnstileEl) {
      return;
    }
    if (typeof turnstile === 'undefined') {
      if (attempts < 100) {
        setTimeout(() => this.renderTurnstile(attempts + 1), 100);
      }
      return;
    }
    turnstile.render(this.turnstileEl.nativeElement, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'dark',
      callback: (token: string) => this.zone.run(() => (this.turnstileToken = token)),
      'error-callback': () => this.zone.run(() => (this.turnstileToken = null)),
      'expired-callback': () => this.zone.run(() => (this.turnstileToken = null)),
    });
  }

  private resetTurnstile(): void {
    this.turnstileToken = null;
    if (this.isBrowser && typeof turnstile !== 'undefined' && this.turnstileEl) {
      try {
        turnstile.reset(this.turnstileEl.nativeElement);
      } catch {
        /* widget may not be mounted yet */
      }
    }
  }

  async submitContactForm(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    if (!this.turnstileToken) {
      this.toast.error('Please complete the verification check below.', 'Almost there');
      const reduce = !!this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.turnstileEl?.nativeElement.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'center',
      });
      return;
    }

    this.sending = true;
    const data = {
      name: this.contactForm.value.name,
      email: this.contactForm.value.email,
      subject: this.contactForm.value.subject,
      body: this.contactForm.value.body,
      website: this.contactForm.value.website, // honeypot
      token: this.turnstileToken,
    };

    try {
      const result = await firstValueFrom(
        this.httpClient.post<{ success?: boolean }>(CONTACT_ENDPOINT, data),
      );
      if (result?.success) {
        this.contactForm.reset();
        this.resetTurnstile();
        this.showGenericSuccess();
      } else {
        this.showGenericError();
      }
    } catch {
      this.showGenericError();
      this.resetTurnstile();
    } finally {
      this.sending = false;
    }
  }

  /** Move focus to the first invalid field so keyboard/screen-reader users can fix it. */
  private focusFirstInvalid(): void {
    if (!this.isBrowser) {
      return;
    }
    const el = this.doc.querySelector<HTMLElement>(
      '.contact-form input.ng-invalid, .contact-form textarea.ng-invalid',
    );
    el?.focus();
  }

  showGenericSuccess(): void {
    this.toast.success('Thank you for your interest in Malcom IO.', 'Message Sent!');
  }

  showGenericError(): void {
    const msg =
      'Looks like something went wrong, we apologize for any inconvenience. Please try again later.';
    this.toast.error(msg, 'Message Not Sent.');
  }
}
