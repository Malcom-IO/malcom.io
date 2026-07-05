import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactComponent } from '../contact/contact.component';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-home',
  imports: [DatePipe, RouterLink, ContactComponent, LogoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  currentDate = new Date();
}
