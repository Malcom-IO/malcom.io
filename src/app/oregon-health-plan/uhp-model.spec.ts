import {
  COMPUTABLE_MODELS,
  FPL_200,
  MODELS,
  SCENARIOS,
  bill,
  employerRate,
  householdContribution,
} from './uhp-model';

/**
 * The control for this page: our formula has to reproduce the dollar figures
 * the board published in its own example tables (report Tables S1 to S4).
 * If these fail, the calculator is not computing what the board describes.
 */
describe('household contribution reproduces the board examples', () => {
  const near = (actual: number, expected: number) =>
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

  const m2 = MODELS[1];
  const m3 = MODELS[2];

  it('Table S1: single, self-employed, no payroll tax', () => {
    const rows = SCENARIOS[0].rows;
    for (const row of rows) {
      const base = {
        income: row.income,
        wages: 0,
        exemption: FPL_200[1],
        creditShare: 0,
        employerRate: 0,
      };
      near(householdContribution({ ...base, rate: m2.topRate }), row.models[1]);
      near(householdContribution({ ...base, rate: m3.topRate }), row.models[2]);
    }
  });

  it('Table S2: household of two, 9.0% employer payroll tax, 50% credit', () => {
    // The board bases the employer tax on wages of $80,000 for an $85,000 AGI.
    const base = { income: 85_000, wages: 80_000, exemption: FPL_200[2], employerRate: 0.09 };
    near(householdContribution({ ...base, rate: m2.topRate, creditShare: 0.5 }), 1_427);
    near(householdContribution({ ...base, rate: m3.topRate, creditShare: 0 }), 3_208);
  });

  it('Table S3: single, public employer at 14%, credit can zero the bill', () => {
    const at = (income: number, wages: number) =>
      householdContribution({
        income,
        wages,
        exemption: FPL_200[1],
        rate: m2.topRate,
        creditShare: 0.5,
        employerRate: 0.14,
      });
    near(at(85_000, 80_000), 796);
    expect(at(66_000, 64_000)).toBe(0);
  });

  it("Table S4: Medicare household, no wages, at the board's 13.5% Model 1 example rate", () => {
    // The Model 1 examples use 13.5%, not the 12.0% the report states elsewhere.
    for (const row of SCENARIOS[3].rows) {
      near(
        householdContribution({
          income: row.income,
          wages: 0,
          exemption: FPL_200[2],
          rate: 0.135,
          creditShare: 0,
          employerRate: 0,
        }),
        row.models[0],
      );
    }
  });
});

describe('bill', () => {
  it('owes nothing at or below 200% of the poverty level', () => {
    for (const model of COMPUTABLE_MODELS) {
      expect(bill(model, FPL_200[4], 4, 'none', 0).household).toBe(0);
      expect(bill(model, 20_000, 1, 'large', 0).household).toBe(0);
    }
  });

  it('never goes negative when the credit exceeds the contribution', () => {
    expect(bill(MODELS[1], 60_000, 1, 'large', 0).household).toBe(0);
  });

  it('gives no credit without an employer payroll tax', () => {
    expect(employerRate('none', 1)).toBe(0);
    expect(bill(MODELS[0], 100_000, 1, 'none', 0).household).toBeCloseTo(
      (100_000 - FPL_200[1]) * 0.12,
      6,
    );
  });

  it('break-even is the income where the bill equals the current cost', () => {
    for (const model of COMPUTABLE_MODELS) {
      const b = bill(model, 0, 2, 'midsize', 4_700);
      expect(b.breakEven).not.toBeNull();
      expect(bill(model, b.breakEven!, 2, 'midsize', 4_700).household).toBeCloseTo(4_700, 4);
    }
  });
});
