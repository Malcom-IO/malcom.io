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
import { EmployerKind, FPL_200 } from './uhp-model';
import {
  CHANGES,
  CREDIT,
  FIVE_MODELS,
  PLUS_ROWS,
  WAGE_GAP,
  bill,
  creditRate,
  creditRateRange,
  crossover,
  proposalRate,
  proposalRateRange,
  ratesAtBothTargets,
  slowerClimbDollars,
  threshold,
  thresholdIncome,
} from './uhp-model3-plus';

/** "11.4–13.4%": a range in one unbroken piece. */
function span(range: { low: number; high: number }): string {
  return `${(range.low * 100).toFixed(1)}–${(range.high * 100).toFixed(1)}%`;
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Which household the chart follows as income rises. */
type Who = 'self' | 'private';

interface Line {
  id: string;
  label: string;
  d: string;
  endY: number;
}

/**
 * Marcus's own view of how the plan is paid for. Deliberately a separate page:
 * the explainer at /oregon-universal-health-plan takes no position, and this
 * one does. It is labeled as opinion at the top and says so again at the end.
 *
 * Its position: of the board's five models pick Model 3, with three changes
 * (uhp-model3-plus.ts). Built like the explainer, to be read as tables and
 * pictures; it shares the explainer's stylesheet for those pieces.
 */
@Component({
  selector: 'app-oregon-opinion',
  imports: [RouterLink, QuillquestShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './oregon-opinion.component.html',
  styleUrls: ['./oregon-health-plan.component.scss', './oregon-opinion.component.scss'],
})
export class OregonOpinionComponent {
  private row(who: string, income: number) {
    return PLUS_ROWS.find((r) => r.who === who && r.income === income)!;
  }
  readonly updated = 'November 13, 2026';
  readonly year = 2026;
  /** Built after each site build by scripts/make-uhp-pdf.mjs. */
  readonly pdf = '/oregon-universal-health-plan-opinion.pdf';
  readonly changes = CHANGES;
  readonly credit = CREDIT;
  /** The household rate with change 1 alone: the middle of its range, and the range. */
  readonly rate = creditRate();
  readonly rateRange = creditRateRange();
  /** The household rate with both changes, the slower climb paid for by the rate. */
  readonly proposal = proposalRate();
  readonly proposalSpan = span(proposalRateRange());
  readonly climbDollars = slowerClimbDollars();
  readonly thresholds = { one: threshold(1), four: threshold(4) };
  readonly familyThreshold = threshold(4);
  readonly thresholdIncomes = { one: thresholdIncome(1), four: thresholdIncome(4) };
  readonly wageGap = WAGE_GAP;
  readonly targets = ratesAtBothTargets();
  readonly rows = PLUS_ROWS;
  /** Who pays for change 2: six households, from the middle to the top. */
  readonly payRows = [
    this.row('Single public employee', 80_000),
    this.row('Family of four, private employer', 110_000),
    this.row('Family of four, private employer', 220_000),
    this.row('Family of four, self-employed', 400_000),
    this.row('Family of four, self-employed', 1_000_000),
    this.row('Family of four, self-employed', 2_000_000),
  ];
  /** Where the proposal crosses Model 3, to the nearest $10,000. */
  readonly topCrossover =
    Math.round(crossover(4, 'none', 0, 450_000, 2_000_000) / 10_000) * 10_000;
  readonly employedCrossover =
    Math.round(crossover(4, 'private', 0.9, 70_000, 400_000) / 10_000) * 10_000;

  // ------------------------------------------------------------ why Model 3
  /** Two households under the five draft models, as bars on one scale each. */
  readonly why = (() => {
    const topMax = Math.max(...FIVE_MODELS.map((m) => m.top));
    const medianMax = Math.max(...FIVE_MODELS.map((m) => m.median));
    return FIVE_MODELS.map((m) => ({
      ...m,
      topPct: (m.top / topMax) * 100,
      medianPct: (m.median / medianMax) * 100,
    }));
  })();

  // ---------------------------------------------------------- before / after
  /** Four households that show who gains and who pays. */
  readonly moves = [
    { label: 'Single public employee, $80,000', row: this.row('Single public employee', 80_000) },
    { label: 'Median family of four, private employer', row: this.row('Family of four, private employer', 110_000) },
    { label: 'Self-employed family of four, $1,000,000', row: this.row('Family of four, self-employed', 1_000_000) },
    { label: 'Self-employed family of four, $2,000,000', row: this.row('Family of four, self-employed', 2_000_000) },
  ];

  // ------------------------------------------------------------------ chart
  readonly who = signal<Who>('self');
  private readonly plotEl = viewChild<ElementRef<HTMLElement>>('plot');
  readonly width = signal(720);
  readonly height = 320;
  readonly narrow = computed(() => this.width() < 520);
  readonly pad = computed(() => ({ left: 52, right: this.narrow() ? 12 : 138, top: 16, bottom: 34 }));

  /** The household followed, and how far along the income axis the chart runs. */
  private readonly subject = computed(() =>
    this.who() === 'self'
      ? { employer: 'none' as EmployerKind, wageShare: 0, xMax: 2_000_000, caption: 'Family of four, self-employed, per year' }
      : { employer: 'private' as EmployerKind, wageShare: 0.9, xMax: 400_000, caption: 'Family of four, private employer, per year' },
  );
  readonly caption = computed(() => this.subject().caption);

  private readonly series = computed(() => {
    const s = this.subject();
    const at = (income: number, credit: number, softCap: boolean) =>
      bill(income, income * s.wageShare, 4, s.employer, { credit, softCap });
    return [
      { id: 'm3', label: 'Draft, Model 3', value: (i: number) => at(i, 0, false) },
      { id: 'c1', label: 'Change 1 alone', value: (i: number) => at(i, CREDIT, false) },
      { id: 'c2', label: 'My proposal', value: (i: number) => at(i, CREDIT, true) },
    ];
  });
  readonly seriesLabels = computed(() => this.series().map((s) => s.label));

  private readonly yMax = computed(() => {
    const x = this.subject().xMax;
    const top = Math.max(...this.series().map((s) => s.value(x)));
    const step = top > 150_000 ? 50_000 : top > 30_000 ? 10_000 : 5_000;
    return Math.ceil(top / step) * step;
  });
  private x(income: number): number {
    const p = this.pad();
    return p.left + (income / this.subject().xMax) * (this.width() - p.left - p.right);
  }
  private y(dollars: number): number {
    const p = this.pad();
    return this.height - p.bottom - (dollars / this.yMax()) * (this.height - p.top - p.bottom);
  }
  readonly plotRight = computed(() => this.width() - this.pad().right);
  readonly plotBottom = computed(() => this.height - this.pad().bottom);

  private money(v: number): string {
    return v === 0 ? '$0' : v >= 1_000_000 ? `$${v / 1_000_000}M` : `$${v / 1000}K`;
  }
  readonly xTicks = computed(() => {
    const max = this.subject().xMax;
    const parts = this.narrow() ? 2 : 4;
    return Array.from({ length: parts + 1 }, (_, n) => (max * n) / parts).map((v) => ({
      x: this.x(v),
      label: this.money(v),
    }));
  });
  readonly yTicks = computed(() => {
    const max = this.yMax();
    const step = max / (max % 4 === 0 ? 4 : 5);
    const ticks: { y: number; label: string }[] = [];
    for (let v = 0; v <= max + 1; v += step) ticks.push({ y: this.y(v), label: this.money(v) });
    return ticks;
  });

  readonly lines = computed<Line[]>(() => {
    const max = this.subject().xMax;
    const drawn = this.series().map((s) => {
      const pts: string[] = [];
      for (let n = 0; n <= 200; n++) {
        const income = (max * n) / 200;
        pts.push(`${n ? 'L' : 'M'}${this.x(income).toFixed(1)},${this.y(s.value(income)).toFixed(1)}`);
      }
      return { id: s.id, label: s.label, d: pts.join(' '), endY: this.y(s.value(max)) };
    });
    // Keep end labels a text-height apart where two lines finish close together.
    const byY = [...drawn].sort((a, b) => a.endY - b.endY);
    for (let i = 1; i < byY.length; i++) {
      if (byY[i].endY - byY[i - 1].endY < 14) byY[i].endY = byY[i - 1].endY + 14;
    }
    return drawn;
  });
  /** The soft cap's threshold, drawn only where the chart reaches it. */
  readonly thresholdY = computed(() =>
    this.familyThreshold <= this.yMax() ? this.y(this.familyThreshold) : null,
  );
  readonly chartTable = computed(() => {
    const max = this.subject().xMax;
    return [0.25, 0.5, 0.75, 1].map((share) => {
      const income = max * share;
      return { income, values: this.series().map((s) => s.value(income)) };
    });
  });

  constructor() {
    const host = inject(ElementRef<HTMLElement>);
    const destroyRef = inject(DestroyRef);
    // Browser only: size the chart to its container so labels stay legible on phones.
    afterNextRender(() => {
      const el = this.plotEl()?.nativeElement ?? host.nativeElement;
      const measure = () => this.width.set(Math.max(240, Math.round(el.clientWidth)));
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  // ------------------------------------------------------------- smaller fixes
  /** Two single filers exempt more income than a married couple: the cost of marrying. */
  readonly marriagePenalty = (2 * FPL_200[1] - FPL_200[2]) * creditRate(0);
  /** What a second legal entity saves in payroll tax: the exemption, at 9.6%. */
  readonly splitSaving = 500_000 * 0.096;

  // ------------------------------------------------------------- formatting
  usd(value: number): string {
    return USD.format(Math.round(value));
  }
  /** Rounded to the nearest hundred, for figures quoted in text. */
  usd100(value: number): string {
    return USD.format(Math.round(value / 100) * 100);
  }
  /** Rounded to the nearest thousand, for the largest figures. */
  usd1000(value: number): string {
    return USD.format(Math.round(value / 1_000) * 1_000);
  }
  pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
  pct1(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
}
