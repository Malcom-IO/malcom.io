import { COST_PER_PERSON, softCapped } from './uhp-ceiling';
import { BOARD_PRIVATE_RATE, HOUSEHOLD_ROWS } from './uhp-households';
import { EmployerKind, FPL_200, MODELS, contribution, employerRate } from './uhp-model';
import { REVENUE_TARGET } from './uhp-statewide';

/**
 * "Model 6": a sketch for the OPINION page only. Not the board's, and not on
 * the explainer.
 *
 * It starts from the board's Model 3 (one household rate above a 200%-of-
 * poverty exemption, no worker credit, the two-tier payroll tax) and moves
 * money from the employer payroll tax to the household contribution, leaving
 * the total and the business taxes alone.
 *
 * Why this can be priced when a floor or a new exemption cannot: Model 3's
 * household contribution is ONE rate on a fixed base, and its payroll tax is
 * two rates on a fixed base. Scale a rate and its revenue scales with it
 * exactly, so the rates below raise the same total as Model 3 by construction.
 * That is a static statement: it assumes nobody changes what they do.
 */
export const BASE = MODELS[2];

/**
 * The models this page proposes. Like the board's five, each has a number, a
 * short name of ours and a one-paragraph description. Model 6 is priced
 * exactly; Model 7 is priced as a range, from one table in the appendix.
 */
export interface ProposedModel {
  id: 6 | 7;
  name: string;
  description: string;
  /** One line: what it changes in the board's Model 3. */
  change: string;
  /** True when the page gives one set of rates; false when it gives a range. */
  priced: boolean;
  /** The badge beside the model's number. */
  status: string;
  /** What it does for the two things this page cares about, and to revenue. */
  middle: string;
  top: string;
  revenue: string;
}

export const PROPOSED: readonly ProposedModel[] = [
  {
    id: 6,
    name: 'Lower payroll tax, higher household rate',
    description:
      "The board's Model 3 with money moved from the employer payroll tax to the household contribution. Households see more of what the plan costs them, and employers pay less.",
    change: 'Payroll tax down, household rate up, by the same dollars',
    priced: true,
    status: 'Priced on this page',
    middle: 'More, on a bill it can see',
    top: 'More; a soft cap takes part of it off',
    revenue: 'Same as Model 3, if nobody changes what they do',
  },
  {
    id: 7,
    name: 'Lower rate, more income taxed',
    description:
      "The board's Model 3 with a smaller exempt amount and a lower household rate. More households pay something, each at a lower rate, and the payroll tax is left as the board has it.",
    change: 'Exemption down, household rate down, payroll tax unchanged',
    priced: false,
    status: 'Priced as a range',
    middle: 'More, at a lower rate',
    top: 'About a tenth less',
    revenue: 'Same as Model 3; the rate is a range',
  },
];

/** Model 3's shares of the new revenue (report, "% of Revenue"; business taxes about 5%). */
export const BASE_SHARES = { household: 0.4, payroll: 0.55, business: 0.05 };

/** Model 6's household share of the new revenue. Model 3's is 40%. */
export const DEFAULT_HOUSEHOLD_SHARE = 0.6;

export interface Model6 {
  /** Share of the new revenue from households, from payroll, from business taxes. */
  shares: { household: number; payroll: number; business: number };
  /** The single household rate above the exemption. */
  householdRate: number;
  /** The two payroll tiers: above $500,000, and above $10 million. */
  payrollLow: number;
  payrollHigh: number;
  /** Multipliers applied to Model 3's household and payroll rates. */
  householdScale: number;
  payrollScale: number;
}

export function model6(householdShare = DEFAULT_HOUSEHOLD_SHARE): Model6 {
  const payrollShare = 1 - BASE_SHARES.business - householdShare;
  const householdScale = householdShare / BASE_SHARES.household;
  const payrollScale = payrollShare / BASE_SHARES.payroll;
  return {
    shares: { household: householdShare, payroll: payrollShare, business: BASE_SHARES.business },
    householdRate: BASE.topRate * householdScale,
    payrollLow: 0.096 * payrollScale,
    payrollHigh: 0.14 * payrollScale,
    householdScale,
    payrollScale,
  };
}

/** A household's own bill under Model 6, with or without the soft cap at the top. */
export function householdBill(
  income: number,
  size: number,
  householdShare = DEFAULT_HOUSEHOLD_SHARE,
  softCap = false,
): number {
  const bill = contribution(BASE, income, 0, size, 0) * model6(householdShare).householdScale;
  return softCap ? softCapped(bill, size) : bill;
}

/** The payroll rate Model 3 would charge this household's employer on its wages. */
function basePayrollRate(kind: EmployerKind): number {
  return kind === 'private' ? BOARD_PRIVATE_RATE : employerRate(kind, BASE.id);
}

/** What the employer pays on a household's wages: under Model 3, and under Model 6. */
export function payrollOnWages(
  wages: number,
  kind: EmployerKind,
  householdShare = DEFAULT_HOUSEHOLD_SHARE,
): { draft: number; model6: number } {
  const draft = wages * basePayrollRate(kind);
  return { draft, model6: draft * model6(householdShare).payrollScale };
}

/** The soft cap's threshold, per person: the plan's average cost (see uhp-ceiling.ts). */
export const SOFT_CAP_PER_PERSON = COST_PER_PERSON;

/**
 * The most a soft cap could give up, in billions a year: half of everything
 * the top 1% would pay. The true figure is smaller at the top (only dollars
 * above the threshold are halved) but also catches some high earners below the
 * top 1%, so this is a yardstick, not a price.
 */
export function softCapYardstick(householdShare = DEFAULT_HOUSEHOLD_SHARE): { low: number; high: number } {
  const half = householdShare * BASE.top1Share * 0.5;
  return {
    low: Math.round(REVENUE_TARGET.board * half * 10) / 10,
    high: Math.round(REVENUE_TARGET.best * half * 10) / 10,
  };
}

/** The twelve example households under the draft and under Model 6. */
export function model6Rows(householdShare = DEFAULT_HOUSEHOLD_SHARE, softCap = false) {
  return HOUSEHOLD_ROWS.map((h) => {
    const own = householdBill(h.income, h.size, householdShare, softCap);
    const payroll = payrollOnWages(h.wages, h.employer, householdShare);
    const model3 = h.models[BASE.id - 1];
    return {
      ...h,
      draft: { low: Math.min(...h.models), high: Math.max(...h.models) },
      model3,
      own,
      payroll,
      total: { draft: model3 + payroll.draft, model6: own + payroll.model6 },
    };
  });
}

/**
 * If the soft cap cost its whole yardstick, the payroll tax could not fall as
 * far. This is the lower payroll tier that would still raise the same total.
 */
export function payrollLowWithReserve(householdShare = DEFAULT_HOUSEHOLD_SHARE): number {
  const reserve = householdShare * BASE.top1Share * 0.5;
  return 0.096 * ((model6(householdShare).shares.payroll + reserve) / BASE_SHARES.payroll);
}

// ================================================================= Model 7
/**
 * Model 7 is Model 3 with a smaller exemption and whatever lower rate raises
 * the same money. Pricing it needs to know how much income a lower exemption
 * brings into the tax, and the appendix gives enough to bound that.
 *
 * Appendix FR page 33, Model 3 on 2022 tax data: the household contribution
 * raises $8,171 million, which is 5.0% of all adjusted gross income ("net rate
 * of HHCC ... total"). So:
 *   total income           = 8,171 / 5.0%  = about $163 billion
 *   income taxed at 7.69%  = 8,171 / 7.69% = about $106 billion
 *   income under the exemption             = about $57 billion
 */
export const MODEL3_2022 = { householdRevenue: 8_171, netRateOnAllIncome: 0.05 };
const TOTAL_INCOME = MODEL3_2022.householdRevenue / MODEL3_2022.netRateOnAllIncome;

/**
 * The appendix does not say whether its $8,171 million is before or after the
 * credit for Medicare Part B premiums. The report's footnote 44 gives the size
 * of that credit for Model 1 in 2032: $13.144 billion raised against roughly
 * $14.1 billion without it. If the 2022 figure is after the credit, the income
 * actually taxed is larger by this factor, and less is left under the exemption.
 */
export const PART_B_GROSS_UP = 14.1 / 13.144;

/** Share of income the bottom two fifths of Oregonians have (appendix page 33). */
const BOTTOM_TWO_FIFTHS_INCOME = 0.004 + 0.079;

export interface Model7 {
  /** The exemption, as a share of the poverty line (Model 3's is 2.0). */
  exemption: number;
  /**
   * The low end. Reads the appendix figure as before the Part B credit and
   * assumes the most a lower exemption could bring in: lowering the exemption
   * by a share adds at most that share of the income now exempt.
   */
  rateLow: number;
  /**
   * The high end of the likely range, not a ceiling. Reads the figure as after
   * the credit, and leaves out the income of the bottom two fifths, who mostly
   * owe nothing either way. The only true ceiling is Model 3's own 7.69%.
   */
  rateHigh: number;
  /** The middle of the two, used for the example households. */
  rate: number;
}

/** The rate that raises a given gross amount once the exemption is lowered. */
function rateFor(grossRevenue: number, exemption: number, leaveOutBottom: boolean): number {
  const taxed = grossRevenue / BASE.topRate;
  const exempt = TOTAL_INCOME - taxed;
  const reachable = leaveOutBottom ? exempt - TOTAL_INCOME * BOTTOM_TWO_FIFTHS_INCOME : exempt;
  return grossRevenue / (taxed + reachable * (1 - exemption / 2));
}

/** Model 7 at a given exemption (1.38 = 138% of the poverty line; 0 = none). */
export function model7(exemption = 1.38): Model7 {
  const revenue = MODEL3_2022.householdRevenue;
  const rateLow = rateFor(revenue, exemption, false);
  // With no exemption every dollar is taxed, so there is no bottom to leave out.
  const rateHigh = rateFor(revenue * PART_B_GROSS_UP, exemption, exemption !== 0);
  return { exemption, rateLow, rateHigh, rate: (rateLow + rateHigh) / 2 };
}

/** A household's own bill under Model 7. The payroll tax is Model 3's, unchanged. */
export function model7Bill(income: number, size: number, exemption = 1.38, rate?: number): number {
  const exempt = (FPL_200[size] / 2) * exemption;
  return Math.max(0, income - exempt) * (rate ?? model7(exemption).rate);
}

/** The twelve example households under Model 3 and under Model 7. */
export function model7Rows(exemption = 1.38) {
  const m = model7(exemption);
  return HOUSEHOLD_ROWS.map((h) => ({
    ...h,
    model3: h.models[BASE.id - 1],
    own: model7Bill(h.income, h.size, exemption, m.rate),
    ownLow: model7Bill(h.income, h.size, exemption, m.rateLow),
    ownHigh: model7Bill(h.income, h.size, exemption, m.rateHigh),
  }));
}
