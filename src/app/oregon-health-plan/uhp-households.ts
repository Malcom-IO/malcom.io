import { EmployerKind, MODELS, bill } from './uhp-model';

/**
 * A fixed set of example households, run through the same schedules as the
 * calculator so they can be read side by side (and printed, where a calculator
 * cannot work). These are OUR examples, not the board's: the incomes and the
 * "pays today" figures are chosen for illustration, except the two marked
 * `boardFigure`, which reuse the board's own status-quo examples.
 */
export interface HouseholdExample {
  who: string;
  detail: string;
  size: number;
  income: number;
  employer: EmployerKind;
  /** Yearly payroll of the private employer; sets the worker credit. */
  payroll?: number;
  /** What the household pays for health care today, per year. */
  now: number;
  boardFigure?: boolean;
}

const MID_SIZE_PAYROLL = 8_500_000;

export const HOUSEHOLD_EXAMPLES: readonly HouseholdExample[] = [
  {
    who: 'Single worker',
    detail: '1 person, $45,000, covered through a private employer',
    size: 1,
    income: 45_000,
    employer: 'private',
    payroll: MID_SIZE_PAYROLL,
    now: 2_400,
  },
  {
    who: 'Couple, one job with coverage',
    detail: '2 people, $85,000, private employer',
    size: 2,
    income: 85_000,
    employer: 'private',
    payroll: MID_SIZE_PAYROLL,
    now: 4_700,
    boardFigure: true,
  },
  {
    who: 'Self-employed, buys own plan',
    detail: '1 person, $70,000',
    size: 1,
    income: 70_000,
    employer: 'none',
    now: 6_900,
    boardFigure: true,
  },
  {
    who: 'Family of four, public employee',
    detail: '4 people, $110,000, school district or other public employer',
    size: 4,
    income: 110_000,
    employer: 'public',
    now: 4_700,
  },
  {
    who: 'Family of four, private employer',
    detail: '4 people, $120,000',
    size: 4,
    income: 120_000,
    employer: 'private',
    payroll: MID_SIZE_PAYROLL,
    now: 7_000,
  },
  {
    who: 'Family of four, higher income',
    detail: '4 people, $250,000, private employer',
    size: 4,
    income: 250_000,
    employer: 'private',
    payroll: MID_SIZE_PAYROLL,
    now: 9_000,
  },
  {
    who: 'Family of four, two self-employed',
    detail: '4 people, $400,000, buying their own plan',
    size: 4,
    income: 400_000,
    employer: 'none',
    now: 25_000,
  },
  {
    who: 'Family of four, two self-employed',
    detail: '4 people, $1,000,000, buying their own plan',
    size: 4,
    income: 1_000_000,
    employer: 'none',
    now: 25_000,
  },
  {
    who: 'Family of four, two self-employed',
    detail: '4 people, $2,000,000, buying their own plan',
    size: 4,
    income: 2_000_000,
    employer: 'none',
    now: 25_000,
  },
];

/** Each example with its yearly household contribution under Models 1 to 5. */
export const HOUSEHOLD_ROWS = HOUSEHOLD_EXAMPLES.map((h) => ({
  ...h,
  models: MODELS.map((m) => bill(m, h.income, h.size, h.employer, h.payroll ?? 0).household),
}));
