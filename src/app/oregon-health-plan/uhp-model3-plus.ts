import { HOUSEHOLD_ROWS } from './uhp-households';
import { EmployerKind, FPL_200, MODELS, employerRate } from './uhp-model';
import { BEST, POPULATION_2032, REVENUE_TARGET } from './uhp-statewide';

/**
 * Arithmetic for the OPINION page only. None of it is the board's, and none of
 * it appears on the explainer.
 *
 * The page's position: of the board's five models, pick Model 3, and make
 * three changes to it. Each change has a short name and a description, like
 * the models themselves.
 *
 * Why Model 3, and why it needs changing, in the board's own numbers (Appendix
 * FR page 33): it has the lowest household rate and leans least on the top 1%,
 * but with no worker credit it taxes wage income at 15.1% (household
 * contribution plus payroll tax) and other income at 5.9%.
 */
const MODEL2 = MODELS[1];
export const MODEL3 = MODELS[2];

/** The payroll rate the board's Table S2 uses for its private employer, rounded to 9%. */
export const PRIVATE_RATE = 0.09;

export interface Change {
  id: 1 | 2 | 3;
  name: string;
  description: string;
  fixes: string;
  costs: string;
  priced: string;
  /** How firmly the page stands behind it. */
  standing: string;
}

export const CHANGES: readonly Change[] = [
  {
    id: 1,
    name: 'Same pay, same share',
    description:
      'A partial worker credit. An employee takes a quarter of the payroll tax paid on their wages off their own household contribution.',
    fixes: 'Wages taxed far more heavily than other income; public employees and single workers paying more than today',
    costs: 'A higher household rate, which lands on income with no employer behind it',
    priced: 'As a range, from two of the board\'s own models',
    standing: 'The core. Worth doing on its own',
  },
  {
    id: 2,
    name: 'A slower climb',
    description:
      "A soft cap. Above the plan's average cost for the household, each further dollar of contribution is halved. It never stops rising.",
    fixes: 'A bill several times the cost of coverage at the very top, and the risk that those households leave',
    costs: 'Revenue from the highest earners, made up by everyone below or by the payroll tax',
    priced: 'Roughly: a yardstick, not a price',
    standing: 'Conditional. Only if it is paid for from outside the household rate',
  },
  {
    id: 3,
    name: 'Honest rates',
    description:
      "Publish the rates at both the board's $30 billion and its actuary's $39 billion, and reset them each year to what the plan costs, under a stated ceiling.",
    fixes: 'Rates sized to the lower of two estimates, about 30% apart',
    costs: 'Nothing in dollars; it shows the higher number up front',
    priced: 'Yes: the rates scale with the target',
    standing: 'Worth doing with or without the other two',
  },
];

// ------------------------------------------------- 1. Same pay, same share
/** The share of the employer's payroll tax on a worker's wages credited back. */
export const CREDIT = 0.25;

/** Appendix FR pages 32-33, 2022 data, $ millions: Model 3's household contribution and payroll tax. */
const HOUSEHOLD_REVENUE = 8_171;
const PAYROLL_REVENUE = 11_341;
/** Income taxed at Model 3's rate: its revenue divided by its rate, about $106 billion. */
const TAXED_INCOME = HOUSEHOLD_REVENUE / MODEL3.topRate;

/**
 * The household rate that pays for a worker credit of a given size, as a range.
 *
 * Model 2 is Model 3 with a 50% credit: same exemption, same payroll tax, and
 * the board prices it at 12.05% against 7.69%.
 *
 * LOW END: a straight line between the two. This understates the cost. A
 * credit can never exceed the bill it comes off, and at 50% about a fifth of
 * the credit is lost that way (Model 2 uses about $4.6 billion of a possible
 * $5.7 billion). A smaller credit hits that limit less often, so more of it is
 * used and it costs more than half of what the 50% credit does.
 *
 * HIGH END: every dollar of the credit is used.
 */
export function creditRateRange(credit = CREDIT): { low: number; high: number } {
  return {
    low: MODEL3.topRate + (MODEL2.topRate - MODEL3.topRate) * (credit / 0.5),
    high: (HOUSEHOLD_REVENUE + credit * PAYROLL_REVENUE) / TAXED_INCOME,
  };
}

/** The middle of the range, used for the example households. */
export function creditRate(credit = CREDIT): number {
  const { low, high } = creditRateRange(credit);
  return (low + high) / 2;
}

/** The payroll rate behind a household's wages: the board's example, or the public rule. */
export function payrollRate(kind: EmployerKind): number {
  return kind === 'private' ? PRIVATE_RATE : employerRate(kind, MODEL3.id);
}

// --------------------------------------------------------- 2. A slower climb
/**
 * What the plan would spend per Oregonian in 2032, on Milliman's best estimate.
 * An all-ages statewide average, in 2032 dollars: a yardstick for "the cost of
 * coverage", not the cost of any particular household.
 */
export const COST_PER_PERSON = Math.round((BEST.plan * 1e9) / POPULATION_2032 / 100) * 100;

/** Where the slower climb starts for a household: the plan's average cost for its size. */
export function threshold(size: number): number {
  return COST_PER_PERSON * size;
}

/** Above the threshold, each further dollar of contribution is halved. */
export function softCapped(bill: number, size: number): number {
  const top = threshold(size);
  return bill <= top ? bill : top + (bill - top) / 2;
}

/** The income at which a household with no employer reaches the threshold. */
export function thresholdIncome(size: number, credit = CREDIT): number {
  return FPL_200[size] + threshold(size) / creditRate(credit);
}

// ------------------------------------------------------------ the household
export interface Options {
  /** Worker credit share; 0 is Model 3 as drafted. */
  credit?: number;
  softCap?: boolean;
  /** The household rate, when not the middle of the range for that credit. */
  rate?: number;
}

/** A household's own bill under Model 3 with the chosen changes. */
export function bill(
  income: number,
  wages: number,
  size: number,
  employer: EmployerKind,
  { credit = 0, softCap = false, rate }: Options = {},
): number {
  const gross = Math.max(0, income - FPL_200[size]) * (rate ?? creditRate(credit));
  const net = Math.max(0, gross - credit * payrollRate(employer) * wages);
  return softCap ? softCapped(net, size) : net;
}

// ------------------------------------------------------------- the yardstick
/**
 * Roughly what the soft cap could give up, in billions a year: half of what
 * the top 1% would pay. The top 1%'s share of the household contribution is
 * 25.3% under Model 3 and 33.9% under Model 2; with a 25% credit it is taken
 * as halfway. The household contribution is 40% of the revenue target.
 *
 * Not a bound in either direction: only dollars above the threshold are
 * halved, which makes the true figure smaller, and the cap also reaches some
 * high earners below the top 1%, which makes it larger.
 */
export function softCapYardstick(credit = CREDIT): { low: number; high: number; top1Share: number } {
  const top1Share = MODEL3.top1Share + (MODEL2.top1Share - MODEL3.top1Share) * (credit / 0.5);
  const half = 0.4 * top1Share * 0.5;
  return {
    low: Math.round(REVENUE_TARGET.board * half * 10) / 10,
    high: Math.round(REVENUE_TARGET.best * half * 10) / 10,
    top1Share,
  };
}

/**
 * The household rate if the soft cap cost its whole yardstick and the rate
 * alone made it up: the same money from a contribution that much smaller.
 */
export function rateCoveringSoftCap(credit = CREDIT): number {
  const lost = softCapYardstick(credit).top1Share * 0.5;
  return creditRate(credit) / (1 - lost);
}

/**
 * The twelve example households: Model 3; with changes 1 and 2 as proposed
 * (the soft cap's cost left out, so paid from outside the household rate); and
 * with the household rate raised to pay for the soft cap, which is the honest
 * end state if nothing else makes up the money. `withCredit` (change 1 alone)
 * is not a table column; the chart draws it and the tests pin it.
 */
export const PLUS_ROWS = HOUSEHOLD_ROWS.map((h) => {
  const at = (softCap: boolean, rate?: number) =>
    bill(h.income, h.wages, h.size, h.employer, { credit: CREDIT, softCap, rate });
  return {
    ...h,
    model3: h.models[MODEL3.id - 1],
    withCredit: at(false),
    withBoth: at(true),
    withBothPaidFor: at(true, rateCoveringSoftCap()),
    payroll: h.wages * payrollRate(h.employer),
  };
});


// --------------------------------------------------------- 3. Honest rates
/** How much more the actuary's estimate needs than the board's. */
export const TARGET_SCALE = REVENUE_TARGET.best / REVENUE_TARGET.board;

/** The rates at the board's target and at the actuary's, for Model 3 and with the credit. */
export function ratesAtBothTargets(credit = CREDIT) {
  const at = (scale: number) => ({
    household: MODEL3.topRate * scale,
    householdWithCredit: creditRate(credit) * scale,
    payrollLow: 0.096 * scale,
    payrollHigh: 0.14 * scale,
  });
  return {
    board: { target: REVENUE_TARGET.board, ...at(1) },
    actuary: { target: REVENUE_TARGET.best, ...at(TARGET_SCALE) },
  };
}

// --------------------------------------------------------------- why Model 3
/** Two households under all five draft models, to show what sets Model 3 apart. */
export const FIVE_MODELS = (() => {
  const top = HOUSEHOLD_ROWS.find((h) => h.income === 1_000_000)!;
  const median = HOUSEHOLD_ROWS.find(
    (h) => h.size === 4 && h.income === 110_000 && h.employer === 'private',
  )!;
  const pick = (h: typeof top) =>
    bill(h.income, h.wages, h.size, h.employer, { credit: CREDIT, softCap: true });
  return [
    ...MODELS.map((m, i) => ({ label: `Model ${m.id}`, id: m.id as number, top: top.models[i], median: median.models[i] })),
    // The same two households with changes 1 and 2, so the comparison is honest
    // about where the proposal lands among the five.
    { label: 'With my changes', id: 0, top: pick(top), median: pick(median) },
  ];
})();

/** How heavily Model 3 taxes wage income and other income (Appendix FR page 33). */
export const WAGE_GAP = { wages: 0.151, other: 0.059 };
