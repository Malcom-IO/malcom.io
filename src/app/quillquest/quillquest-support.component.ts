import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from './quillquest-shell.component';

interface Faq {
  q: string;
  a: string;
}

@Component({
  selector: 'app-quillquest-support',
  imports: [QuillquestShellComponent, RouterLink],
  templateUrl: './quillquest-support.component.html',
  styleUrl: './doc.scss',
})
export class QuillquestSupportComponent {
  readonly faqs: Faq[] = [
    { q: 'Does it work offline?', a: 'Yes — fully offline, no internet needed to play.' },
    {
      q: 'Does it collect any data?',
      a: 'No. Progress, name, and avatar stay on the device.',
    },
    {
      q: 'Can multiple kids share one device?',
      a: 'Yes — each kid gets their own profile, progress, streak, and avatar (Settings → Players).',
    },
    {
      q: 'How do I set it up?',
      a: "Open the app, enter your child's age, and they're playing.",
    },
    { q: 'Is there a cost?', a: 'No — free, with no ads and no in-app purchases.' },
    { q: 'How do I reset progress?', a: 'Settings → Reset all progress.' },
  ];
}
