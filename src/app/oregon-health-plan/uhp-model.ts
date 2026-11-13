/**
 * The numbers behind the Oregon Universal Health Plan explainer.
 *
 * Every figure here is transcribed from the Universal Health Plan Governance
 * Board's draft legislative report (dated 2026-10-13) or its legislative brief
 * (dated 2026-10-14). Nothing is estimated by us. When the board revises its
 * models, this file is the only place the numbers live.
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
  /** Top household contribution rate. For two-bracket models it is the only rate. */
  topRate: number;
  /** Share of Oregon tax returns that would owe no household contribution. */
  returnsOwingNothing: number;
  /** Average net household contribution rate for the middle fifth of incomes. */
  middleFifthRate: number;
  /** True when the report publishes enough to compute a household's bill. */
  computable: boolean;
  /** Share of all household contributions paid by the top 1% of incomes (Table R5). */
  top1Share: number;
  /** OUR short label. The board only numbers its models. */
  name: string;
  /** One or two plain sentences on what sets this model apart. */
  blurb: string;
  /** Income exempt for a family of four, in dollars (Table R2). */
  exemptFamilyOf4: number;
}

/** Report Tables R3, R4 and R7; brief pages 8-9. */
export const MODELS: readonly RevenueModel[] = [
  {
    id: 1,
    name: 'Simple flat rate',
    blurb:
      'One rate on everything above the exemption, for employers and households alike. The board calls it the simplest to explain and the least progressive.',
    top1Share: 0.307,
    exemptFamilyOf4: 66_000,
    employerTax: '9.6% of payroll above $500,000',
    creditShare: 0.5,
    exemption: '200% FPL',
    brackets: 2,
    topRate: 0.12,
    returnsOwingNothing: 0.545,
    middleFifthRate: 0.02,
    computable: true,
  },
  {
    id: 2,
    name: 'Flat rate, big employers pay more',
    blurb:
      "Model 1 with a higher payroll tax on the largest employers. The credit wipes out more workers' bills, so the top rate is the highest of the five.",
    top1Share: 0.339,
    exemptFamilyOf4: 66_000,
    employerTax: '9.6% above $500,000, 14% above $10 million',
    creditShare: 0.5,
    exemption: '200% FPL',
    brackets: 2,
    topRate: 0.1205,
    returnsOwingNothing: 0.604,
    middleFifthRate: 0.011,
    computable: true,
  },
  {
    id: 3,
    name: 'Lowest rate, more people pay',
    blurb:
      'No credit for workers, so more households pay than under Models 1 and 2, and the rate drops to the lowest of the five.',
    top1Share: 0.253,
    exemptFamilyOf4: 66_000,
    employerTax: '9.6% above $500,000, 14% above $10 million',
    creditShare: 0,
    exemption: '200% FPL',
    brackets: 2,
    topRate: 0.0769,
    returnsOwingNothing: 0.403,
    middleFifthRate: 0.025,
    computable: true,
  },
  {
    id: 4,
    name: 'Stepped rates, fewest pay',
    blurb:
      'Taxes start at a lower income but rise in five steps, with the worker credit. The most filers owe nothing, and the top 1% carry the largest share.',
    top1Share: 0.399,
    exemptFamilyOf4: 45_540,
    employerTax: '9.6% above $500,000, 14% above $10 million',
    creditShare: 0.5,
    exemption: '138% FPL',
    brackets: 5,
    topRate: 0.117,
    returnsOwingNothing: 0.649,
    middleFifthRate: 0.008,
    computable: false,
  },
  {
    id: 5,
    name: 'Stepped rates, most pay',
    blurb:
      'Six steps, a lower exemption and no worker credit. The board calls it the most progressive and the most complicated. About 7 in 10 filers would pay something.',
    top1Share: 0.356,
    exemptFamilyOf4: 45_540,
    employerTax: '9.6% above $500,000, 14% above $10 million',
    creditShare: 0,
    exemption: '138% FPL',
    brackets: 6,
    topRate: 0.104,
    returnsOwingNothing: 0.312,
    middleFifthRate: 0.02,
    computable: false,
  },
];

/** The three models whose household bill can be worked out from the report. */
export const COMPUTABLE_MODELS = MODELS.filter((m) => m.computable);

/**
 * Who pays you. It decides the payroll tax your employer would owe on your
 * wages, which is what the 50% credit in Models 1, 2 and 4 is based on.
 */
export type EmployerKind = 'none' | 'midsize' | 'large';

export interface EmployerOption {
  kind: EmployerKind;
  label: string;
  detail: string;
}

export const EMPLOYERS: readonly EmployerOption[] = [
  {
    kind: 'none',
    label: 'Self-employed, small employer, or no wages',
    detail: 'Payroll under $500,000 a year is exempt, so there is no payroll tax and no credit.',
  },
  {
    kind: 'midsize',
    label: 'Mid-size private employer',
    detail: "The board's example: an $8.5 million payroll, which works out to 9.0% of wages.",
  },
  {
    kind: 'large',
    label: 'Public employer',
    detail:
      "The board's example: 9.6% of wages under Model 1, 14% under the others. A large private firm would land between this and mid-size.",
  },
];

/**
 * Effective employer payroll tax rate on a worker's wages, as the board's
 * scenarios apply it (report pages 43-45).
 */
export function employerRate(kind: EmployerKind, model: ModelId): number {
  if (kind === 'none') return 0;
  if (kind === 'midsize') return 0.09;
  return model === 1 ? 0.096 : 0.14;
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

export interface Bill {
  model: RevenueModel;
  /** What the household would owe per year. */
  household: number;
  /** What the employer would pay in payroll tax on this household's wages. */
  employer: number;
  /** Income at which the household's bill equals `currentCost`, if any. */
  breakEven: number | null;
}

/**
 * A household's yearly bill under one computable model, treating all income as
 * wages when there is an employer (the same simplification the board uses).
 */
export function bill(
  model: RevenueModel,
  income: number,
  size: number,
  kind: EmployerKind,
  currentCost: number,
): Bill {
  const exemption = FPL_200[size];
  const eRate = employerRate(kind, model.id);
  const household = householdContribution({
    income,
    wages: kind === 'none' ? 0 : income,
    exemption,
    rate: model.topRate,
    creditShare: model.creditShare,
    employerRate: eRate,
  });
  // rate x (I - exemption) - credit x eRate x I = currentCost, solved for I.
  const slope = model.topRate - model.creditShare * eRate;
  const breakEven = slope > 0 ? (currentCost + model.topRate * exemption) / slope : null;
  return { model, household, employer: eRate * (kind === 'none' ? 0 : income), breakEven };
}

// ------------------------------------------------------- the board's examples

export interface ScenarioRow {
  income: number;
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
    today: 'Today: individual-market premiums and out-of-pocket costs that vary with income.',
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
      { income: 40_000, now: 0, models: [0, 0, 0, 0, 203] },
      { income: 85_000, now: 4_700, models: [2_032, 1_427, 3_208, 557, 2_263] },
      { income: 110_000, now: 4_700, models: [4_507, 3_540, 5_131, 1_907, 3_458] },
      { income: 170_000, now: 4_700, models: [10_357, 8_520, 9_745, 6_634, 7_492] },
      { income: 220_000, now: 4_700, models: [14_857, 12_295, 13_590, 10_384, 10_992] },
    ],
  },
  {
    id: 'public',
    tab: 'Public employer',
    who: 'One person working for a public employer.',
    today: 'Today: $120 in premiums and $500 out of pocket. The employer pays another $12,000.',
    rows: [
      { income: 40_000, now: 620, models: [0, 0, 621, 0, 581] },
      { income: 51_000, now: 620, models: [176, 0, 1_467, 0, 1_110] },
      { income: 66_000, now: 620, models: [1_529, 0, 2_621, 0, 1_989] },
      { income: 85_000, now: 620, models: [3_326, 796, 4_082, 262, 3_319] },
      { income: 110_000, now: 620, models: [5_741, 2_409, 6_004, 1_862, 5_069] },
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
