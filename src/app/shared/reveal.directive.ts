import { Directive, ElementRef, PLATFORM_ID, AfterViewInit, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Fades + rises an element into view as it scrolls in. SSR-safe: during
 * prerender nothing is added, so the static HTML (and no-JS/reduced-motion
 * users) always see fully-visible content. Elements already in view on load
 * (above the fold) are skipped so there's no flash.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const node = this.el.nativeElement;
    // Don't hide anything already on screen (e.g. the first section under the hero).
    if (node.getBoundingClientRect().top < window.innerHeight * 0.85) {
      return;
    }
    node.classList.add('reveal-init');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('reveal-in');
            io.unobserve(node);
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(node);
  }
}
