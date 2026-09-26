import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from '../quillquest/quillquest-shell.component';

/**
 * Privacy policy for www.malcom.io itself: the only personal data this site
 * handles is what the contact form sends. QuillQuest's policy lives on
 * quillquest.net. Reuses the QuillQuest shell for the navbar and footer.
 */
@Component({
  selector: 'app-privacy',
  imports: [RouterLink, QuillquestShellComponent],
  template: `
    <app-quillquest-shell>
      <section class="section privacy">
        <div class="container">
          <div class="privacy-inner">
            <p class="eyebrow">Malcom IO LLC &middot; Portland, Oregon</p>
            <h1 class="h-section">Privacy policy</h1>
            <p class="text-muted-2 font-monospace small">
              Effective <mark class="fact">[date]</mark>
            </p>

            <p>
              This policy covers www.malcom.io, run by Malcom IO LLC, Portland, Oregon. It does not
              cover our products. QuillQuest has its own policy at
              <a href="https://quillquest.net/privacy">quillquest.net/privacy</a>.
            </p>

            <h2 class="h5 fw-semibold mt-4">What we collect</h2>
            <p>
              Only what you type into the contact form: your name, email address, subject and
              message. We use it to reply to you and for nothing else. We do not sell it, share
              it for marketing or add you to a mailing list.
            </p>

            <h2 class="h5 fw-semibold mt-4">How the form works</h2>
            <p>
              The form is protected by Cloudflare Turnstile, which loads only when you start
              using the form. Turnstile checks that you are a person, and to do that Cloudflare
              processes your IP address and browser signals. Your message is then sent to us by
              email through Resend, our email delivery provider. We keep messages in our business
              email for <mark class="fact">[retention period]</mark>, then delete them.
            </p>

            <h2 class="h5 fw-semibold mt-4">What we don't do</h2>
            <p>
              This site uses no analytics, advertising or tracking cookies, and no third-party
              scripts other than Turnstile. The site is hosted on GitHub Pages, which, like any
              web host, may log basic request data such as IP addresses.
            </p>

            <h2 class="h5 fw-semibold mt-4">Your choices</h2>
            <p>
              To see, correct or delete what you've sent us, use the
              <a [routerLink]="['/']" fragment="contact">contact form</a> and choose the subject
              "Privacy request." We'll respond within <mark class="fact">30</mark> days. You
              don't need an account, and we'll never ask for more than what's needed to find
              your message.
            </p>

            <h2 class="h5 fw-semibold mt-4">Changes</h2>
            <p class="mb-0">If this policy changes, we'll update the date above.</p>
          </div>
        </div>
      </section>
    </app-quillquest-shell>
  `,
  styles: `
    .privacy {
      padding-top: 8rem;
    }
    .privacy-inner {
      max-width: 44rem;
    }
    .privacy p {
      color: var(--muted);
    }
    .privacy a {
      color: var(--brand-bright);
    }
  `,
})
export class PrivacyComponent {}
