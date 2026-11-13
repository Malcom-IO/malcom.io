/**
 * The numbers behind the Oregon Universal Health Plan explainer.
 *
 * Every figure here is transcribed from the Universal Health Plan Governance
 * Board's draft legislative report (dated 2026-10-13), its legislative brief, or
 * the report's Appendix FR (draft 2026-10-13, "expenditure-revenue-appendix"),
 * which holds the bracket schedule for each model. Nothing is estimated by us.
 * When the board revises its models, this file is the only place the numbers live.
 *
 * RATES: all five models use the appendix's rates, which were set on one common
 * basis (2022 tax data, the same revenue for each). Model 3 uses 7.69%, the
 * unrounded figure from the report's Table R4; the appendix prints 7.7% and the
 * board's examples need 7.69%. The report's summary table lists different
 * "maximum" rates for three models: 12.0% for Model 1 (the Legislative Revenue
 * Office's 2032 projection, which also raises the payroll tax to 9.89%) and 11.7% / 10.4% for
 * Models 4 and 5 (which match the AVERAGE rate paid by the top 1%, not the top
 * marginal rate). The board's own example tables use the appendix rates.
 *
 * Kept free of Angular so the math can be tested directly against the board's
 * own worked examples (see uhp-model.spec.ts).
 */

/** 200% of the 2026 federal poverty level, by household size (report Table R2). */
export const FPL_200: Readonly<Record<number, number>> = {
  1: 31_920,
  2: 43_280,
  3: 54_640,
  4: 66_000,
  5: 77_360,
};

/** 138% of the 2026 federal poverty level (report Table R2). Models 4 and 5. */
export const FPL_138: Readonly<Record<number, number>> = {
  1: 22_025,
  2: 29_863,
  3: 37_702,
  4: 45_540,
  5: 53_378,
};

export type ModelId = 1 | 2 | 3 | 4 | 5;

export interface RevenueModel {
  id: ModelId;
  /** Employer payroll tax tiers, in plain words. */
  employerTax: string;
  /** Share of the employer's payroll tax on your wages credited back to you. */
  creditShare: 0 | 0.5;
  /** Income exempt from the household contribution, as a share of FPL. */
  exemption: '200% FPL' | '138% FPL';
  brackets: number;
  /** Top marginal household rate (appendix). For two-bracket models, the only rate. */
  topRate: number;
  /** The "maximum" rate the report's summary table lists, where it differs. */
  reportRate?: number;
  /** Marginal rates above the exemption, lowest first. */
  rates: readonly number[];
  /** Share of Oregon tax returns that would owe no household contribution. */
  returnsOwingNothing: number;
  /** Average net household contribution rate for the middle fifth of incomes. */
  middleFifthRate: number;
  /** Share of all household contributions paid by the top 1% of incomes (Table R5). */
  top1Share: number;
  /** OUR short label. The board only numbers its models. */
  name: string;
  /** One or two plain sentences on what sets this model apart. */
  blurb: string;
  /** Income exempt for a family of four, in dollars (Table R2). */
  exemptFamilyOf4: number;
  /**
   * Average COMBINED rate (household contribution plus the employer payroll tax
   * attributed to wages) for each fifth of incomes, lowest first
   * (Appendix FR Figure AFR4Fi; report Table R8).
   */
  combinedByFifth: readonly [number, number, number, number, number];
}

/** Report Tables R3, R4 and R7; brief pages 8-9. */
export const MODELS: readonly RevenueModel[] = [
  {
    id: 1,
    name: 'One rate, flat payroll tax',
    blurb:
      "One household rate above the exemption and one payroll rate above $500,000, with the worker credit. The board calls it the simplest to explain and the least progressive.",
    combinedByFifth: [0.076, 0.061, 0.081, 0.104, 0.135],
    top1Share: 0.307,
    exemptFamilyOf4: 66_000,
    employerTax: '9.6% of payroll above $500,000',
    creditShare: 0.5,
    exemption: '200% FPL',
    brackets: 2,
    topRate: 0.135,
    reportRate: 0.12,
    rates: [0.135],
    returnsOwingNothing: 0.545,
    middleFifthRate: 0.02,
  },
  {
    id: 2,
    name: 'One rate, worker credit',
    blurb:
      "Model 1 plus a 14% payroll tier above $10 million, which Models 3 to 5 share. More comes from the largest payrolls, so the household rate is lower.",
    combinedByFifth: [0.097, 0.078, 0.089, 0.105, 0.13],
    top1Share: 0.339,
    exemptFamilyOf4: 66_000,
    employerTax: '9.6% above $500,000, 14% above $10 million',
    creditShare: 0.5,
    exemption: '200% FPL',
    brackets: 2,
    topRate: 0.1205,
    rates: [0.1205],
    returnsOwingNothing: 0.604,
    middleFifthRate: 0.011,
  },
  {
    id: 3,
    name: 'One rate, no credit',
    blurb:
      "Model 2 without the worker credit. The household rate is the lowest of the five, but more households pay it, and the middle fifth pays the most of any model.",
    combinedByFifth: [0.097, 0.081, 0.104, 0.114, 0.122],
    top1Share: 0.253,
    exemptFamilyOf4: 66_000,
    employerTax: '9.6% above $500,000, 14% above $10 million',
    creditShare: 0,
    exemption: '200% FPL',
    brackets: 2,
    topRate: 0.0769,
    rates: [0.0769],
    returnsOwingNothing: 0.403,
    middleFifthRate: 0.025,
  },
  {
    id: 4,
    name: 'Stepped rates, worker credit',
    blurb:
      "The contribution starts at a lower income and rises in steps to the highest top rate of the five, with the worker credit. The most filers owe nothing, and the top 1% carry the largest share.",
    combinedByFifth: [0.097, 0.078, 0.086, 0.097, 0.135],
    top1Share: 0.399,
    exemptFamilyOf4: 45_540,
    employerTax: '9.6% above $500,000, 14% above $10 million',
    creditShare: 0.5,
    exemption: '138% FPL',
    brackets: 5,
    topRate: 0.143,
    reportRate: 0.117,
    rates: [0.03, 0.09, 0.12, 0.143],
    returnsOwingNothing: 0.649,
    middleFifthRate: 0.008,
  },
  {
    id: 5,
    name: 'Stepped rates, no credit',
    blurb:
      "Six steps, the lower exemption and no worker credit. The board calls it the most progressive and the most complicated. About 7 in 10 filers would pay something.",
    combinedByFifth: [0.097, 0.082, 0.099, 0.104, 0.128],
    top1Share: 0.356,
    exemptFamilyOf4: 45_540,
    employerTax: '9.6% above $500,000, 14% above $10 million',
    creditShare: 0,
    exemption: '138% FPL',
    brackets: 6,
    topRate: 0.12,
    reportRate: 0.104,
    rates: [0.02, 0.0478, 0.07, 0.09, 0.12],
    returnsOwingNothing: 0.312,
    middleFifthRate: 0.02,
  },
];

/**
 * Who pays the household's wages. It decides the payroll tax an employer would
 * owe on those wages, which is what the 50% credit in Models 1, 2 and 4 is based on.
 */
export type EmployerKind = 'none' | 'private' | 'public';

export interface EmployerOption {
  kind: EmployerKind;
  label: string;
}

export const EMPLOYERS: readonly EmployerOption[] = [
  { kind: 'private', label: 'A private employer' },
  { kind: 'public', label: 'A public employer (state, city, school district, university)' },
  { kind: 'none', label: 'Self-employed, or no wages' },
];

/** Payroll below this is untaxed in every model. */
export const PAYROLL_EXEMPT = 500_000;
/** Payroll above this is taxed at 14% in Models 2 to 5. */
export const PAYROLL_UPPER_TIER = 10_000_000;

/**
 * Employer payroll tax on a year's payroll. Marginal: only payroll above
 * $500,000 is taxed, so there is no cliff (Appendix FR: rates are marginal "to
 * avoid fiscal cliffs"). Model 1 has one rate; Models 2 to 5 add a 14% tier
 * above $10 million (report Table R4).
 */
export function payrollTax(payroll: number, model: ModelId): number {
  const lower = Math.max(0, Math.min(payroll, PAYROLL_UPPER_TIER) - PAYROLL_EXEMPT) * 0.096;
  const upper = Math.max(0, payroll - PAYROLL_UPPER_TIER) * (model === 1 ? 0.096 : 0.14);
  return lower + upper;
}

/**
 * Effective employer payroll tax rate on a worker's wages.
 *
 * Private: the firm's tax divided by its payroll. At the board's $8.5 million
 * example this is 9.04%, which the report rounds to 9.0%.
 * Public: the top rate from the first dollar. The appendix says "for public
 * employers, the first dollar of payroll is subject to the highest EPT marginal
 * rate", which is 9.6% in Model 1 and 14% in the others (report page 45).
 */
export function employerRate(kind: EmployerKind, model: ModelId, payroll = 0): number {
  if (kind === 'none') return 0;
  if (kind === 'public') return model === 1 ? 0.096 : 0.14;
  return payroll > 0 ? payrollTax(payroll, model) / payroll : 0;
}

export interface BillInput {
  /** Household adjusted gross income. */
  income: number;
  /** The part of that income that is wages from the employer above. */
  wages: number;
  /** Household size, 1 to 5. */
  size: number;
  /** Income exempt from the contribution. */
  exemption: number;
  /** Household contribution rate on income above the exemption. */
  rate: number;
  /** Share of the employer's payroll tax credited to the household. */
  creditShare: number;
  /** Employer payroll tax rate on the wages. */
  employerRate: number;
}

/**
 * Household health care contribution for a two-bracket model:
 * rate x (income above the exemption), less the credit, never below zero.
 */
export function householdContribution(input: Omit<BillInput, 'size'>): number {
  const gross = Math.max(0, input.income - input.exemption) * input.rate;
  const credit = input.creditShare * input.employerRate * input.wages;
  return Math.max(0, gross - credit);
}

/**
 * The appendix states dollar bracket boundaries in 2022 dollars and says they are
 * inflation adjusted, without giving a factor. Growth in the ONE-person poverty
 * level (13,590 to 15,960) is our inference: it reproduces the board's 2026
 * examples, and the two-person ratio does not.
 */
const INDEX_2022_TO_2026 = 15_960 / 13_590;

export interface Bracket {
  /** Income at which this marginal rate starts, in 2026 dollars. */
  from: number;
  rate: number;
}

/**
 * The household contribution schedule for a model and household size
 * (Appendix FR, pages 31-35). Models 1 to 3: one rate above 200% of FPL.
 * Models 4 and 5: a low rate from 138% to 200% of FPL, then steps at dollar
 * amounts that are twice as high for households of two or more.
 */
export function schedule(model: RevenueModel, size: number): Bracket[] {
  if (model.rates.length === 1) return [{ from: FPL_200[size], rate: model.rates[0] }];
  const base = (size === 1 ? 50_000 : 100_000) * INDEX_2022_TO_2026;
  const starts = [FPL_138[size], FPL_200[size], Math.max(base, FPL_200[size]), base * 2, base * 4];
  return model.rates.map((rate, i) => ({ from: starts[i], rate }));
}

/** Contribution before any credit: each slice of income taxed at its own rate. */
export function grossContribution(income: number, brackets: readonly Bracket[]): number {
  let total = 0;
  brackets.forEach((b, i) => {
    const top = brackets[i + 1]?.from ?? Infinity;
    total += Math.max(0, Math.min(income, top) - b.from) * b.rate;
  });
  return total;
}

/** What a household owes: the gross contribution less the worker credit, never below zero. */
export function contribution(
  model: RevenueModel,
  income: number,
  wages: number,
  size: number,
  employerTaxRate: number,
): number {
  const gross = grossContribution(income, schedule(model, size));
  return Math.max(0, gross - model.creditShare * employerTaxRate * wages);
}

export interface Bill {
  model: RevenueModel;
  /** What the household would owe per year. */
  household: number;
  /** The contribution before the worker credit. */
  gross: number;
  /** The worker credit actually used (never more than the gross contribution). */
  credit: number;
  /** What the employer would pay in payroll tax on this household's wages. */
  employer: number;
}

/**
 * A household's yearly bill under one model, treating all income as wages when
 * there is an employer. `payroll` is the private employer's total yearly payroll.
 */
export function bill(
  model: RevenueModel,
  income: number,
  size: number,
  kind: EmployerKind,
  payroll = 0,
): Bill {
  const eRate = employerRate(kind, model.id, payroll);
  const wages = kind === 'none' ? 0 : income;
  const gross = grossContribution(income, schedule(model, size));
  const household = contribution(model, income, wages, size, eRate);
  return { model, household, gross, credit: gross - household, employer: eRate * wages };
}

// ------------------------------------------------------- the board's examples

export interface ScenarioRow {
  income: number;
  /** Wages the board's employer-tax figures imply, where an employer pays. */
  wages?: number;
  /** What the household pays today, per the board. */
  now: number;
  /** What the household would pay under Models 1 to 5. */
  models: readonly [number, number, number, number, number];
}

export interface Scenario {
  id: string;
  tab: string;
  who: string;
  today: string;
  rows: readonly ScenarioRow[];
}

/** Report Tables S1 to S4 (pages 43-47), household-pays rows, verbatim. */
export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'self',
    tab: 'Self-employed',
    who: 'One 45-year-old, self-employed or at a small firm, buying their own insurance.',
    today:
      "Today: a silver marketplace plan at a 45-year-old's price, after subsidies, plus out-of-pocket costs. Older buyers pay more than this today. If you are uninsured, your cost today is whatever you pay for care.",
    rows: [
      { income: 20_000, now: 0, models: [0, 0, 0, 0, 0] },
      { income: 45_000, now: 5_211, models: [1_766, 1_576, 1_006, 1_474, 823] },
      { income: 90_000, now: 6_900, models: [7_841, 6_999, 4_466, 6_462, 3_699] },
      { income: 180_000, now: 6_900, models: [19_991, 17_844, 11_387, 18_701, 11_220] },
    ],
  },
  {
    id: 'private',
    tab: 'Private employer',
    who: 'A household of two, insured through a private employer with an $8.5 million payroll.',
    today:
      'Today: $2,900 in premiums and $1,800 out of pocket. The employer pays another $16,700.',
    rows: [
      { income: 40_000, wages: 40_000, now: 0, models: [0, 0, 0, 0, 203] },
      { income: 85_000, wages: 80_000, now: 4_700, models: [2_032, 1_427, 3_208, 557, 2_263] },
      { income: 110_000, wages: 100_000, now: 4_700, models: [4_507, 3_540, 5_131, 1_907, 3_458] },
      { income: 170_000, wages: 150_000, now: 4_700, models: [10_357, 8_520, 9_745, 6_634, 7_492] },
      { income: 220_000, wages: 200_000, now: 4_700, models: [14_857, 12_295, 13_590, 10_384, 10_992] },
    ],
  },
  {
    id: 'public',
    tab: 'Public employer',
    who: 'One person working for a public employer.',
    today: 'Today: $120 in premiums and $500 out of pocket. The employer pays another $12,000.',
    rows: [
      { income: 40_000, wages: 40_000, now: 620, models: [0, 0, 621, 0, 581] },
      { income: 51_000, wages: 50_000, now: 620, models: [176, 0, 1_467, 0, 1_110] },
      { income: 66_000, wages: 64_000, now: 620, models: [1_529, 0, 2_621, 0, 1_989] },
      { income: 85_000, wages: 80_000, now: 620, models: [3_326, 796, 4_082, 262, 3_319] },
      { income: 110_000, wages: 100_000, now: 620, models: [5_741, 2_409, 6_004, 1_862, 5_069] },
    ],
  },
  {
    id: 'medicare',
    tab: 'On Medicare',
    who: 'A household of two on Medicare, living on Social Security and other non-wage income.',
    today: 'Today: $4,800 in Medicare Part B premiums and $4,800 out of pocket.',
    rows: [
      { income: 45_000, now: 9_600, models: [232, 207, 132, 557, 351] },
      { income: 75_000, now: 9_600, models: [4_282, 3_822, 2_439, 3_257, 1_785] },
      { income: 112_500, now: 9_600, models: [9_345, 8_341, 5_323, 6_632, 3_577] },
      { income: 162_000, now: 9_600, models: [16_027, 14_306, 9_130, 12_424, 6_932] },
      { income: 215_000, now: 9_600, models: [23_182, 20_692, 13_205, 18_784, 10_642] },
    ],
  },
];
