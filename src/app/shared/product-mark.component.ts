import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * The Shyre family marks, inlined. Paths are copied from the products' own
 * sources: the tree on two hills from Shyre's src/app/icon.svg, and the
 * shield-framed tree from Shyre Ward's Resources/AppIcon.svg. The fill is the
 * green Shyre Ward uses on a dark ground. Decorative only — always aria-hidden.
 */
@Component({
  selector: 'app-product-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    class="product-mark"
    viewBox="0 0 32 32"
    aria-hidden="true"
    focusable="false">
    @if (name === 'ward') {
      <clipPath [attr.id]="clipId"><path [attr.d]="shield" /></clipPath>
      <path [attr.d]="shield" fill="#333f33" />
      <g [attr.clip-path]="'url(#' + clipId + ')'">
        <g transform="translate(2.3 4.0) scale(0.86)">
          @for (d of tree; track d) {
            <path [attr.d]="d" fill="#5cbe61" />
          }
        </g>
      </g>
      <path [attr.d]="shield" fill="none" stroke="#5cbe61" stroke-width="1.3" stroke-linejoin="round" />
    } @else {
      @for (d of tree; track d) {
        <path [attr.d]="d" fill="#5cbe61" />
      }
    }
  </svg>`,
  styles: [
    `
      .product-mark {
        width: 2.75rem;
        height: 2.75rem;
        display: block;
      }
    `,
  ],
})
export class ProductMarkComponent {
  @Input({ required: true }) name!: 'shyre' | 'ward';

  readonly clipId = 'ward-shield-clip';
  readonly shield =
    'M 16 1.6 L 29 5.4 L 29 15 C 29 22.6, 23.6 28.2, 16 31.2 C 8.4 28.2, 3 22.6, 3 15 L 3 5.4 Z';
  readonly tree = [
    'M 4.4 12.4 C 5.2 7.4, 9.6 4.4, 13.8 5.6 C 15.6 2.4, 20.6 2.6, 22.3 6.2 C 26.7 6.4, 28.4 10.2, 26.5 13.4 C 24.6 16.5, 19 16.7, 16 15.5 C 11.4 16.8, 5.6 16.1, 4.4 12.4 Z',
    'M 14.8 15.2 L 17.2 15.2 L 18.6 25 L 13.4 25 Z',
    'M 0 26.8 Q 6.4 20.4, 12.4 25.4 Q 20 19, 32 23.2 L 32 32 L 0 32 Z',
  ];
}
