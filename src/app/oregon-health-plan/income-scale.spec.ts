import { SLIDER_INCOME_MAX, SLIDER_POSITIONS, incomeAt, positionOf } from './income-scale';

describe('income slider scale', () => {
  it('runs from $0 to $2 million', () => {
    expect(incomeAt(0)).toBe(0);
    expect(incomeAt(SLIDER_POSITIONS)).toBe(2_000_000);
    expect(SLIDER_INCOME_MAX).toBe(2_000_000);
  });

  it('moves in $1,000 steps up to $200,000, then coarser', () => {
    expect(incomeAt(85)).toBe(85_000);
    expect(incomeAt(200)).toBe(200_000);
    expect(incomeAt(201)).toBe(210_000);
    expect(incomeAt(280)).toBe(1_000_000);
    expect(incomeAt(281)).toBe(1_050_000);
  });

  it('never goes down as the slider moves right', () => {
    for (let p = 1; p <= SLIDER_POSITIONS; p++) {
      expect(incomeAt(p)).toBeGreaterThan(incomeAt(p - 1));
    }
  });

  it('round-trips every position', () => {
    for (let p = 0; p <= SLIDER_POSITIONS; p++) {
      expect(positionOf(incomeAt(p))).toBe(p);
    }
  });

  it('places typed incomes at the nearest position and pins past the end', () => {
    expect(positionOf(85_400)).toBe(85);
    expect(positionOf(404_000)).toBe(220);
    expect(positionOf(5_000_000)).toBe(SLIDER_POSITIONS);
  });

  it('clamps positions outside the track', () => {
    expect(incomeAt(-5)).toBe(0);
    expect(incomeAt(9_999)).toBe(2_000_000);
  });
});
