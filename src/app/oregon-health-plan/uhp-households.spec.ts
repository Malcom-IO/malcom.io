import { HOUSEHOLD_ROWS } from './uhp-households';
import { FPL_200, MODELS, bill } from './uhp-model';

describe('example households', () => {
  it('has a figure for every model in every row', () => {
    for (const row of HOUSEHOLD_ROWS) {
      expect(row.models).toHaveLength(MODELS.length);
      for (const v of row.models) expect(Number.isFinite(v) && v >= 0).toBe(true);
    }
  });

  it('matches the calculator for the same inputs', () => {
    for (const row of HOUSEHOLD_ROWS) {
      MODELS.forEach((m, i) => {
        expect(row.models[i]).toBe(
          bill(m, row.income, row.size, row.employer, row.payroll ?? 0).household,
        );
      });
    }
  });

  it('charges a self-employed family the flat Model 1 rate above the exemption', () => {
    const row = HOUSEHOLD_ROWS.find((r) => r.income === 2_000_000)!;
    expect(row.models[0]).toBeCloseTo((2_000_000 - FPL_200[4]) * 0.135, 0);
  });

  it("reproduces the board's couple at $85,000 (Table S1 pattern: less than $4,700 in every model)", () => {
    const row = HOUSEHOLD_ROWS.find((r) => r.boardFigure && r.size === 2)!;
    for (const v of row.models) expect(v).toBeLessThan(row.now);
  });
});
