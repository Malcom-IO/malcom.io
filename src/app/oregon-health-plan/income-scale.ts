/**
 * The income slider's scale. A straight line to $4 million would squeeze the
 * incomes most households have into the first tenth of the track, so the
 * track is three straight pieces: fine steps where most people are, coarser
 * ones above. The text box beside the slider takes any amount.
 */
const SEGMENTS = [
  { from: 0, to: 200_000, step: 1_000 },
  { from: 200_000, to: 1_000_000, step: 10_000 },
  { from: 1_000_000, to: 4_000_000, step: 50_000 },
] as const;

/** The highest income the slider reaches. */
export const SLIDER_INCOME_MAX = SEGMENTS[SEGMENTS.length - 1].to;

/** The slider's last position; positions are whole numbers from 0. */
export const SLIDER_POSITIONS = SEGMENTS.reduce((n, s) => n + (s.to - s.from) / s.step, 0);

/** Income at a slider position. */
export function incomeAt(position: number): number {
  let left = Math.min(Math.max(Math.round(position), 0), SLIDER_POSITIONS);
  for (const s of SEGMENTS) {
    const steps = (s.to - s.from) / s.step;
    if (left <= steps) return s.from + left * s.step;
    left -= steps;
  }
  return SLIDER_INCOME_MAX;
}

/** Nearest slider position for an income; incomes past the end pin to the end. */
export function positionOf(income: number): number {
  let position = 0;
  for (const s of SEGMENTS) {
    if (income <= s.to) return position + Math.round((Math.max(income, s.from) - s.from) / s.step);
    position += (s.to - s.from) / s.step;
  }
  return SLIDER_POSITIONS;
}
