import {
  Component,
  ViewChild,
  ElementRef,
  inject,
  PLATFORM_ID,
  NgZone,
  ChangeDetectorRef,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../shared/toast.service';
import { RouterLink } from '@angular/router';
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
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  // The Turnstile widget (@if isBrowser) renders only in the browser, so the
  // form's DOM differs between prerender and client. Skip hydration for the
  // whole component — ngSkipHydration is only valid on a component host, not
  // on an arbitrary inner element (that raises NG0504).
  host: { ngSkipHydration: 'true' },
})
export class ContactComponent {
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private destroyed = false;

  turnstileToken: string | null = null;
  sending = false;
  /** Waiting on a challenge that is still solving — distinct from actually sending. */
  verifying = false;
  private turnstileStarted = false;

  constructor(
    private httpClient: HttpClient,
    private toast: ToastService,
  ) {
    this.destroyRef.onDestroy(() => (this.destroyed = true));
  }

  /**
   * Load and render Turnstile the first time someone touches the form.
   *
   * This form lives on the home page, and the `**` route sends every unknown
   * path there too — so rendering on mount issued a challenge on every visit,
   * crawlers included, while siteverify only ever runs on a real submit. That
   * skew is what makes Cloudflare report the widget as unverified, and it
   * spends challenge quota on traffic that was never going to submit anything.
   * Deferring to first interaction ties one challenge to one real intent.
   *
   * Idempotent — the template fires it from more than one event on purpose.
   */
  protected ensureTurnstile(): void {
    if (!this.isBrowser || this.turnstileStarted) {
      return;
    }
    this.turnstileStarted = true;
    this.loadTurnstileScript();
    this.renderTurnstile();
  }

  /**
   * Inject the Cloudflare Turnstile script. Keeps the third-party request off
   * every visitor who never touches the form. renderTurnstile() polls for the
   * global until it finishes loading.
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
    // Every give-up below re-arms ensureTurnstile() so a later interaction retries
    // rather than finding the widget latched off. This rescues a script that simply
    // arrived late; it cannot rescue one that never arrives, because
    // loadTurnstileScript() dedupes on the tag it already added.
    if (!this.turnstileEl) {
      this.turnstileStarted = false;
      return;
    }
    if (typeof turnstile === 'undefined') {
      if (attempts < 100) {
        setTimeout(() => this.renderTurnstile(attempts + 1), 100);
      } else {
        this.turnstileStarted = false;
      }
      return;
    }
    try {
      turnstile.render(this.turnstileEl.nativeElement, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback: (token: string) => this.zone.run(() => (this.turnstileToken = token)),
        'error-callback': () => this.zone.run(() => (this.turnstileToken = null)),
        'expired-callback': () => this.zone.run(() => (this.turnstileToken = null)),
      });
    } catch {
      this.turnstileStarted = false;
    }
  }

  /**
   * Wait out a challenge that is already in flight. Bounded, never blocking forever.
   *
   * Sized for the worst realistic case this deferral creates: someone on a slow link
   * who reads the page for a while, autofills name and email, and hits Send seconds
   * later — that click has to cover the script download, render() and the challenge
   * itself. Four seconds did not; this does, and nobody who already has a token
   * waits at all.
   */
  private async awaitTurnstileToken(timeoutMs = 8000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!this.turnstileToken && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
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
    // Re-entrancy guard. The button stays enabled while we wait on the challenge —
    // disabling the element that currently has focus drops that focus to <body>, and
    // a keyboard user would have to tab back through the whole form to retry — so a
    // second Enter press can land here mid-wait. Refuse it rather than start a
    // second wait or burn a second token.
    if (this.sending || this.verifying) {
      return;
    }
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    // The widget is deferred to first interaction, so a fast submit — autofill,
    // then straight to Send — can arrive while the challenge is still solving.
    // Start it in case something slipped past the template's triggers, then give
    // it a moment: telling someone they failed a check that is still running is
    // the one outcome worse than the wait.
    this.ensureTurnstile();
    if (!this.turnstileToken) {
      this.verifying = true;
      try {
        await this.awaitTurnstileToken();
      } finally {
        // Cleared in an async continuation, which does NOT mark this view dirty:
        // the zone ticks, the tick skips the view, and the button keeps the stale
        // label until some unrelated event repaints it. Ask for the check.
        this.verifying = false;
        this.cdr.markForCheck();
      }
    }

    // The wait is long enough to outlive this component — the form is on the home
    // page and someone can route away mid-check. Error toasts are sticky by design
    // (WCAG 2.2.1), so firing one now would plant an un-actionable message on
    // whatever page they landed on, about a message they never sent.
    if (this.destroyed) {
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
      this.cdr.markForCheck(); // same async-continuation staleness as the wait above
    }
  }

  /**
   * The Send button's label. `verifying` and `sending` are deliberately different
   * states: one is waiting on Cloudflare, the other is a request in flight, and
   * saying "Sending…" during the first is a lie that can end in an error toast.
   */
  protected get sendLabel(): string {
    if (this.sending) {
      return 'Sending…';
    }
    if (this.verifying) {
      return 'Checking…';
    }
    return 'Send message';
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
    this.toast.success('Thanks. Marcus will reply himself.', 'Message sent');
  }

  showGenericError(): void {
    const msg =
      'Looks like something went wrong, we apologize for any inconvenience. Please try again later.';
    this.toast.error(msg, 'Message Not Sent.');
  }
}
