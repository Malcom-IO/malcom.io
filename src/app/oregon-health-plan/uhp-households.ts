import { EmployerKind, MODELS, contribution, employerRate } from './uhp-model';

/**
 * A fixed set of example households, run through the same schedules as the
 * calculator so they can be read side by side (and printed, where a calculator
 * cannot work).
 *
 * The households are our choice, but nothing about them is invented: what each
 * pays today, and how much of its income is wages, come from the board's own
 * examples (report Tables S1, S2 and S4) or from Appendix FR Figures AFR4Fb
 * (household of one) and AFR4Fc (household of four). Above the appendix's top
 * income of $400,000 we hold its last status-quo figure.
 */
export interface HouseholdExample {
  who: string;
  detail: string;
  size: number;
  /** Adjusted gross income. */
  income: number;
  /** The part of income that is wages, which is what earns the worker credit. */
  wages: number;
  employer: EmployerKind;
  /** What the household pays for health care today, per year, per `source`. */
  now: number;
  source: 'S1' | 'S2' | 'S4' | 'AFR4Fb' | 'AFR4Fc';
}

/**
 * The payroll rate the board's Table S2 uses for its private employer (an $8.5
 * million payroll, rounded to 9%). It sets the worker credit in the private rows.
 */
export const BOARD_PRIVATE_RATE = 0.09;
/** Status-quo cost of a family of four buying its own plan, AFR4Fc, $130,000 and up. */
const FAMILY_MARKET = 22_871;

export const HOUSEHOLD_EXAMPLES: readonly HouseholdExample[] = [
  {
    who: 'Single worker, private employer',
    detail: '1 person, about the median for one',
    size: 1,
    income: 45_000,
    wages: 42_300,
    employer: 'private',
    now: 2_150,
    source: 'AFR4Fb',
  },
  {
    who: 'Single public employee',
    detail: '1 person, school district or other public employer, about the 80th percentile for one',
    size: 1,
    income: 80_000,
    wages: 73_300,
    employer: 'public',
    now: 940,
    source: 'AFR4Fb',
  },
  {
    who: 'Self-employed, buys own plan',
    detail: '1 person, above the 80th percentile for one',
    size: 1,
    income: 90_000,
    wages: 0,
    employer: 'none',
    now: 6_900,
    source: 'S1',
  },
  {
    who: 'Couple, private employer',
    detail: '2 people, the median for two',
    size: 2,
    income: 85_000,
    wages: 80_000,
    employer: 'private',
    now: 4_700,
    source: 'S2',
  },
  {
    who: 'Retired couple on Medicare',
    detail: '2 people, income not counting Social Security',
    size: 2,
    income: 75_000,
    wages: 0,
    employer: 'none',
    now: 9_600,
    source: 'S4',
  },
  {
    who: 'Family of four, private employer',
    detail: '4 people, below the median for four',
    size: 4,
    income: 70_000,
    wages: 65_000,
    employer: 'private',
    now: 10_000,
    source: 'AFR4Fc',
  },
  {
    who: 'Family of four, private employer',
    detail: '4 people, the median for four',
    size: 4,
    income: 110_000,
    wages: 99_000,
    employer: 'private',
    now: 10_000,
    source: 'AFR4Fc',
  },
  {
    who: 'Family of four, public employer',
    detail: '4 people, the median for four',
    size: 4,
    income: 110_000,
    wages: 99_000,
    employer: 'public',
    now: 4_000,
    source: 'AFR4Fc',
  },
  {
    who: 'Family of four, private employer',
    detail: '4 people, about the 80th percentile for four',
    size: 4,
    income: 220_000,
    wages: 180_000,
    employer: 'private',
    now: 10_000,
    source: 'AFR4Fc',
  },
  {
    who: 'Family of four, self-employed',
    detail: '4 people, buying their own plan, between the 80th and 95th percentile',
    size: 4,
    income: 400_000,
    wages: 0,
    employer: 'none',
    now: FAMILY_MARKET,
    source: 'AFR4Fc',
  },
  {
    who: 'Family of four, self-employed',
    detail: '4 people, buying their own plan, above the 95th percentile ($500,000)',
    size: 4,
    income: 1_000_000,
    wages: 0,
    employer: 'none',
    now: FAMILY_MARKET,
    source: 'AFR4Fc',
  },
  {
    who: 'Family of four, self-employed',
    detail: '4 people, buying their own plan, above the 95th percentile ($500,000)',
    size: 4,
    income: 2_000_000,
    wages: 0,
    employer: 'none',
    now: FAMILY_MARKET,
    source: 'AFR4Fc',
  },
];

/** Each example with its yearly household contribution under Models 1 to 5. */
export const HOUSEHOLD_ROWS = HOUSEHOLD_EXAMPLES.map((h) => ({
  ...h,
  models: MODELS.map((m) =>
    contribution(
      m,
      h.income,
      h.wages,
      h.size,
      h.employer === 'private' ? BOARD_PRIVATE_RATE : employerRate(h.employer, m.id),
    ),
  ),
}));
