import {
  BEST,
  BOARD,
  BRIDGE,
  LOW,
  PART_B,
  PRIVATE_TODAY,
  RAISED_IN_OREGON,
  RATE_RESET,
  REVENUE_TARGET,
  SCENARIOS_STATEWIDE,
  perPerson,
} from './uhp-statewide';

/**
 * The report's tables have to add up the way the report says. Each check
 * allows $0.15 billion for the report's own rounding to one decimal.
 */
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.15);

describe("the report's cost tables are transcribed consistently", () => {
  for (const [name, e] of [
    ['best', BEST],
    ['low', LOW],
  ] as const) {
    it(`${name}: current-system parts sum to its total (Tables E3, E4)`, () => {
      near(
        e.statusQuoMedical + e.statusQuoBehavioral + e.statusQuoDental + e.statusQuoAdmin,
        e.statusQuo,
      );
    });

    it(`${name}: plan parts sum to the plan before savings (Tables E5, E6)`, () => {
      near(
        e.statusQuoMedical +
          e.statusQuoBehavioral +
          e.addedUse +
          e.planDentalVisionMore +
          e.planAdmin,
        e.planGross,
      );
    });

    it(`${name}: provider savings take it to the plan figure (Table E7)`, () => {
      near(e.planGross - e.collectability - e.providerAdmin, e.plan);
    });
  }

  it("the board's extra savings take Milliman's low to $66.2B (Table E8)", () => {
    near(LOW.plan - BOARD.drugSavings - BOARD.fraudSavings - BOARD.adminSavings, BOARD.plan);
  });

  it('plan plus Part B minus public funding is the revenue target (Table E11)', () => {
    near(BEST.plan + PART_B - BEST.publicFunding, REVENUE_TARGET.best);
    near(BOARD.plan + PART_B - LOW.publicFunding, REVENUE_TARGET.board);
  });
});

describe('our derived figures', () => {
  it('the bridge steps walk from the current system to the plan', () => {
    let running = 0;
    for (const step of BRIDGE) {
      if (step.total !== undefined) {
        if (running) near(running, step.total);
        running = step.total;
      } else {
        running += step.delta!;
      }
    }
    near(running, BEST.plan);
  });

  it('scenarios: with and without the provider rate reset, for both estimates', () => {
    expect(SCENARIOS_STATEWIDE.map((s) => s.delta)).toEqual([-0.6, -6.6, 7.2, 1.4]);
  });

  it('the rate reset is about 10% of what the plan pays providers', () => {
    expect(RATE_RESET.best).toBeCloseTo(0.097, 3);
    expect(RATE_RESET.low).toBeCloseTo(0.108, 3);
  });

  it('money raised in Oregon: plan total equals the revenue target', () => {
    const sum = (r: { main: number; partB: number }) => r.main + r.partB;
    near(sum(RAISED_IN_OREGON.best[1]), REVENUE_TARGET.best);
    near(sum(RAISED_IN_OREGON.board[1]), REVENUE_TARGET.board);
    near(sum(RAISED_IN_OREGON.best[0]) - sum(RAISED_IN_OREGON.best[1]), 0.6);
    near(sum(RAISED_IN_OREGON.board[0]) - sum(RAISED_IN_OREGON.board[1]), 6.6);
  });

  it('new taxes replace private spending of about the same size or more', () => {
    near(PRIVATE_TODAY.best - REVENUE_TARGET.best, 0.6);
    near(PRIVATE_TODAY.board - REVENUE_TARGET.board, 6.6);
  });

  it('per-person figures', () => {
    expect(Math.round(perPerson(78.3))).toBe(17703);
    expect(Math.round(perPerson(30.0))).toBe(6783);
  });
});
