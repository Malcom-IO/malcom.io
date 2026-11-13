import { HOUSEHOLD_ROWS } from './uhp-households';
import { EmployerKind, FPL_200, MODELS, employerRate } from './uhp-model';
import { REVENUE_TARGET } from './uhp-statewide';

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
      'A soft cap. Above twice what a household buying its own coverage pays today, each further dollar of contribution is cut to a quarter. It never stops rising.',
    fixes: 'A bill several times the cost of coverage at the top, and the risk that those households leave',
    costs: 'A higher household rate again, paid by everyone below the cap',
    priced: 'Roughly, as a range. The documents do not give enough to price it',
    standing: 'Worth doing. The middle pays for it and still pays far less than today',
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

/** The middle of the range: the rate with change 1 alone. */
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
 * What a household buying its own coverage pays today, premiums and
 * out-of-pocket, in the board's examples: $6,900 for one person (Table S1) and
 * $22,871 for a family of four (Appendix FR, Figure AFR4Fc). Sizes between
 * are a straight line between the two, which is ours.
 */
const OWN_PLAN = {
  one: HOUSEHOLD_ROWS.find((h) => h.who === 'Self-employed, buys own plan')!.now,
  four: HOUSEHOLD_ROWS.find((h) => h.who === 'Family of four, self-employed')!.now,
};
export function ownPlanToday(size: number): number {
  return OWN_PLAN.one + ((OWN_PLAN.four - OWN_PLAN.one) * (Math.min(size, 4) - 1)) / 3;
}

/** The slower climb starts at this multiple of today's own-plan cost... */
export const START_MULTIPLE = 2;
/** ...and above it this share of each further dollar is still paid. */
export const KEPT = 0.25;

/** Where the slower climb starts for a household: twice what its own plan costs today. */
export function threshold(size: number): number {
  return START_MULTIPLE * ownPlanToday(size);
}

/** Above the threshold, each further dollar of contribution is cut to a quarter. */
export function softCapped(bill: number, size: number): number {
  const top = threshold(size);
  return bill <= top ? bill : top + (bill - top) * KEPT;
}

/**
 * The share of the household contribution the slower climb gives up, as a
 * range. It is three quarters of whatever sits above the threshold, and the
 * documents give shares of the contribution by income group (Appendix FR page
 * 33 and Figure AFR4Ff), not bills by household. So how much of each group's
 * contribution sits above the threshold is assumed, and stated:
 *
 * LOW:  60% of what the top 1% pay, and nothing below them.
 * HIGH: 90% of what the top 1% pay, and 20% of what the next 4% pay.
 *
 * Each group's share is taken halfway between Model 3 (no credit) and Model 2
 * (50% credit). A rough check on the top 1%: 16.4% of about $163 billion of
 * income over roughly 17,000 returns is about $1.6 million a return, a bill
 * near $150,000 against a threshold near $35,000, so about three quarters of
 * it is above. A higher rate pushes more bills over the threshold; that
 * second-order effect is left out.
 */
const NEXT4_SHARE = { model3: 0.185, model2: 0.202 };
export function slowerClimbLoss(credit = CREDIT): { low: number; high: number } {
  const t = credit / 0.5;
  const top1 = MODEL3.top1Share + (MODEL2.top1Share - MODEL3.top1Share) * t;
  const next4 = NEXT4_SHARE.model3 + (NEXT4_SHARE.model2 - NEXT4_SHARE.model3) * t;
  const cut = 1 - KEPT;
  return { low: cut * 0.6 * top1, high: cut * (0.9 * top1 + 0.2 * next4) };
}

/** The household rate with both changes, the slower climb paid for by the rate: a range. */
export function proposalRateRange(credit = CREDIT): { low: number; high: number } {
  const rate = creditRateRange(credit);
  const loss = slowerClimbLoss(credit);
  return { low: rate.low / (1 - loss.low), high: rate.high / (1 - loss.high) };
}

/** The rate the example households use: the middle credit rate, the middle loss. */
export function proposalRate(credit = CREDIT): number {
  const loss = slowerClimbLoss(credit);
  return creditRate(credit) / (1 - (loss.low + loss.high) / 2);
}

/** What the slower climb moves off the top, in billions a year: 40% of the target is households. */
export function slowerClimbDollars(credit = CREDIT): { low: number; high: number } {
  const loss = slowerClimbLoss(credit);
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    low: round(REVENUE_TARGET.board * 0.4 * loss.low),
    high: round(REVENUE_TARGET.board * 0.4 * loss.high),
  };
}

/** The income at which a household with no employer reaches the threshold. */
export function thresholdIncome(size: number, credit = CREDIT): number {
  return FPL_200[size] + threshold(size) / proposalRate(credit);
}

// ------------------------------------------------------------ the household
export interface Options {
  /** Worker credit share; 0 is Model 3 as drafted. */
  credit?: number;
  /** The slower climb, with the household rate raised to pay for it. */
  softCap?: boolean;
  /** The household rate, when not the one that follows from the options. */
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
  const r = rate ?? (softCap ? proposalRate(credit) : creditRate(credit));
  const gross = Math.max(0, income - FPL_200[size]) * r;
  const net = Math.max(0, gross - credit * payrollRate(employer) * wages);
  return softCap ? softCapped(net, size) : net;
}

/**
 * The twelve example households: Model 3; with change 1 alone; and the
 * proposal, both changes with the household rate raised to pay for the
 * slower climb.
 */
export const PLUS_ROWS = HOUSEHOLD_ROWS.map((h) => ({
  ...h,
  model3: h.models[MODEL3.id - 1],
  withCredit: bill(h.income, h.wages, h.size, h.employer, { credit: CREDIT }),
  withBoth: bill(h.income, h.wages, h.size, h.employer, { credit: CREDIT, softCap: true }),
  payroll: h.wages * payrollRate(h.employer),
}));

/**
 * The income at which a household's bill under the proposal crosses its bill
 * under Model 3, searched between two incomes. Used for "pays less up to
 * about..." and "pays less above about...".
 */
export function crossover(
  size: number,
  employer: EmployerKind,
  wageShare: number,
  from: number,
  to: number,
): number {
  const gap = (income: number) =>
    bill(income, income * wageShare, size, employer, { credit: CREDIT, softCap: true }) -
    bill(income, income * wageShare, size, employer);
  let lo = from;
  let hi = to;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(gap(mid)) === Math.sign(gap(lo))) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// --------------------------------------------------------- 3. Honest rates
/** How much more the actuary's estimate needs than the board's. */
export const TARGET_SCALE = REVENUE_TARGET.best / REVENUE_TARGET.board;

/** The rates at the board's target and at the actuary's, for Model 3 and for the proposal. */
export function ratesAtBothTargets(credit = CREDIT) {
  const at = (scale: number) => ({
    household: MODEL3.topRate * scale,
    householdProposal: proposalRate(credit) * scale,
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
    // The same two households under the proposal, so the comparison is honest
    // about where it lands among the five.
    { label: 'With my changes', id: 0, top: pick(top), median: pick(median) },
  ];
})();

/** How heavily Model 3 taxes wage income and other income (Appendix FR page 33). */
export const WAGE_GAP = { wages: 0.151, other: 0.059 };
