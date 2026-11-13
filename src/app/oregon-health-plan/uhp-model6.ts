import { COST_PER_PERSON, softCapped } from './uhp-ceiling';
import { BOARD_PRIVATE_RATE, HOUSEHOLD_ROWS } from './uhp-households';
import { EmployerKind, MODELS, contribution, employerRate } from './uhp-model';
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
 * short name of ours and a one-paragraph description. Model 6 is priced below;
 * Model 7 cannot be priced without the state's tax-return data.
 */
export interface ProposedModel {
  id: 6 | 7;
  name: string;
  description: string;
  /** One line: what it changes in the board's Model 3. */
  change: string;
  priced: boolean;
  /** What it does for the two things this page cares about, and to revenue. */
  middle: string;
  top: string;
  revenue: string;
}

export const PROPOSED: readonly ProposedModel[] = [
  {
    id: 6,
    name: 'Less payroll, higher household rate',
    description:
      "The board's Model 3 with money moved from the employer payroll tax to the household contribution. Households see more of what the plan costs them, and employers pay less.",
    change: 'Payroll tax down, household rate up, by the same dollars',
    priced: true,
    middle: 'More, on a bill it can see',
    top: 'More, unless softened',
    revenue: 'Same as Model 3',
  },
  {
    id: 7,
    name: 'Lower rate, more income taxed',
    description:
      "The board's Model 3 with a smaller exempt amount and a lower household rate. More households pay something, each at a lower rate, and the payroll tax is left as the board has it.",
    change: 'Exemption down, household rate down, payroll tax unchanged',
    priced: false,
    middle: 'More, at a lower rate',
    top: 'Less',
    revenue: 'Meant to match Model 3; needs pricing',
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
