import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-quillquest',
  imports: [DatePipe, RouterLink],
  templateUrl: './quillquest.component.html',
  styleUrl: './quillquest.component.scss',
})
export class QuillquestComponent {
  currentDate = new Date();

  // TODO: replace placeholder copy/links/screenshots with the real QuillQuest content.
  readonly appStoreUrl = '#';
  readonly playStoreUrl = '#';
  readonly privacyUrl = '#';

  readonly features: Feature[] = [
    {
      icon: 'fa-feather-pointed',
      title: 'Craft Your Story',
      description: 'Placeholder — describe the core gameplay loop that makes QuillQuest fun.',
    },
    {
      icon: 'fa-wand-magic-sparkles',
      title: 'Magical Worlds',
      description: 'Placeholder — highlight the worlds, levels, or adventures players explore.',
    },
    {
      icon: 'fa-trophy',
      title: 'Compete & Collect',
      description: 'Placeholder — call out achievements, leaderboards, or collectibles.',
    },
  ];

  // Placeholder screenshot slots — swap in real image paths under /assets/quillquest/.
  readonly screenshots = [1, 2, 3, 4];
}
