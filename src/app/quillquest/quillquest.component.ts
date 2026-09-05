import { Component } from '@angular/core';
import { QuillquestShellComponent } from './quillquest-shell.component';
import { IconComponent } from '../shared/icon.component';

const A = '/assets/quillquest';

/**
 * The studio's marketing page for QuillQuest — deliberately light.
 *
 * QuillQuest's own site is quillquest.net (built from a separate repo), and
 * it owns everything a player, parent or school actually needs: the game itself,
 * support, the privacy policy, For Schools. This page exists so the product is
 * visibly Malcom IO's, and to send people there.
 */
@Component({
  selector: 'app-quillquest',
  imports: [QuillquestShellComponent, IconComponent],
  templateUrl: './quillquest.component.html',
  styleUrl: './quillquest.component.scss',
})
export class QuillquestComponent {
  /** The product site. Must stay reachable — the store listings point at it. */
  readonly siteUrl = 'https://quillquest.net';

  readonly appStoreUrl = 'https://apps.apple.com/app/id6788993070'; // LIVE 2026-07-15
  readonly googlePlayUrl = 'https://play.google.com/store/apps/details?id=io.malcom.quillquest'; // LIVE 2026-07-21

  readonly iconSrc = `${A}/web/icon-256.webp`;
  readonly iconSrcset = `${A}/web/icon-256.webp 256w, ${A}/web/icon-512.webp 512w`;

  readonly heroShot = {
    src: `${A}/web/qq-iphone-1-home-660.webp`,
    srcset: `${A}/web/qq-iphone-1-home-440.webp 440w, ${A}/web/qq-iphone-1-home-660.webp 660w`,
  };
}
