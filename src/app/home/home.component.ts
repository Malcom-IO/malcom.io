import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-home',
  imports: [DatePipe, RouterLink, ContactComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  currentDate = new Date();
}
