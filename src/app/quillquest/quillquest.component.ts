import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from './quillquest-shell.component';
import { RevealDirective } from '../shared/reveal.directive';
import { IconComponent } from '../shared/icon.component';

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

// [file stem, alt text, gallery caption] — covers both realms (spelling + times
// tables) plus the shared systems. The Quest Map shot leads (it shows both realm
// tabs and the level trail), then a spelling pair, a times pair, and players.
const SHOT_META: [string, string, string][] = [
  ['qq-iphone-1-home', 'QuillQuest Quest Map — pick Spelling or Times Tables, then climb the level trail', 'Two ways to play, one adventure'],
  ['qq-iphone-2-spelling', 'Spelling a word by ear during a round', 'Hear it. Spell it. Nail it.'],
  ['qq-iphone-3-reveal', 'Answer reveal showing the correct spelling and where you slipped', 'Feedback that actually teaches'],
  ['qq-iphone-4-times', 'Answering a times-tables fact on the number pad', 'Times tables that feel like a game'],
  ['qq-iphone-6-summary', 'End-of-stage summary with stars and XP', 'Every answer is a win'],
  ['qq-iphone-7-players', 'Multiple player profiles', 'One app, every kid'],
];

@Component({
  selector: 'app-quillquest',
  imports: [QuillquestShellComponent, RouterLink, RevealDirective, IconComponent],
  templateUrl: './quillquest.component.html',
  styleUrl: './quillquest.component.scss',
})
export class QuillquestComponent {
  // Live on both stores — the CTAs render a real download button for each. Each
  // flips independently: setting one back to null reverts that store to its
  // "coming soon" chip (both null → the "Email me at launch" pre-launch state).
  readonly appStoreUrl: string | null = 'https://apps.apple.com/app/id6788993070'; // LIVE 2026-07-15
  readonly googlePlayUrl: string | null = 'https://play.google.com/store/apps/details?id=io.malcom.quillquest'; // LIVE 2026-07-21

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
      icon: 'shield-halved',
      title: 'Truly private',
      body: 'Plays offline — no internet needed to play. Collects nothing, and shares no personal data with anyone. No ads, trackers, accounts, or chat.',
    },
    {
      icon: 'graduation-cap',
      title: 'Actually teaches',
      body: 'A graded curriculum in both subjects, mastery-based levels, and spaced-repetition review of whatever your kid misses.',
    },
    {
      icon: 'heart',
      title: 'Healthy by design',
      body: 'Optional reminders (off by default) and streaks that reward just showing up — no nagging.',
    },
    {
      icon: 'people-roof',
      title: 'For the whole family',
      body: 'Each kid gets their own profile, buddy, and avatar.',
    },
  ];

  readonly perks: string[] = [
    'Two realms on one engine — spell words by ear, or race the times-tables trail',
    'Spelling: hear each word in a real recorded voice (Ivy, Owen & Mia), then spell it out — 10 levels of hand-graded words from Sprout to the Bee Level',
    'Times Tables: type every answer on a number pad — no multiple-choice — climbing 10 steps from Trailhead to Summit',
    'Miss one? Spelling shows the correct spelling and where you slipped; Times Tables shows the product with a skip-count',
    'Master a level to unlock the next — never by grinding points — and whatever you miss comes back on a smart review schedule',
    'One “you” across both realms: XP, ranks, badges, six themes, and a daily streak',
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
