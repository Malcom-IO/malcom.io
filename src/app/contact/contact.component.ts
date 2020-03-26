import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  animations: [
    // the fade-in/fade-out animation.
    trigger('fadeAnimation', [

      // the "in" style determines the "resting" state of the element when it is visible.
      state('in', style({ opacity: 1 })),

      // fade in when created. this could also be written as transition('void => *')
      transition(':enter', [
        style({ opacity: 0 }),
        animate(600)
      ]),

      // fade out when destroyed. this could also be written as transition('void => *')
      transition(':leave',
        animate(600, style({ opacity: 0 })))
    ])
  ]
})
export class ContactComponent implements OnInit {

  contactForm: FormGroup = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    subject: new FormControl(''),
    body: new FormControl(''),
    recaptcha: new FormControl('')
  });

  allowSubmit: boolean;

  constructor(private httpClient: HttpClient, private toastr: ToastrService) { }

  ngOnInit(): void {
  }

  logForm() {
    const name: string = this.contactForm.value.name;
    const email: string = this.contactForm.value.email;
    const subject: string = this.contactForm.value.subject;
    const body: string = this.contactForm.value.body;

    console.log('name:', name);
    console.log('email:', email);
    console.log('subject:', subject);
    console.log('body:', body);
  }

  resolved(captchaResponse: string): void {
    if (captchaResponse && captchaResponse !== null) {
      this.allowSubmit = true;
    } else {
      this.allowSubmit = false;
    }
  }

  validateEmail() {
    const requiredErrors: ValidationErrors = Validators.required(this.contactForm.controls.email);
    if (requiredErrors === null) {
      const emailErrors: ValidationErrors = Validators.email(this.contactForm.controls.email);
      this.contactForm.controls.email.setErrors(emailErrors);
    } else {
      this.contactForm.controls.email.setErrors(requiredErrors);
    }
  }

  validateName() {
    const requiredErrors: ValidationErrors = Validators.required(this.contactForm.controls.name);
    if (requiredErrors !== null) {
      this.contactForm.controls.name.setErrors(requiredErrors);
    }
  }

  validateRecaptcha() {
    const requiredErrors: ValidationErrors = Validators.required(this.contactForm.controls.recaptcha);
    if (requiredErrors !== null) {
      this.contactForm.controls.recaptcha.setErrors(requiredErrors);
    }
  }

  validate(): void {
    this.validateName();
    this.validateEmail();
    this.validateRecaptcha();
  }

  test(): void {

    this.showGenericSuccess();
    this.showGenericError();

    // this.validateRecaptcha();
    // console.log('recaptcha:', this.contactForm.value.recaptcha);
    // this.contactForm.reset();

    // this.showError = true;

    // setTimeout(() => {
    //   this.showError = false;
    // }, 5000);
  }

  async submitContactForm(): Promise<void> {

    this.validate();

    if (this.contactForm.valid) {
      const data: any = {
        name: this.contactForm.value.name,
        email: this.contactForm.value.email,
        body: this.contactForm.value.body,
        subject: this.contactForm.value.subject,
        recaptchaResponse: this.contactForm.value.recaptcha
      };

      const url = 'https://1kpckwhgib.execute-api.us-west-2.amazonaws.com/prod/contact-us';
      const result: any = await this.httpClient.post(url, data).toPromise();

      if (result.success) {
        this.allowSubmit = false;
        this.contactForm.reset();
        this.showGenericSuccess();
      } else {
        this.showGenericError();
        console.error(result);
      }
    }
  }

  showGenericSuccess() {
    this.toastr.success('Thank you for your interest in Malcom IO.', 'Message Sent!');
  }

  showGenericError() {
    const msg = 'Looks like something went wrong, we apologize for any inconvenience. Please try again later.';
    this.toastr.error(msg, 'Message Not Sent.');
  }
}
