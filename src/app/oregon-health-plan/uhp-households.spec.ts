import { HOUSEHOLD_ROWS } from './uhp-households';
import { FPL_200, MODELS, SCENARIOS } from './uhp-model';

/** The board's printed row for a scenario and income. */
function boardRow(id: string, income: number) {
  return SCENARIOS.find((s) => s.id === id)!.rows.find((r) => r.income === income)!;
}
function ours(who: string, income: number) {
  return HOUSEHOLD_ROWS.find((r) => r.who === who && r.income === income)!;
}

describe('example households', () => {
  it('has a figure for every model in every row', () => {
    for (const row of HOUSEHOLD_ROWS) {
      expect(row.models).toHaveLength(MODELS.length);
      for (const v of row.models) expect(Number.isFinite(v) && v >= 0).toBe(true);
    }
  });

  // Three rows are the board's own households. They must print the board's
  // numbers, or the page would contradict the table that follows it.
  it("matches report Table S2 for the couple at $85,000 (within $4)", () => {
    const row = ours('Couple, private employer', 85_000);
    const board = boardRow('private', 85_000);
    expect(row.now).toBe(board.now);
    row.models.forEach((v, i) => expect(Math.abs(v - board.models[i])).toBeLessThanOrEqual(4));
  });

  it('matches report Table S4 for the Medicare couple at $75,000 (within $4)', () => {
    const row = ours('Retired couple on Medicare', 75_000);
    const board = boardRow('medicare', 75_000);
    expect(row.now).toBe(board.now);
    row.models.forEach((v, i) => expect(Math.abs(v - board.models[i])).toBeLessThanOrEqual(4));
  });

  it('matches report Table S1 for the self-employed person at $90,000', () => {
    const row = ours('Self-employed, buys own plan', 90_000);
    const board = boardRow('self', 90_000);
    expect(row.now).toBe(board.now);
    // Models 1 to 4 within $4; the report prints 3,699 for Model 5 where its
    // own schedule gives 3,669 (a known slip, disclosed on the page).
    row.models.slice(0, 4).forEach((v, i) => expect(Math.abs(v - board.models[i])).toBeLessThanOrEqual(4));
    expect(Math.round(row.models[4])).toBe(3_669);
  });

  // Appendix Figure AFR4Fc prints savings for Model 3, which has no worker
  // credit and so does not depend on the employer's payroll rate.
  it('matches Appendix Figure AFR4Fc under Model 3 for the families of four', () => {
    const saving = (who: string, income: number) => {
      const row = ours(who, income);
      return Math.round(row.now - row.models[2]);
    };
    expect(saving('Family of four, private employer', 70_000)).toBe(9_692);
    expect(saving('Family of four, private employer', 110_000)).toBe(6_616);
    expect(saving('Family of four, public employer', 110_000)).toBe(616);
    expect(saving('Family of four, private employer', 220_000)).toBe(-1_843);
  });

  it('shows the single public employee paying more without the worker credit (AFR4Fb)', () => {
    const row = ours('Single public employee', 80_000);
    expect(Math.round(row.now - row.models[2])).toBe(-2_757);
  });

  it('charges a self-employed family the flat Model 1 rate above the exemption', () => {
    const row = ours('Family of four, self-employed', 2_000_000);
    expect(row.models[0]).toBeCloseTo((2_000_000 - FPL_200[4]) * 0.135, 0);
  });
});
