import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from '../quillquest/quillquest-shell.component';
import {
  EMPLOYERS,
  EmployerKind,
  FPL_138,
  FPL_200,
  MODELS,
  PAYROLL_EXEMPT,
  Bill,
  RevenueModel,
  SCENARIOS,
  bill,
  employerRate,
  payrollTax,
} from './uhp-model';

import {
  BEST,
  BRIDGE,
  LOW,
  PRIVATE_TODAY,
  RATE_RESET,
  REVENUE_TARGET,
  RAISED_IN_OREGON,
  HIGH_PLAN,
  SCENARIOS_STATEWIDE,
  perPerson,
} from './uhp-statewide';

export type CoverageKind = 'employer' | 'own' | 'medicare' | 'ohp' | 'none';

interface CoverageOption {
  kind: CoverageKind;
  label: string;
  /** The board's example figure for what such a household pays today. */
  typicalCost: number;
  /** Set when the choice implies who pays the wages. */
  employer?: EmployerKind;
  /** Shown under "what you pay now". */
  hint: string;
  /** Shown above the results when there is something this reader must know. */
  note?: string;
}

/** Figures are the board's own "status quo" examples (report Tables S1 to S4). */
const COVERAGES: readonly CoverageOption[] = [
  {
    kind: 'employer',
    label: 'Through a job',
    typicalCost: 4_700,
    hint: "Your share of premiums plus deductibles, copays and prescriptions. Leave out what your employer pays. The board's example for a couple is $4,700.",
  },
  {
    kind: 'own',
    label: 'I buy my own plan',
    typicalCost: 6_900,
    employer: 'none',
    hint: "Your premiums after any subsidy, plus deductibles, copays and prescriptions. The board's example, a 45-year-old with a silver plan, is $6,900; older buyers pay more.",
  },
  {
    kind: 'medicare',
    label: 'Medicare',
    typicalCost: 9_600,
    employer: 'none',
    hint: "Part B premiums plus Medigap, Part D and what you pay out of pocket. The board's example for a couple is $9,600.",
    note: 'Leave Social Security out of your income; it does not count toward the contribution. The figures assume the plan pays your Part B premium, which the board recommends but calls unfinished. The report does not say what happens to Medigap or Part D.',
  },
  {
    kind: 'ohp',
    label: 'Oregon Health Plan',
    typicalCost: 0,
    hint: 'Most Oregon Health Plan members pay nothing today, so this is $0.',
    note: 'You would keep your coverage. The board says most people who qualify for the Oregon Health Plan by income would have no health care costs under the plan.',
  },
  {
    kind: 'none',
    label: 'No insurance',
    typicalCost: 0,
    hint: 'Enter what you spend on care in a typical year, or leave it at $0.',
    note: 'You would be covered. The amounts below are what you would pay toward the plan; in return, care would be covered with no premium and, if the board keeps its goal, no deductible or copay.',
  },
];

/** Longest bar in the statewide charts, in billions; bars scale against it. */
const BAR_MAX = 8;

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const BASE = 'https://www.oregon.gov/uhpgb';

/** Chart series colors: the validated dark-surface categorical slots 1 to 5. */
const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'] as const;

interface EndLabel {
  y: number;
  text: string;
}

/**
 * A plain-language explainer of Oregon's proposed Universal Health Plan, with a
 * calculator built on the Governance Board's own published models.
 *
 * This is a civic explainer, not studio marketing: it is deliberately neutral,
 * every number traces to a board document (see uhp-model.ts), and it says
 * plainly what the board has not decided. Not linked from the main nav.
 */
@Component({
  selector: 'app-oregon-health-plan',
  imports: [RouterLink, QuillquestShellComponent],
  templateUrl: './oregon-health-plan.component.html',
  styleUrl: './oregon-health-plan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OregonHealthPlanComponent {
  readonly updated = 'November 12, 2026';
  readonly sources = {
    report: `${BASE}/Documents/board-meetings/2026/20261015/20261015-legislative-report-draft.pdf`,
    brief: `${BASE}/Documents/board-meetings/2026/20261015/legislative-brief-10142026.pdf`,
    econw: `${BASE}/Documents/board-meetings/2026/20260618/20260605-ECOnorthwest-FR-Full-Report.pdf`,
    appendix: `${BASE}/Documents/board-meetings/2026/20261015/expenditure-revenue-appendix-10142026.pdf`,
    board: `${BASE}/Pages/index.aspx`,
    meetings: `${BASE}/board-meetings/Pages/2026-meetings.aspx`,
  };

  readonly models = MODELS;
  readonly employers = EMPLOYERS;
  readonly scenarios = SCENARIOS;
  readonly sizes = [1, 2, 3, 4, 5];
  readonly series = SERIES;
  readonly incomeMax = 400_000;

  /** "One rate: 13.5%" or "Rates: 3%, 9%, 12%, 14.3%". */
  rateLadder(m: RevenueModel): string {
    const rates = m.rates.map((r) => this.pct(r, 2));
    return rates.length === 1 ? `One rate: ${rates[0]}` : `Rates: ${rates.join(', ')}`;
  }

  // ---------------------------------------------------------------- coverage
  /** From the report's "Scope of Covered Benefits" list (page 9). */
  readonly covered = [
    { title: 'Hospital and emergency', detail: 'Inpatient care, surgery and ambulance rides' },
    { title: 'Doctor visits', detail: 'Primary, specialty and preventive care, with screenings' },
    { title: 'Prescription drugs', detail: 'Including specialty medications' },
    { title: 'Mental health', detail: 'Substance use treatment and crisis services too' },
    { title: 'Dental and vision', detail: 'Part of the core plan, not an add-on' },
    { title: 'Maternity and family', detail: 'Newborn, fertility and reproductive care' },
    { title: 'Tests and equipment', detail: 'Labs, imaging, rehabilitation, medical equipment' },
    { title: 'End-of-life care', detail: 'Hospice and palliative care' },
  ];

  // ------------------------------------------------------- the five models
  /** The measures drawn as bars beside each model, each on its own scale. */
  readonly fifths = ['Lowest fifth', 'Second fifth', 'Middle fifth', 'Fourth fifth', 'Top fifth'];
  readonly modelMetrics: readonly {
    key: string;
    label: string;
    width: (m: RevenueModel) => number;
    value: (m: RevenueModel) => string;
  }[] = [
    {
      key: 'nothing',
      label: 'Tax filers who pay nothing',
      width: (m) => m.returnsOwingNothing * 100,
      value: (m) => `${Math.round(m.returnsOwingNothing * 100)} of 100`,
    },
    {
      key: 'top',
      label: 'Top rate on household income',
      width: (m) => (m.topRate / 0.15) * 100,
      value: (m) => this.pct(m.topRate, 2),
    },
    {
      key: 'middle',
      label: 'Household contribution, middle fifth',
      width: (m) => (m.middleFifthRate / 0.03) * 100,
      value: (m) => `${this.pct(m.middleFifthRate)} of income`,
    },
    {
      key: 'combined',
      label: 'With the payroll tax, middle fifth',
      width: (m) => (m.combinedByFifth[2] / 0.12) * 100,
      value: (m) => `${this.pct(m.combinedByFifth[2])} of income`,
    },
    {
      key: 'top1',
      label: 'Share paid by the top 1%',
      width: (m) => (m.top1Share / 0.45) * 100,
      value: (m) => this.pct(m.top1Share, 0),
    },
  ];

  // --------------------------------------------------------- statewide math
  readonly best = BEST;
  readonly low = LOW;
  readonly target = REVENUE_TARGET;
  readonly privateToday = PRIVATE_TODAY;
  readonly rateReset = RATE_RESET;
  readonly bridge = BRIDGE;
  readonly statewide = SCENARIOS_STATEWIDE;
  readonly highPlan = HIGH_PLAN;
  readonly perPerson = perPerson;
  readonly abs = Math.abs;
  readonly round = Math.round;
  /** Today against the plan, for each estimate; bars share one scale. */
  readonly raisedGroups = [
    { title: "Milliman's best estimate", rows: RAISED_IN_OREGON.best },
    { title: "The board's assumptions", rows: RAISED_IN_OREGON.board },
  ].map((g) => ({
    title: g.title,
    rows: g.rows.map((r) => ({
      ...r,
      total: Math.round((r.main + r.partB) * 10) / 10,
      mainPct: (r.main / 40) * 100,
      partBPct: (r.partB / 40) * 100,
    })),
  }));

  /** "$78.3B" */
  bn(billions: number): string {
    return `$${billions.toFixed(1)}B`;
  }
  /** "+$7.2B" or "−$1.3B", with a real minus sign. */
  signed(billions: number): string {
    return `${billions < 0 ? '−' : '+'}$${Math.abs(billions).toFixed(1)}B`;
  }
  /** "$7.2B more" or "$0.6B less". */
  moreLess(billions: number): string {
    return `$${Math.abs(billions).toFixed(1)}B ${billions < 0 ? 'less' : 'more'}`;
  }
  /** Bar length as a percent of its track. */
  barPct(billions: number): number {
    return (Math.abs(billions) / BAR_MAX) * 100;
  }
  /** Dollars rounded to the nearest hundred. */
  usd100(dollars: number): string {
    return USD.format(Math.round(dollars / 100) * 100);
  }

  // ------------------------------------------------------------ calculator
  readonly size = signal(2);
  readonly income = signal(85_000);
  readonly employer = signal<EmployerKind>('private');
  /** The private employer's total yearly payroll; sets the worker credit. */
  readonly payroll = signal(8_500_000);
  readonly currentCost = signal(4_700);
  readonly coverage = signal<CoverageKind>('employer');
  readonly scenarioId = signal(SCENARIOS[1].id);

  readonly coverages = COVERAGES;
  readonly coverageInfo = computed(() => COVERAGES.find((c) => c.kind === this.coverage())!);

  readonly exemption = computed(() => FPL_200[this.size()]);
  readonly exemptionLow = computed(() => FPL_138[this.size()]);
  readonly scenario = computed(() => SCENARIOS.find((s) => s.id === this.scenarioId())!);

  /** What the chosen pay source means for the payroll tax and the worker credit. */
  readonly employerHint = computed(() => {
    switch (this.employer()) {
      case 'none':
        return 'No employer pays payroll tax on this income, so there is no worker credit. In the models with the credit, the appendix says self-employed people would pay more than most employees with the same income.';
      case 'public':
        return 'Public employers would pay the top payroll rate from the first dollar: 9.6% of wages under Model 1 and 14% under the others.';
      default: {
        const one = employerRate('private', 1, this.payroll());
        const rest = employerRate('private', 2, this.payroll());
        if (this.payroll() <= PAYROLL_EXEMPT) {
          return 'A payroll of $500,000 or less owes no payroll tax, so there is no worker credit.';
        }
        return one === rest
          ? `On that payroll the tax works out to ${this.pct(one)} of wages in every model.`
          : `On that payroll the tax works out to ${this.pct(one)} of wages under Model 1 and ${this.pct(rest)} under the others.`;
      }
    }
  });

  readonly bills = computed(() =>
    MODELS.map((m) => bill(m, this.income(), this.size(), this.employer(), this.payroll())),
  );

  /** Lowest and highest bill across the five models. */
  readonly range = computed(() => {
    const amounts = this.bills().map((b) => b.household);
    return { low: Math.min(...amounts), high: Math.max(...amounts) };
  });

  // ------------------------------------------------------- employer calculator
  readonly bizKind = signal<'private' | 'public'>('private');
  readonly bizPayroll = signal(1_100_000);
  readonly bizSpend = signal(110_000);

  /** Model 1 has one payroll rate; Models 2 to 5 share a second, higher tier. */
  readonly bizRows = computed(() =>
    ([
      { label: 'Model 1', id: 1 },
      { label: 'Models 2 to 5', id: 2 },
    ] as const).map(({ label, id }) => {
      const payroll = this.bizPayroll();
      const tax =
        this.bizKind() === 'public' ? employerRate('public', id) * payroll : payrollTax(payroll, id);
      return { label, tax, rate: payroll > 0 ? tax / payroll : 0, diff: tax - this.bizSpend() };
    }),
  );

  /** The payroll tax at a few payroll sizes, for firms that do not want to type. */
  readonly bizExamples = [420_000, 1_100_000, 8_500_000, 20_000_000, 190_000_000].map((payroll) => ({
    payroll,
    one: payrollTax(payroll, 1),
    rest: payrollTax(payroll, 2),
  }));

  // ----------------------------------------------------------------- chart
  private readonly plotEl = viewChild<ElementRef<HTMLElement>>('plot');
  readonly width = signal(720);
  readonly height = 340;
  readonly hoverIncome = signal<number | null>(null);

  readonly narrow = computed(() => this.width() < 520);
  readonly pad = computed(() => ({
    left: 46,
    right: this.narrow() ? 14 : 128,
    top: 18,
    bottom: 34,
  }));

  /** Always wide enough to hold the visitor's own income, however large. */
  readonly xMax = computed(() =>
    Math.max(250_000, Math.ceil((this.income() * 1.2) / 50_000) * 50_000),
  );

  private billAt(modelIndex: number, income: number): number {
    return bill(MODELS[modelIndex], income, this.size(), this.employer(), this.payroll())
      .household;
  }

  private readonly yStep = computed(() => {
    const top = Math.max(
      this.currentCost(),
      ...MODELS.map((_, i) => this.billAt(i, this.xMax())),
    );
    const steps = [5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000];
    const step = steps.find((s) => top * 1.05 <= s * 5);
    return { top, step: step ?? 1_000_000 };
  });

  readonly yMax = computed(() => {
    const { top, step } = this.yStep();
    return Math.max(step, Math.ceil((top * 1.05) / step) * step);
  });

  private x(income: number): number {
    const p = this.pad();
    return p.left + (income / this.xMax()) * (this.width() - p.left - p.right);
  }
  private y(dollars: number): number {
    const p = this.pad();
    return this.height - p.bottom - (dollars / this.yMax()) * (this.height - p.top - p.bottom);
  }

  readonly xTicks = computed(() => {
    const most = this.narrow() ? 4 : 6;
    const steps = [50_000, 100_000, 250_000, 500_000, 1_000_000, 2_000_000];
    const step = steps.find((s) => this.xMax() / s <= most) ?? 2_000_000;
    const ticks: { x: number; label: string }[] = [];
    for (let v = 0; v <= this.xMax(); v += step) {
      const label = v === 0 ? '$0' : v >= 1_000_000 ? `$${v / 1_000_000}M` : `$${v / 1000}K`;
      ticks.push({ x: this.x(v), label });
    }
    return ticks;
  });

  readonly yTicks = computed(() => {
    const { step } = this.yStep();
    const ticks: { y: number; label: string }[] = [];
    for (let v = 0; v <= this.yMax(); v += step) {
      ticks.push({ y: this.y(v), label: v === 0 ? '$0' : `$${v / 1000}K` });
    }
    return ticks;
  });

  /** Each model's bill across the income axis, sampled finely enough to show every step. */
  readonly lines = computed(() =>
    MODELS.map((m, i) => {
      const steps = 240;
      const pts: string[] = [];
      for (let n = 0; n <= steps; n++) {
        const income = (this.xMax() * n) / steps;
        pts.push(`${n ? 'L' : 'M'}${this.x(income).toFixed(1)},${this.y(this.billAt(i, income)).toFixed(1)}`);
      }
      return {
        id: m.id,
        color: SERIES[i],
        d: pts.join(' '),
        endY: this.y(this.billAt(i, this.xMax())),
      };
    }),
  );

  /** End labels; lines that finish within a text-height of each other share one. */
  readonly endLabels = computed<EndLabel[]>(() => {
    const ends = this.lines()
      .map((l) => ({ id: l.id, y: l.endY }))
      .sort((a, b) => a.y - b.y);
    const groups: { ids: number[]; y: number }[] = [];
    for (const end of ends) {
      const last = groups.at(-1);
      if (last && end.y - last.y < 15) last.ids.push(end.id);
      else groups.push({ ids: [end.id], y: end.y });
    }
    return groups.map((g) => {
      const ids = [...g.ids].sort((x, y) => x - y);
      return {
        y: g.y,
        text:
          ids.length === 1
            ? `Model ${ids[0]}`
            : `Models ${ids.slice(0, -1).join(', ')} & ${ids.at(-1)}`,
      };
    });
  });

  readonly plotRight = computed(() => this.width() - this.pad().right);
  readonly plotBottom = computed(() => this.height - this.pad().bottom);
  readonly nowY = computed(() => this.y(this.currentCost()));
  readonly youX = computed(() => this.x(this.income()));
  readonly youDots = computed(() =>
    this.bills().map((b, i) => ({ y: this.y(b.household), color: SERIES[i] })),
  );

  readonly hover = computed(() => {
    const income = this.hoverIncome();
    if (income === null) return null;
    const x = this.x(income);
    // Tooltip sits right of the crosshair when it fits, else left, never off the plot.
    const tip = 184;
    const left = x + 12 + tip <= this.width() ? x + 12 : Math.max(0, x - 12 - tip);
    return {
      income,
      x,
      left,
      rows: MODELS.map((m, i) => {
        const value = this.billAt(i, income);
        return { id: m.id, color: SERIES[i], value, y: this.y(value) };
      }),
    };
  });

  /** The same data as the chart, at round incomes, for the table view. */
  readonly tableRows = computed(() =>
    [50_000, 100_000, 150_000, 200_000, 250_000].map((income) => ({
      income,
      values: MODELS.map((_, i) => this.billAt(i, income)),
    })),
  );

  constructor() {
    const host = inject(ElementRef<HTMLElement>);
    const destroyRef = inject(DestroyRef);
    // Browser only: size the chart to its container so text stays legible on phones.
    afterNextRender(() => {
      const el = this.plotEl()?.nativeElement ?? host.nativeElement;
      const measure = () => this.width.set(Math.max(200, Math.round(el.clientWidth)));
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  // ---------------------------------------------------------------- events
  /**
   * Reads a typed dollar amount. Anything that is not a plain non-negative number
   * is rejected (null) so the previous value is kept.
   */
  private parseDollars(raw: string, max: number): number | null {
    const text = raw.replace(/[$,\s]/g, '');
    if (!/^\d+(\.\d*)?$/.test(text)) return null;
    return Math.min(Math.round(Number(text)), max);
  }

  setIncome(raw: string, box?: HTMLInputElement): void {
    const value = this.parseDollars(raw, 5_000_000);
    if (value !== null) this.income.set(value);
    // Write the canonical value back: [value] only repaints when the signal changes.
    if (box) box.value = this.income().toLocaleString('en-US');
  }

  setCurrentCost(raw: string, box?: HTMLInputElement): void {
    const value = this.parseDollars(raw, 500_000);
    if (value !== null) this.currentCost.set(value);
    if (box) box.value = this.currentCost().toLocaleString('en-US');
  }

  setEmployer(kind: string): void {
    this.employer.set(kind as EmployerKind);
  }

  setPayroll(raw: string, box?: HTMLInputElement): void {
    const value = this.parseDollars(raw, 100_000_000_000);
    if (value !== null) this.payroll.set(value);
    if (box) box.value = this.payroll().toLocaleString('en-US');
  }

  /**
   * Choosing how you are covered today fills in the board's example figure for
   * "what you pay now" and, where it is unambiguous, who pays your wages.
   */
  setCoverage(kind: string): void {
    const info = COVERAGES.find((c) => c.kind === kind);
    if (!info) return;
    this.coverage.set(info.kind);
    this.currentCost.set(info.typicalCost);
    if (info.employer) this.employer.set(info.employer);
  }

  setBizKind(kind: string): void {
    this.bizKind.set(kind === 'public' ? 'public' : 'private');
  }

  setBizPayroll(raw: string, box?: HTMLInputElement): void {
    const value = this.parseDollars(raw, 100_000_000_000);
    if (value !== null) this.bizPayroll.set(value);
    if (box) box.value = this.bizPayroll().toLocaleString('en-US');
  }

  setBizSpend(raw: string, box?: HTMLInputElement): void {
    const value = this.parseDollars(raw, 100_000_000_000);
    if (value !== null) this.bizSpend.set(value);
    if (box) box.value = this.bizSpend().toLocaleString('en-US');
  }

  onPointer(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const p = this.pad();
    // Pointer position in viewBox units, in case the SVG is drawn scaled.
    const px = (event.clientX - rect.left) * (this.width() / rect.width);
    const ratio = (px - p.left) / (this.width() - p.left - p.right);
    if (ratio < 0 || ratio > 1) {
      this.hoverIncome.set(null);
      return;
    }
    this.hoverIncome.set(Math.round((ratio * this.xMax()) / 1_000) * 1_000);
  }

  /** A finger lifting should not dismiss the tooltip it just opened. */
  onPointerLeave(event: PointerEvent): void {
    if (event.pointerType !== 'touch') this.hoverIncome.set(null);
  }

  // ------------------------------------------------------------ formatting
  usd(value: number): string {
    return USD.format(Math.round(value));
  }

  pct(value: number, digits = 1): string {
    return `${Number((value * 100).toFixed(digits))}%`;
  }

  /**
   * The line under each bill. An uninsured household is not told it "pays more":
   * it pays nothing for coverage today because it has none.
   */
  verdict(b: Bill): { text: string; tone: 'less' | 'more' | 'same' | 'info' } {
    const now = this.currentCost();
    if (this.coverage() === 'none') {
      return b.household < 1
        ? { text: 'You would owe nothing and be covered', tone: 'less' }
        : { text: 'You would pay this and be covered', tone: 'info' };
    }
    if (b.household < 1 && now < 1) return { text: 'You would owe nothing', tone: 'same' };
    const diff = Math.round(b.household - now);
    if (Math.abs(diff) < 1) return { text: 'About what you pay now', tone: 'same' };
    return diff < 0
      ? { text: `${this.usd(-diff)} less than you pay now`, tone: 'less' }
      : { text: `${this.usd(diff)} more than you pay now`, tone: 'more' };
  }

  /** Why a bill is $0, so it is not mistaken for a promise. */
  zeroReason(b: Bill): string | null {
    if (b.household >= 1) return null;
    return b.gross < 1
      ? 'Your income is within this model\'s exemption.'
      : 'The worker credit covers the whole bill.';
  }

  /** "$7,400 less" or "$52,400 more" than the employer spends today. */
  bizVerdict(diff: number): string {
    const amount = this.usd(Math.abs(diff));
    if (Math.abs(diff) < 1) return 'about the same as you spend now';
    return diff < 0 ? `${amount} less than you spend now` : `${amount} more than you spend now`;
  }

}
