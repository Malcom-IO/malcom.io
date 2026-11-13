import { HOUSEHOLD_ROWS } from './uhp-households';
import {
  CREDIT,
  FIVE_MODELS,
  KEPT,
  PLUS_ROWS,
  bill,
  creditRate,
  creditRateRange,
  crossover,
  ownPlanToday,
  proposalRate,
  proposalRateRange,
  ratesAtBothTargets,
  slowerClimbDollars,
  slowerClimbLoss,
  softCapped,
  threshold,
  thresholdIncome,
} from './uhp-model3-plus';

const row = (who: string, income: number) =>
  PLUS_ROWS.find((r) => r.who === who && r.income === income)!;

describe('Model 3 with changes (opinion page)', () => {
  // The low end of the range is a straight line between two of the board's own
  // models. If the arithmetic reproduces both ends, the line is anchored.
  it("is the board's Model 3 with no credit", () => {
    expect(creditRateRange(0).low).toBeCloseTo(0.0769, 6);
    expect(creditRateRange(0).high).toBeCloseTo(0.0769, 6);
    for (const h of HOUSEHOLD_ROWS) {
      expect(bill(h.income, h.wages, h.size, h.employer)).toBeCloseTo(h.models[2], 6);
    }
  });

  it("is the board's Model 2 with a 50% credit, at the low end", () => {
    const rate = creditRateRange(0.5).low;
    expect(rate).toBeCloseTo(0.1205, 6);
    for (const h of HOUSEHOLD_ROWS) {
      const ours = bill(h.income, h.wages, h.size, h.employer, { credit: 0.5, rate });
      expect(Math.abs(ours - h.models[1])).toBeLessThanOrEqual(1);
    }
  });

  // The straight line understates the cost: a smaller credit is lost less
  // often to the rule that it cannot exceed the bill. The high end assumes
  // none of it is lost: (8,171 + 25% x 11,341) / 106,255.
  it('prices a 25% credit at 9.9% to 10.4%', () => {
    expect(CREDIT).toBe(0.25);
    const { low, high } = creditRateRange();
    expect(low).toBeCloseTo(0.0987, 4);
    expect(high).toBeCloseTo(0.1036, 3);
    expect(creditRate()).toBeCloseTo((low + high) / 2, 10);
    // At 50% the board's own figure sits below "none lost", as it should.
    expect(creditRateRange(0.5).low).toBeLessThan(creditRateRange(0.5).high);
  });

  it('change 1 alone lowers the bill for every example household with an employer', () => {
    for (const r of PLUS_ROWS.filter((x) => x.employer !== 'none')) {
      expect(r.withCredit).toBeLessThan(r.model3);
    }
  });

  it('starts the slower climb at twice what an own plan costs today', () => {
    // Table S1 and Figure AFR4Fc.
    expect(ownPlanToday(1)).toBe(6_900);
    expect(ownPlanToday(4)).toBe(22_871);
    expect(threshold(1)).toBe(13_800);
    expect(threshold(4)).toBe(45_742);
    // Sizes between sit on the line between the two.
    expect(threshold(2)).toBeGreaterThan(threshold(1));
    expect(threshold(2)).toBeLessThan(threshold(4));
    expect(KEPT).toBe(0.25);
    expect(softCapped(40_000, 4)).toBe(40_000);
    expect(softCapped(85_742, 4)).toBe(45_742 + 10_000);
  });

  // The loss is assumed shares of the board's group shares: top 1% halfway
  // between 25.3% and 33.9%, the next 4% halfway between 18.5% and 20.2%.
  it('prices the slower climb as a range', () => {
    const loss = slowerClimbLoss();
    expect(loss.low).toBeCloseTo(0.75 * (0.75 * 0.296 + 0.2 * 0.1935), 4);
    expect(loss.high).toBeCloseTo(0.75 * (0.9 * 0.296 + 0.45 * 0.1935), 4);
    // $12 billion x loss / (1 - loss).
    expect(slowerClimbDollars()).toEqual({ low: 2.9, high: 4.3 });
    const range = proposalRateRange();
    // The rate rises by 7.69% x loss / (1 - loss): only the net contribution is grossed up.
    expect(range.low).toBeCloseTo(0.0987 + 0.0769 * (loss.low / (1 - loss.low)), 4);
    expect(range.low).toBeCloseTo(0.117, 3);
    expect(range.high).toBeCloseTo(0.131, 3);
    expect(proposalRate()).toBeGreaterThan(range.low);
    expect(proposalRate()).toBeLessThan(range.high);
    expect(proposalRate()).toBeCloseTo(0.124, 3);
    // A family of four with no employer reaches the threshold near $430,000.
    expect(Math.round(thresholdIncome(4) / 10_000) * 10_000).toBe(430_000);
  });

  it('puts the top rows near three and four times today, not six', () => {
    const one = row('Family of four, self-employed', 1_000_000);
    const two = row('Family of four, self-employed', 2_000_000);
    expect(Math.round(one.withBoth / 1_000)).toBe(63);
    expect(Math.round(two.withBoth / 1_000)).toBe(94);
    // It never stops rising, and both are below Model 3.
    expect(two.withBoth).toBeGreaterThan(one.withBoth);
    expect(one.withBoth).toBeLessThan(one.model3);
    expect(two.withBoth).toBeLessThan(two.model3);
  });

  // The page must not hide who pays for the slower climb. Pin them.
  it('raises the bill, against Model 3, for exactly these households', () => {
    const more = PLUS_ROWS.filter((r) => r.withBoth > r.model3).map((r) => `${r.who} ${r.income}`);
    expect(more).toEqual([
      'Self-employed, buys own plan 90000',
      // By about $150: two exemptions cover less of a couple's income than four do.
      'Couple, private employer 85000',
      'Retired couple on Medicare 75000',
      'Family of four, private employer 220000',
      'Family of four, self-employed 400000',
    ]);
  });

  it('keeps the middle below Model 3 and far below today', () => {
    const median = row('Family of four, private employer', 110_000);
    expect(Math.round(median.withBoth / 100) * 100).toBe(3_200);
    expect(median.withBoth).toBeLessThan(median.model3);
    expect(median.withBoth).toBeLessThan(median.now / 3);
    const teacher = row('Single public employee', 80_000);
    expect(Math.round(teacher.model3)).toBe(3_697);
    expect(Math.round(teacher.withBoth / 100) * 100).toBe(3_400);
  });

  it('finds where the proposal crosses Model 3', () => {
    // A family with a private employer pays less up to a little past the median.
    const employed = crossover(4, 'private', 0.9, 70_000, 400_000);
    expect(employed).toBeGreaterThan(110_000);
    expect(employed).toBeLessThan(130_000);
    // A self-employed family pays less from somewhere under $1,000,000.
    const top = crossover(4, 'none', 0, 450_000, 2_000_000);
    expect(top).toBeGreaterThan(700_000);
    expect(top).toBeLessThan(900_000);
  });

  it("scales every rate by 1.3 at the actuary's estimate", () => {
    const r = ratesAtBothTargets();
    expect(r.board.household).toBeCloseTo(0.0769, 6);
    expect(r.actuary.household).toBeCloseTo(0.1, 3);
    expect(r.board.householdProposal).toBeCloseTo(proposalRate(), 10);
    expect(r.actuary.householdProposal).toBeCloseTo(proposalRate() * 1.3, 6);
    expect(r.actuary.payrollLow).toBeCloseTo(0.1248, 4);
    expect(r.actuary.payrollHigh).toBeCloseTo(0.182, 3);
  });

  it('lands below every draft model at the top, and below Model 3 in the middle', () => {
    const mine = FIVE_MODELS.find((m) => m.id === 0)!;
    const drafts = FIVE_MODELS.filter((m) => m.id !== 0);
    expect(mine.top).toBeLessThan(Math.min(...drafts.map((m) => m.top)));
    expect(mine.median).toBeLessThan(drafts.find((m) => m.id === 3)!.median);
    expect([...drafts].sort((a, b) => a.top - b.top)[0].id).toBe(3);
  });
});
