import { Component, inject } from '@angular/core';
import { DatePipe, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactComponent } from '../contact/contact.component';
import { LogoComponent } from '../shared/logo.component';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-home',
  imports: [DatePipe, RouterLink, ContactComponent, LogoComponent, RevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  currentDate = new Date();

  private readonly doc = inject(DOCUMENT);

  /**
   * Smooth-scroll to an in-page section. A bare href="#id" resolves against
   * <base href="/"> to "/#id", which triggers a route change and reloads the
   * page at the top — so we intercept the click and scroll directly instead.
   */
  scrollToSection(id: string, event: Event): void {
    event.preventDefault();
    this.doc.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
