import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';
import type { WidgetOptions } from 'oregon-uhp-explainer';
import { ThemeService } from '../shared/theme.service';

/**
 * The open-source Oregon UHP calculator (npm `oregon-uhp-explainer`, source at
 * github.com/Malcom-IO/oregon-uhp-explainer, MIT), pinned to an exact version in
 * package.json and mounted in the browser only. With `header: false` the page
 * around it must state the title, the source snapshot and that the calculator
 * is unofficial.
 *
 * Its stylesheet ships with this component, so it loads only on pages that use
 * the calculator. The rules are all scoped under `.oregon-uhp`, hence no view
 * encapsulation. The widget's colors are mapped to the site's tokens, and its
 * theme follows the site's toggle.
 */
@Component({
  selector: 'app-uhp-calculator',
  template: '',
  styleUrls: [
    '../../../node_modules/oregon-uhp-explainer/oregon-uhp.css',
    './uhp-calculator.component.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UhpCalculatorComponent {
  readonly show = input.required<'household' | 'employer'>();

  private readonly theme = inject(ThemeService).theme;

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    let destroy: (() => void) | null = null;
    let gone = false;
    destroyRef.onDestroy(() => {
      gone = true;
      destroy?.();
    });

    // The widget reads its theme once at mount; afterwards the site toggle is
    // passed on through the attribute the widget's CSS watches.
    effect(() => {
      const theme = this.theme();
      for (const root of host.querySelectorAll<HTMLElement>('.oregon-uhp')) {
        root.dataset['uhpTheme'] = theme;
      }
    });

    // Browser only: imported here, the widget never runs during prerendering.
    afterNextRender(() => {
      import('oregon-uhp-explainer').then(
        ({ mount }) => {
          if (gone) return;
          const options: WidgetOptions = {
            show: this.show(),
            header: false,
            sectionTitles: false,
            headingLevel: 3,
            theme: this.theme(),
          };
          destroy = mount(host, options);
        },
        (error) => console.error('The Oregon UHP calculator did not load.', error),
      );
    });
  }
}
