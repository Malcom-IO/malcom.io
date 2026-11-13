/**
 * The statewide cost math, taken apart.
 *
 * INPUTS are transcribed from the board's draft legislative report (dated
 * 2026-10-13), Tables E2 to E11, in billions of dollars for 2032. Everything
 * under DERIVED is our own arithmetic on those inputs and is labeled "our math"
 * on the page. The spec checks that the inputs add up the way the report says
 * they do, so a transcription slip fails a test.
 */

/** One column of the report's estimates. */
export interface Estimate {
  /** Current system: medical and drug claims (Tables E3, E4). */
  statusQuoMedical: number;
  statusQuoBehavioral: number;
  statusQuoDental: number;
  /** Current system: health plans' combined administrative costs, about 9%. */
  statusQuoAdmin: number;
  /** Current system total (Tables E3, E4). */
  statusQuo: number;
  /** Plan: more people, more use, adverse selection (Table E5). */
  addedUse: number;
  /** Plan: dental, vision, hearing, fertility and other added benefits (Table E6). */
  planDentalVisionMore: number;
  /** Plan: administrative costs (Table E6). */
  planAdmin: number;
  /** Plan before any provider savings (Table E6). */
  planGross: number;
  /** Providers collect 100% of billed charges (Table E7). */
  collectability: number;
  /** Providers' own billing and eligibility costs fall (Table E7). */
  providerAdmin: number;
  /** Plan after Milliman's two savings (Table E7). */
  plan: number;
  /** Federal and state funding that continues (Table E10). */
  publicFunding: number;
}

/** Milliman's best estimate. */
export const BEST: Estimate = {
  statusQuoMedical: 67.1,
  statusQuoBehavioral: 0.9,
  statusQuoDental: 3.9,
  statusQuoAdmin: 6.4,
  statusQuo: 78.3,
  addedUse: 7.2,
  planDentalVisionMore: 5.1,
  planAdmin: 5.1,
  planGross: 85.5,
  collectability: 3.3,
  providerAdmin: 4.5,
  plan: 77.7,
  publicFunding: 42.2,
};

/** Milliman's low estimate (5.3% yearly cost growth), the base for the board's figure. */
export const LOW: Estimate = {
  statusQuoMedical: 62.7,
  statusQuoBehavioral: 0.8,
  statusQuoDental: 3.7,
  statusQuoAdmin: 5.6,
  statusQuo: 72.8,
  addedUse: 5.7,
  planDentalVisionMore: 4.5,
  planAdmin: 3.6,
  planGross: 77.4,
  collectability: 3.0,
  providerAdmin: 5.0,
  plan: 69.4,
  publicFunding: 39.7,
};

/** The board's further savings on top of Milliman's low estimate (Table E8). */
export const BOARD = {
  drugSavings: 1.0,
  fraudSavings: 0.8,
  adminSavings: 1.4,
  plan: 66.2,
};

/** Medicare Part B premiums the plan would pay (report page 30). */
export const PART_B = 3.5;
/** Oregon's projected 2032 population (Table E2). */
export const POPULATION_2032 = 4_423_000;
/** New state revenue needed each year (Table E11). */
export const REVENUE_TARGET = { best: 39.0, board: 30.0 };

// ------------------------------------------------------------------ DERIVED

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Dollars per Oregonian for an amount in billions. */
export function perPerson(billions: number): number {
  return (billions * 1e9) / POPULATION_2032;
}

export interface Step {
  label: string;
  /** Change in billions; undefined for a running total. */
  delta?: number;
  /** Running total in billions; set on total rows. */
  total?: number;
  /** True when the saving depends on resetting provider payment rates. */
  conditional?: boolean;
}

/** How Milliman's best estimate gets from the current system to the plan. */
export const BRIDGE: readonly Step[] = [
  { label: 'Current system in 2032', total: BEST.statusQuo },
  {
    label: 'More people covered, more care used, some high-cost people moving in',
    delta: BEST.addedUse,
  },
  {
    label: "Dental, vision, hearing and more (today's figure counts dental only)",
    delta: round1(BEST.planDentalVisionMore - BEST.statusQuoDental),
  },
  {
    label: "One plan's administration instead of today's insurers and public programs",
    delta: round1(BEST.planAdmin - BEST.statusQuoAdmin),
  },
  { label: 'The plan, before provider savings', total: BEST.planGross },
  {
    label: 'Providers collect every dollar billed, so rates can be set lower',
    delta: -BEST.collectability,
    conditional: true,
  },
  {
    label: 'Providers need fewer billing staff hours, so rates can be set lower',
    delta: -BEST.providerAdmin,
    conditional: true,
  },
  { label: 'The plan', total: BEST.plan },
];

/**
 * How far below otherwise-expected rates the plan would have to pay providers to
 * capture both savings: the savings over what the plan pays providers (its
 * spending less its own administration).
 */
export const RATE_RESET = {
  best: (BEST.collectability + BEST.providerAdmin) / (BEST.planGross - BEST.planAdmin),
  low: (LOW.collectability + LOW.providerAdmin) / (LOW.planGross - LOW.planAdmin),
};

export interface Scenario {
  label: string;
  detail: string;
  /** Plan cost minus current-system cost, in billions. Positive costs more. */
  delta: number;
  /** The current-system figure it is measured against. */
  baseline: number;
  /** True when the board or Milliman published this comparison. */
  published: boolean;
}

/**
 * The plan against the current system. The two published estimates come first.
 * Both assume provider rates are reset; the two sensitivity rows (ours) show
 * each estimate without that reset, so neither is singled out.
 */
export const SCENARIOS_STATEWIDE: readonly Scenario[] = [
  {
    label: "Milliman's best estimate",
    detail: 'Published. Provider rates are reset so providers are paid about what they are now.',
    delta: round1(BEST.plan - BEST.statusQuo),
    baseline: BEST.statusQuo,
    published: true,
  },
  {
    label: "The board's assumptions",
    detail: 'Published. Adds slower cost growth, 3% administration, cheaper drugs and less fraud.',
    delta: round1(BOARD.plan - LOW.statusQuo),
    baseline: LOW.statusQuo,
    published: true,
  },
  {
    label: "Milliman's best estimate, if provider rates are not reset",
    detail: 'The plan pays current rates in full, an effective raise for providers of about 10%.',
    delta: round1(BEST.planGross - BEST.statusQuo),
    baseline: BEST.statusQuo,
    published: false,
  },
  {
    label: "The board's assumptions, if provider rates are not reset",
    detail: 'The same, on the board\'s lower-cost assumptions.',
    delta: round1(BOARD.plan + LOW.collectability + LOW.providerAdmin - LOW.statusQuo),
    baseline: LOW.statusQuo,
    published: false,
  },
];

/** Milliman's high estimate of the plan, after its two provider savings (Table E7). */
export const HIGH_PLAN = 86.5;

export interface Raised {
  name: string;
  /** Premiums and out-of-pocket today; new state taxes under the plan. */
  main: number;
  /** Medicare Part B premiums: enrollees today, the plan tomorrow. */
  partB: number;
}

/**
 * Money raised from Oregon employers and households, today against the plan.
 * Today's figure is the current-system total less the public funding the
 * report expects to continue. Part B premiums are shown on both sides.
 *
 * Deliberately NOT stacked with public funding into a grand total: the report
 * does not say whether its public-funding figure is net of the premiums
 * Oregonians pay into Medicare, so such a total could count Part B twice.
 */
export const RAISED_IN_OREGON: { best: Raised[]; board: Raised[] } = {
  best: [
    { name: 'Today', main: round1(BEST.statusQuo - BEST.publicFunding), partB: PART_B },
    { name: 'Plan', main: round1(BEST.plan - BEST.publicFunding), partB: PART_B },
  ],
  board: [
    { name: 'Today', main: round1(LOW.statusQuo - LOW.publicFunding), partB: PART_B },
    { name: 'Plan', main: round1(BOARD.plan - LOW.publicFunding), partB: PART_B },
  ],
};

/** What employers and households pay today, including Part B premiums. */
export const PRIVATE_TODAY = {
  best: round1(BEST.statusQuo - BEST.publicFunding + PART_B),
  board: round1(LOW.statusQuo - LOW.publicFunding + PART_B),
};
