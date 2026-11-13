import {
  FPL_138,
  FPL_200,
  MODELS,
  SCENARIOS,
  bill,
  contribution,
  employerRate,
  payrollTax,
  grossContribution,
  schedule,
} from './uhp-model';

/**
 * The control for this page: our schedules have to reproduce the dollar figures
 * the board published in its own example tables (report Tables S1 to S4), for
 * all five models. If these fail, the calculator is not computing what the
 * board describes.
 */
describe('all five models reproduce the board examples', () => {
  /** Household size and employer payroll tax rate (by model index) per scenario. */
  const setup: Record<string, { size: number; rate: (i: number) => number }> = {
    self: { size: 1, rate: () => 0 },
    private: { size: 2, rate: () => 0.09 },
    public: { size: 1, rate: (i) => (i === 0 ? 0.096 : 0.14) },
    medicare: { size: 2, rate: () => 0 },
  };

  // One cell in the report does not fit its own schedule: Table S1, $90,000,
  // Model 5 prints 3,699 where the schedule gives 3,669 (a likely one-digit misprint;
  // the same model at $85,000 and $110,000 in Table S3 fits to the dollar).
  const KNOWN_MISPRINTS = new Set(['self:90000:5']);

  for (const scenario of SCENARIOS) {
    it(`Table ${scenario.id}: every published cell within $4`, () => {
      const { size, rate } = setup[scenario.id];
      for (const row of scenario.rows) {
        MODELS.forEach((model, i) => {
          if (KNOWN_MISPRINTS.has(`${scenario.id}:${row.income}:${model.id}`)) return;
          const ours = contribution(model, row.income, row.wages ?? 0, size, rate(i));
          expect(
            Math.abs(ours - row.models[i]),
            `${scenario.id} $${row.income} model ${model.id}: ours ${ours.toFixed(0)}, board ${row.models[i]}`,
          ).toBeLessThanOrEqual(4);
        });
      }
    });
  }

  it('our figure for the misprinted cell', () => {
    const ours = contribution(MODELS[4], 90_000, 0, 1, 0);
    expect(Math.round(ours)).toBe(3_669);
  });
});

describe('schedules', () => {
  it('Models 1 to 3 have one rate above 200% of the poverty level', () => {
    for (const model of MODELS.slice(0, 3)) {
      expect(schedule(model, 4)).toEqual([{ from: FPL_200[4], rate: model.topRate }]);
    }
  });

  it('Models 4 and 5 start at 138% and step up, with boundaries rising', () => {
    for (const model of MODELS.slice(3)) {
      for (const size of [1, 2, 3, 4, 5]) {
        const s = schedule(model, size);
        expect(s[0].from).toBe(FPL_138[size]);
        expect(s[1].from).toBe(FPL_200[size]);
        expect(s.at(-1)!.rate).toBe(model.topRate);
        for (let i = 1; i < s.length; i++) {
          expect(s[i].from).toBeGreaterThanOrEqual(s[i - 1].from);
          expect(s[i].rate).toBeGreaterThan(s[i - 1].rate);
        }
      }
    }
  });

  it('dollar boundaries are twice as high for households of two or more', () => {
    const one = schedule(MODELS[4], 1);
    const two = schedule(MODELS[4], 2);
    expect(two[3].from).toBeCloseTo(one[3].from * 2, 6);
    expect(two[4].from).toBeCloseTo(one[4].from * 2, 6);
  });

  it('marginal: income exactly at a boundary owes nothing extra for it', () => {
    const s = schedule(MODELS[3], 1);
    expect(grossContribution(s[0].from, s)).toBe(0);
    expect(grossContribution(s[1].from, s)).toBeCloseTo((s[1].from - s[0].from) * 0.03, 6);
  });
});

describe('bill', () => {
  it('owes nothing at or below the exemption', () => {
    for (const model of MODELS) {
      const exempt = schedule(model, 4)[0].from;
      expect(bill(model, exempt, 4, 'none').household).toBe(0);
    }
  });

  it('never goes negative when the credit exceeds the contribution', () => {
    expect(bill(MODELS[1], 60_000, 1, 'public').household).toBe(0);
  });

  it('gives no credit without an employer payroll tax', () => {
    expect(employerRate('none', 1)).toBe(0);
    expect(bill(MODELS[0], 100_000, 1, 'none').household).toBeCloseTo(
      (100_000 - FPL_200[1]) * 0.135,
      6,
    );
  });

  it('never falls as income rises', () => {
    for (const model of MODELS) {
      for (const kind of ['none', 'private', 'public'] as const) {
        let last = 0;
        for (let income = 0; income <= 600_000; income += 5_000) {
          const now = bill(model, income, 2, kind, 8_500_000).household;
          expect(now).toBeGreaterThanOrEqual(last - 1e-6);
          last = now;
        }
      }
    }
  });
});

describe('employer payroll tax', () => {
  it('is marginal: nothing at or below $500,000, and no cliff just above it', () => {
    expect(payrollTax(420_000, 1)).toBe(0);
    expect(payrollTax(500_000, 3)).toBe(0);
    expect(payrollTax(520_000, 1)).toBeCloseTo(1_920, 6);
  });

  it("matches the board's $8.5 million example at about 9.0% of payroll", () => {
    for (const id of [1, 2, 3, 4, 5] as const) {
      expect(payrollTax(8_500_000, id)).toBeCloseTo(768_000, 6);
      expect(employerRate('private', id, 8_500_000)).toBeCloseTo(0.0904, 4);
    }
  });

  it('adds the 14% tier above $10 million in Models 2 to 5 only', () => {
    expect(payrollTax(190_000_000, 1)).toBeCloseTo(18_192_000, 3);
    expect(payrollTax(190_000_000, 2)).toBeCloseTo(26_112_000, 3);
  });

  it('charges public employers the top rate from the first dollar', () => {
    expect(employerRate('public', 1)).toBe(0.096);
    expect(employerRate('public', 4)).toBe(0.14);
  });

  it('gives a small firm a smaller credit than the $8.5 million example', () => {
    const small = bill(MODELS[0], 78_600, 1, 'private', 1_100_000);
    const mid = bill(MODELS[0], 78_600, 1, 'private', 8_500_000);
    expect(small.credit).toBeLessThan(mid.credit);
    expect(small.household).toBeGreaterThan(mid.household);
  });
});

describe('combined rates by income fifth', () => {
  it('lowest fifth pays a higher combined rate than the second fifth in every model', () => {
    for (const model of MODELS) {
      expect(model.combinedByFifth[0]).toBeGreaterThan(model.combinedByFifth[1]);
    }
  });
});
