import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactComponent } from '../contact/contact.component';
import { LogoComponent } from '../shared/logo.component';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-home',
  // In-page section links use routerLink + fragment (anchorScrolling is enabled),
  // so they deep-link, work cross-route, and honor prefers-reduced-motion.
  imports: [DatePipe, RouterLink, ContactComponent, LogoComponent, RevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  currentDate = new Date();
}
