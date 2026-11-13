import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
/** The two parts of the site keep separate themes. */
export type ThemeSection = 'site' | 'oregon';

/** Browser-chrome color per theme; matches --ground in _tokens.scss. */
export const THEME_COLORS: Record<Theme, string> = { dark: '#20242a', light: '#f1f6f0' };

/**
 * Where each part starts, whatever the system setting. The studio site is
 * dark. The Oregon health plan pages are long documents of prose, tables and
 * footnotes read by an older audience, and start light: a readability review
 * on 2026-11-13 (an older board member, a legibility specialist, general
 * readers) was unanimous. A visitor's own choice, made with the navbar switch,
 * is remembered per part and wins from then on.
 *
 * The inline script in index.html applies a saved choice before first paint;
 * keep the path prefix and the keys there in step with these.
 */
const OREGON_PREFIX = '/oregon-universal-health-plan';
const DEFAULTS: Record<ThemeSection, Theme> = { site: 'dark', oregon: 'light' };
const STORAGE_KEYS: Record<ThemeSection, string> = { site: 'theme', oregon: 'theme-oregon' };

export function themeSection(path: string): ThemeSection {
  return path === OREGON_PREFIX || path.startsWith(OREGON_PREFIX + '/') ? 'oregon' : 'site';
}

export function defaultTheme(path: string): Theme {
  return DEFAULTS[themeSection(path)];
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private section: ThemeSection = 'site';

  /** The theme now on <html>. */
  readonly theme = signal<Theme>('dark');

  /**
   * Stamp the theme for a URL. Called on every navigation, and during
   * prerendering, where it bakes each page's starting theme into its HTML.
   */
  applyFor(url: string): void {
    const path = url.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
    this.section = themeSection(path);
    this.stamp(this.saved() ?? DEFAULTS[this.section]);
  }

  toggle(): void {
    const next: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.stamp(next);
    try {
      this.doc.defaultView?.localStorage.setItem(STORAGE_KEYS[this.section], next);
    } catch {
      // Private windows can refuse storage; the choice then lasts for this page.
    }
  }

  private saved(): Theme | null {
    try {
      const value = this.doc.defaultView?.localStorage?.getItem(STORAGE_KEYS[this.section]);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  private stamp(theme: Theme): void {
    const root = this.doc.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    this.doc
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);
    this.theme.set(theme);
  }
}
