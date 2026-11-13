import { HOUSEHOLD_ROWS } from './uhp-households';
import {
  COST_PER_PERSON,
  CREDIT,
  FIVE_MODELS,
  PLUS_ROWS,
  bill,
  creditRate,
  rateCoveringSoftCap,
  ratesAtBothTargets,
  softCapYardstick,
  softCapped,
  threshold,
  thresholdIncome,
} from './uhp-model3-plus';

describe('Model 3 with changes (opinion page)', () => {
  // The two ends of the straight line are the board's own models. If the
  // arithmetic reproduces both, the point between them is at least anchored.
  it("is the board's Model 3 with no credit", () => {
    expect(creditRate(0)).toBeCloseTo(0.0769, 6);
    for (const h of HOUSEHOLD_ROWS) {
      expect(bill(h.income, h.wages, h.size, h.employer)).toBeCloseTo(h.models[2], 6);
    }
  });

  it("is the board's Model 2 with a 50% credit", () => {
    expect(creditRate(0.5)).toBeCloseTo(0.1205, 6);
    for (const h of HOUSEHOLD_ROWS) {
      const ours = bill(h.income, h.wages, h.size, h.employer, { credit: 0.5 });
      expect(Math.abs(ours - h.models[1])).toBeLessThanOrEqual(1);
    }
  });

  it('prices a 25% credit at about 9.9%', () => {
    expect(CREDIT).toBe(0.25);
    expect(creditRate()).toBeCloseTo(0.0987, 4);
  });

  it('lowers the bill for every example household with an employer', () => {
    for (const row of PLUS_ROWS.filter((r) => r.employer !== 'none')) {
      expect(row.withCredit).toBeLessThan(row.model3);
    }
  });

  // The page must not hide who pays for the credit. Pin them.
  it('raises the bill for exactly the households with no employer', () => {
    const more = PLUS_ROWS.filter((r) => r.withCredit > r.model3).map((r) => `${r.who} ${r.income}`);
    expect(more).toEqual([
      'Self-employed, buys own plan 90000',
      'Retired couple on Medicare 75000',
      'Family of four, self-employed 400000',
      'Family of four, self-employed 1000000',
      'Family of four, self-employed 2000000',
    ]);
  });

  it('takes the single public employee from $3,697 to about $2,200', () => {
    const row = PLUS_ROWS.find((r) => r.who === 'Single public employee')!;
    expect(Math.round(row.model3)).toBe(3_697);
    // 48,080 x 9.87% = 4,745, less a quarter of 14% of 73,300 = 2,566.
    expect(Math.round(row.withCredit / 100) * 100).toBe(2_200);
  });

  it('starts the slower climb at the plan cost for the household', () => {
    // $77.7 billion over 4.423 million people.
    expect(COST_PER_PERSON).toBe(17_600);
    expect(threshold(4)).toBe(70_400);
    expect(softCapped(50_000, 4)).toBe(50_000);
    expect(softCapped(100_000, 4)).toBe(70_400 + 29_600 / 2);
    // 66,000 + 70,400 / 9.87%.
    expect(Math.round(thresholdIncome(4) / 10_000) * 10_000).toBe(780_000);
  });

  it('with both changes: $2,000,000 still pays more than $1,000,000, and less than under Model 3', () => {
    const one = PLUS_ROWS.find((r) => r.income === 1_000_000)!;
    const two = PLUS_ROWS.find((r) => r.income === 2_000_000)!;
    expect(two.withBoth).toBeGreaterThan(one.withBoth);
    expect(two.withBoth).toBeLessThan(two.model3);
    expect(one.withBoth).toBeGreaterThan(one.model3);
    expect(Math.round(one.withBoth / 1_000)).toBe(81);
    expect(Math.round(two.withBoth / 1_000)).toBe(131);
  });

  it('leaves households below the threshold untouched by the soft cap', () => {
    for (const row of PLUS_ROWS.filter((r) => r.income <= 400_000)) {
      expect(row.withBoth).toBe(row.withCredit);
    }
  });

  it('sizes the soft cap yardstick and the rate that would cover it', () => {
    const y = softCapYardstick();
    // Top 1% share halfway between 25.3% and 33.9%; 40% of $30B and $39B; half.
    expect(y.top1Share).toBeCloseTo(0.296, 3);
    expect(y).toMatchObject({ low: 1.8, high: 2.3 });
    expect(rateCoveringSoftCap()).toBeCloseTo(0.1159, 3);
  });

  it("scales every rate by 1.3 at the actuary's estimate", () => {
    const r = ratesAtBothTargets();
    expect(r.board.household).toBeCloseTo(0.0769, 6);
    expect(r.actuary.household).toBeCloseTo(0.1, 3);
    expect(r.actuary.householdWithCredit).toBeCloseTo(0.1283, 3);
    expect(r.actuary.payrollLow).toBeCloseTo(0.1248, 4);
    expect(r.actuary.payrollHigh).toBeCloseTo(0.182, 3);
  });

  it('shows Model 3 as the lightest at the top and the heaviest for the median family', () => {
    const lowestTop = [...FIVE_MODELS].sort((a, b) => a.top - b.top)[0];
    const highestMedian = [...FIVE_MODELS].sort((a, b) => b.median - a.median)[0];
    expect(lowestTop.id).toBe(3);
    expect(highestMedian.id).toBe(3);
  });
});
