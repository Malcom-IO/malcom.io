import { HOUSEHOLD_ROWS } from './uhp-households';
import {
  BASE,
  BASE_SHARES,
  MODEL3_2022,
  householdBill,
  model6,
  model6Rows,
  model7,
  model7Bill,
  model7Rows,
  payrollOnWages,
  softCapYardstick,
} from './uhp-model6';

describe('Model 6 (opinion page sketch)', () => {
  it('is the board\'s Model 3 when nothing is moved', () => {
    const m = model6(BASE_SHARES.household);
    expect(m.householdRate).toBeCloseTo(0.0769, 6);
    expect(m.payrollLow).toBeCloseTo(0.096, 6);
    expect(m.payrollHigh).toBeCloseTo(0.14, 6);
    for (const h of HOUSEHOLD_ROWS) {
      expect(householdBill(h.income, h.size, BASE_SHARES.household)).toBeCloseTo(h.models[BASE.id - 1], 6);
      const p = payrollOnWages(h.wages, h.employer, BASE_SHARES.household);
      expect(p.model6).toBeCloseTo(p.draft, 6);
    }
  });

  it('always adds up to the whole', () => {
    for (const share of [0.4, 0.5, 0.6, 0.7]) {
      const s = model6(share).shares;
      expect(s.household + s.payroll + s.business).toBeCloseTo(1, 10);
    }
  });

  // Revenue is rate times base for a one-rate tax, so scaling the rates by the
  // change in each share leaves the total where Model 3 had it.
  it('raises the same total as Model 3 by construction', () => {
    for (const share of [0.45, 0.6, 0.7]) {
      const m = model6(share);
      const household = BASE_SHARES.household * m.householdScale;
      const payroll = BASE_SHARES.payroll * m.payrollScale;
      expect(household + payroll + BASE_SHARES.business).toBeCloseTo(1, 10);
    }
  });

  it('at 60% from households: an 11.5% household rate and a 6.1% / 8.9% payroll tax', () => {
    const m = model6(0.6);
    expect(m.householdRate).toBeCloseTo(0.11535, 5);
    expect(m.payrollLow).toBeCloseTo(0.0611, 4);
    expect(m.payrollHigh).toBeCloseTo(0.0891, 4);
  });

  it('makes the median family of four see more of its own bill and its employer pay less', () => {
    const row = model6Rows(0.6).find(
      (r) => r.size === 4 && r.income === 110_000 && r.employer === 'private',
    )!;
    // (110,000 - 66,000) x 11.535% = 5,075; payroll 99,000 x 9% x 35/55 = 5,670.
    expect(Math.round(row.own)).toBe(5_075);
    expect(Math.round(row.payroll.model6)).toBe(5_670);
    expect(row.own).toBeGreaterThan(row.draft.high);
    expect(row.own).toBeLessThan(row.now);
    expect(row.payroll.model6).toBeLessThan(row.payroll.draft);
  });

  // The page must not hide who is worse off. Pin them.
  it('costs these example households more than they pay today, on their own bill', () => {
    const worse = model6Rows(0.6)
      .filter((r) => r.own > r.now)
      .map((r) => `${r.who} ${r.income}`);
    expect(worse).toEqual([
      'Single public employee 80000',
      'Couple, private employer 85000',
      'Family of four, public employer 110000',
      'Family of four, private employer 220000',
      'Family of four, self-employed 400000',
      'Family of four, self-employed 1000000',
      'Family of four, self-employed 2000000',
    ]);
  });

  it('with the soft cap, $2,000,000 still pays more than $1,000,000, and both less than without', () => {
    const one = householdBill(1_000_000, 4, 0.6, true);
    const two = householdBill(2_000_000, 4, 0.6, true);
    expect(two).toBeGreaterThan(one);
    expect(one).toBeLessThan(householdBill(1_000_000, 4, 0.6));
    expect(two).toBeLessThan(householdBill(2_000_000, 4, 0.6));
  });

  it('sizes the soft cap yardstick at half the top 1% share of the household money', () => {
    // 60% x 25.3% x 1/2 of $30 billion and of $39 billion.
    expect(softCapYardstick(0.6)).toEqual({ low: 2.3, high: 3 });
  });
});

describe('Model 7 (opinion page sketch)', () => {
  it('is Model 3 when the exemption is not lowered', () => {
    const m = model7(2);
    expect(m.rateLow).toBeCloseTo(0.0769, 6);
    expect(m.rateHigh).toBeCloseTo(0.0769, 6);
    for (const h of HOUSEHOLD_ROWS) {
      expect(model7Bill(h.income, h.size, 2)).toBeCloseTo(h.models[BASE.id - 1], 6);
    }
  });

  // The hard floor: tax every dollar of income and the rate is the appendix's
  // own "net rate of HHCC" on all income, 5.0%. No exemption can beat that.
  it('cannot take the rate below 5.0%, even with no exemption at all', () => {
    const none = model7(0);
    expect(none.rateLow).toBeCloseTo(MODEL3_2022.netRateOnAllIncome, 6);
    expect(none.rateHigh).toBeCloseTo(MODEL3_2022.netRateOnAllIncome, 6);
    for (const exemption of [0.5, 1, 1.38, 1.75]) {
      expect(model7(exemption).rateLow).toBeGreaterThan(MODEL3_2022.netRateOnAllIncome);
    }
  });

  it('at 138% of poverty: a rate between about 6.6% and 6.8%', () => {
    const m = model7(1.38);
    expect(m.rateLow).toBeCloseTo(0.0659, 3);
    expect(m.rateHigh).toBeCloseTo(0.0683, 3);
    expect(m.rateLow).toBeLessThan(m.rateHigh);
    expect(m.rateHigh).toBeLessThan(0.0769);
  });

  it('asks more of the middle and less of the top than Model 3, and never caps', () => {
    const rows = model7Rows(1.38);
    const median = rows.find((r) => r.size === 4 && r.income === 110_000 && r.employer === 'private')!;
    const one = rows.find((r) => r.income === 1_000_000)!;
    const two = rows.find((r) => r.income === 2_000_000)!;
    expect(median.own).toBeGreaterThan(median.model3);
    expect(median.own).toBeLessThan(median.now);
    expect(one.own).toBeLessThan(one.model3);
    expect(two.own).toBeGreaterThan(one.own);
    // The cut at the top is modest: between a tenth and a seventh.
    const cut = 1 - one.own / one.model3;
    expect(cut).toBeGreaterThan(0.09);
    expect(cut).toBeLessThan(0.15);
  });
});
