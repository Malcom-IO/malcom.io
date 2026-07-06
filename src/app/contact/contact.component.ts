import {
  Component,
  ViewChild,
  ElementRef,
  inject,
  PLATFORM_ID,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormGroup,
  FormControl,
  Validators,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../shared/toast.service';

declare const turnstile: {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (el?: HTMLElement) => void;
};

// Cloudflare Worker (Turnstile verify + Resend email). Replaces the old AWS Lambda.
const CONTACT_ENDPOINT = 'https://malcom-contact.malcomio.workers.dev';
const TURNSTILE_SITE_KEY = '0x4AAAAAADwMRSPJhDBDL3BT';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements AfterViewInit {
  contactForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    subject: new FormControl(''),
    body: new FormControl(''),
    website: new FormControl(''), // honeypot — humans leave this empty
  });

  @ViewChild('scrollPoint') scrollPoint!: ElementRef;
  @ViewChild('turnstile') turnstileEl?: ElementRef<HTMLElement>;

  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);

  turnstileToken: string | null = null;
  sending = false;

  constructor(
    private httpClient: HttpClient,
    private toast: ToastService,
  ) {}

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.renderTurnstile();
    }
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

  validateEmail(): void {
    const requiredErrors: ValidationErrors | null = Validators.required(
      this.contactForm.controls.email,
    );
    if (requiredErrors === null) {
      const emailErrors: ValidationErrors | null = Validators.email(
        this.contactForm.controls.email,
      );
      this.contactForm.controls.email.setErrors(emailErrors);
    } else {
      this.contactForm.controls.email.setErrors(requiredErrors);
    }
  }

  validateName(): void {
    const requiredErrors: ValidationErrors | null = Validators.required(
      this.contactForm.controls.name,
    );
    if (requiredErrors !== null) {
      this.contactForm.controls.name.setErrors(requiredErrors);
    }
  }

  validate(): void {
    this.validateName();
    this.validateEmail();
  }

  async submitContactForm(): Promise<void> {
    this.validate();

    if (!this.contactForm.valid || !this.turnstileToken) {
      this.scrollPoint.nativeElement.scrollIntoView({ behavior: 'smooth' });
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

  showGenericSuccess(): void {
    this.toast.success('Thank you for your interest in Malcom IO.', 'Message Sent!');
  }

  showGenericError(): void {
    const msg =
      'Looks like something went wrong, we apologize for any inconvenience. Please try again later.';
    this.toast.error(msg, 'Message Not Sent.');
  }
}
