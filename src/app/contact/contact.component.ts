import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, ViewChild, ElementRef, inject, PLATFORM_ID } from '@angular/core';
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
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha-2';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RecaptchaModule, RecaptchaFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  animations: [
    // the fade-in/fade-out animation.
    trigger('fadeAnimation', [
      // the "in" style determines the "resting" state of the element when it is visible.
      state('in', style({ opacity: 1 })),

      // fade in when created.
      transition(':enter', [style({ opacity: 0 }), animate(600)]),

      // fade out when destroyed.
      transition(':leave', animate(600, style({ opacity: 0 }))),
    ]),
  ],
})
export class ContactComponent {
  contactForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    subject: new FormControl(''),
    body: new FormControl(''),
    recaptcha: new FormControl(''),
  });

  @ViewChild('scrollPoint') scrollPoint!: ElementRef;

  allowSubmit = false;

  // reCAPTCHA manipulates the DOM and needs `window`, so it must only render in the
  // browser — never during static prerendering.
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(
    private httpClient: HttpClient,
    private toast: ToastService,
  ) {}

  resolved(captchaResponse: string | null): void {
    this.allowSubmit = !!captchaResponse;
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

  validateRecaptcha(): void {
    const requiredErrors: ValidationErrors | null = Validators.required(
      this.contactForm.controls.recaptcha,
    );
    if (requiredErrors !== null) {
      this.contactForm.controls.recaptcha.setErrors(requiredErrors);
    }
  }

  validate(): void {
    this.validateName();
    this.validateEmail();
    this.validateRecaptcha();
  }

  async submitContactForm(): Promise<void> {
    this.validate();

    if (this.contactForm.valid) {
      const data = {
        name: this.contactForm.value.name,
        email: this.contactForm.value.email,
        body: this.contactForm.value.body,
        subject: this.contactForm.value.subject,
        recaptchaResponse: this.contactForm.value.recaptcha,
      };

      const url = 'https://1kpckwhgib.execute-api.us-west-2.amazonaws.com/prod/contact-us';
      const result = await firstValueFrom(
        this.httpClient.post<{ success: boolean }>(url, data),
      );

      if (result.success) {
        this.allowSubmit = false;
        this.contactForm.reset();
        this.showGenericSuccess();
      } else {
        this.showGenericError();
        console.error(result);
      }
    } else {
      this.scrollPoint.nativeElement.scrollIntoView({ behavior: 'smooth' });
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
