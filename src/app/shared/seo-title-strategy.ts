import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Per-route SEO metadata, attached via a route's `data`. */
export interface SeoData {
  description?: string;
  /** Overrides the share-card title (defaults to the route `title`). */
  ogTitle?: string;
  /** Absolute URL to a share image (defaults to the site logo). */
  ogImage?: string;
  /** Share-image pixel size — defaults to the standard 1200×630 card. */
  ogImageWidth?: number;
  ogImageHeight?: number;
  /** Alt text for the share image (defaults to the share title). */
  ogImageAlt?: string;
  /** e.g. 'noindex' to keep a page out of search results. */
  robots?: string;
}

const ORIGIN = 'https://www.malcom.io';
const DEFAULT_DESCRIPTION =
  'Malcom IO builds custom software — from medical software and health interoperability ' +
  'to the QuillQuest mobile game — with a passion for improving the world.';
const DEFAULT_IMAGE = `${ORIGIN}/assets/img/og-card.png`;

/**
 * Sets the document title AND per-route Open Graph / Twitter / description / canonical
 * tags on every navigation. Runs during prerendering too, so the tags are baked into
 * each route's static HTML (which is what social scrapers read).
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    if (title !== undefined) {
      this.title.setTitle(title);
    }

    // The deepest activated route carries the SEO data.
    let route: ActivatedRouteSnapshot = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const data = route.data as SeoData;

    const description = data.description ?? DEFAULT_DESCRIPTION;
    const shareTitle = data.ogTitle ?? title ?? 'Malcom IO';
    const image = data.ogImage ?? DEFAULT_IMAGE;
    const imageAlt = data.ogImageAlt ?? shareTitle;
    // Explicit dimensions/type let scrapers render the large card on the first
    // scrape instead of showing a blank/small one until they measure the file.
    const imageWidth = data.ogImageWidth ?? 1200;
    const imageHeight = data.ogImageHeight ?? 630;
    const imageType = image.endsWith('.webp')
      ? 'image/webp'
      : /\.jpe?g$/.test(image)
        ? 'image/jpeg'
        : 'image/png';
    const url = `${ORIGIN}${snapshot.url}`;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: shareTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:width', content: String(imageWidth) });
    this.meta.updateTag({ property: 'og:image:height', content: String(imageHeight) });
    this.meta.updateTag({ property: 'og:image:type', content: imageType });
    this.meta.updateTag({ property: 'og:image:alt', content: imageAlt });
    this.meta.updateTag({ name: 'twitter:title', content: shareTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:image:alt', content: imageAlt });

    if (data.robots) {
      this.meta.updateTag({ name: 'robots', content: data.robots });
    } else {
      this.meta.removeTag("name='robots'");
    }

    this.setCanonical(url);
  }

  private setCanonical(href: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
