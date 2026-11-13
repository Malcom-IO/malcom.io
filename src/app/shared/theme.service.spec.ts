import { defaultTheme, themeSection } from './theme.service';

describe('theme defaults', () => {
  it('starts the studio site dark', () => {
    for (const path of ['/', '/quillquest', '/privacy', '/home']) {
      expect(themeSection(path)).toBe('site');
      expect(defaultTheme(path)).toBe('dark');
    }
  });

  it('starts the Oregon health plan pages light', () => {
    for (const path of [
      '/oregon-universal-health-plan',
      '/oregon-universal-health-plan/opinion',
      '/oregon-universal-health-plan/floor-and-top-up',
    ]) {
      expect(themeSection(path)).toBe('oregon');
      expect(defaultTheme(path)).toBe('light');
    }
  });

  it('does not treat a lookalike path as an Oregon page', () => {
    expect(themeSection('/oregon-universal-health-plan-notes')).toBe('site');
  });
});
