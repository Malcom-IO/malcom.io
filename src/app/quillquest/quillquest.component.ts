import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from './quillquest-shell.component';
import { RevealDirective } from '../shared/reveal.directive';

const A = '/assets/quillquest';

interface Trust {
  icon: string;
  title: string;
  body: string;
}

interface Shot {
  src: string;
  srcset: string;
  alt: string;
  caption: string;
}

// [file stem, alt text, gallery caption] — order matches the App Store listing.
const SHOT_META: [string, string, string][] = [
  ['qq-iphone-1-home', 'QuillQuest home screen', 'Spelling worth leveling up'],
  ['qq-iphone-2-trail', 'The QuillQuest adventure trail', 'An adventure map to every word'],
  ['qq-iphone-3-round', 'Spelling a word during a round', 'Hear it. Spell it. Nail it.'],
  ['qq-iphone-4-reveal', 'Answer reveal with feedback', 'Feedback that actually teaches'],
  ['qq-iphone-5-summary', 'End-of-round summary', 'Every word is a win'],
  ['qq-iphone-6-players', 'Multiple player profiles', 'One app, every kid'],
];

@Component({
  selector: 'app-quillquest',
  imports: [QuillquestShellComponent, RouterLink, RevealDirective],
  templateUrl: './quillquest.component.html',
  styleUrl: './quillquest.component.scss',
})
export class QuillquestComponent {
  // TODO (launch day): set to the App Store listing URL once the app is live;
  // both CTAs flip from "Coming soon" to a real download link automatically.
  readonly appStoreUrl: string | null = null;

  // Lightweight "notify me" fallback while the listing isn't live yet.
  readonly notifyMailto =
    'mailto:contact@malcom.io?subject=Notify%20me%20when%20QuillQuest%20launches';

  readonly iconSrc = `${A}/web/icon-256.webp`;
  readonly iconSrcset = `${A}/web/icon-256.webp 256w, ${A}/web/icon-512.webp 512w`;

  readonly heroShot = {
    src: `${A}/web/qq-iphone-1-home-660.webp`,
    srcset: `${A}/web/qq-iphone-1-home-440.webp 440w, ${A}/web/qq-iphone-1-home-660.webp 660w`,
  };

  readonly trust: Trust[] = [
    {
      icon: 'fa-shield-halved',
      title: 'Truly private',
      body: 'Plays fully offline, collects nothing, and sends nothing anywhere. No ads, trackers, accounts, or chat.',
    },
    {
      icon: 'fa-graduation-cap',
      title: 'Actually teaches',
      body: 'A graded curriculum, mastery-based levels, and spaced-repetition review of the words your kid misses.',
    },
    {
      icon: 'fa-heart',
      title: 'Healthy by design',
      body: 'Optional reminders (off by default) and streaks that reward just showing up — no nagging.',
    },
    {
      icon: 'fa-people-roof',
      title: 'For the whole family',
      body: 'Each kid gets their own profile, buddy, and avatar.',
    },
  ];

  readonly perks: string[] = [
    '10 levels of hand-graded words (~3,500), from Sprout to the Bee Level',
    'Friendly characters — Ivy, Owen & Mia — read every word aloud in real recorded voices',
    'Miss a word? It shows the correct spelling and exactly where you slipped',
    'Ranks, stars, badges, and unlockable themes to earn',
    'Practice packs: compound words, homophones, prefixes & suffixes, and “words I missed”',
  ];

  readonly buddies = [
    { name: 'Ivy', src: `${A}/web/buddy-ivy-256.webp` },
    { name: 'Owen', src: `${A}/web/buddy-owen-256.webp` },
    { name: 'Mia', src: `${A}/web/buddy-mia-256.webp` },
  ];

  readonly shots: Shot[] = SHOT_META.map(([file, alt, caption]) => ({
    src: `${A}/web/${file}-660.webp`,
    srcset: `${A}/web/${file}-440.webp 440w, ${A}/web/${file}-660.webp 660w`,
    alt,
    caption,
  }));
}
