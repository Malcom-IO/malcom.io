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
  COMPUTABLE_MODELS,
  EMPLOYERS,
  EmployerKind,
  FPL_200,
  MODELS,
  SCENARIOS,
  bill,
} from './uhp-model';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const BASE = 'https://www.oregon.gov/uhpgb';

/** Chart series colors: the validated dark-surface categorical slots 1 to 3. */
const SERIES = ['#3987e5', '#d95926', '#199e70'] as const;

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
    board: `${BASE}/Pages/index.aspx`,
    meetings: `${BASE}/board-meetings/Pages/2026-meetings.aspx`,
  };

  readonly models = MODELS;
  readonly employers = EMPLOYERS;
  readonly scenarios = SCENARIOS;
  readonly sizes = [1, 2, 3, 4, 5];
  readonly series = SERIES;
  readonly incomeMax = 400_000;

  // ------------------------------------------------------------ calculator
  readonly size = signal(2);
  readonly income = signal(85_000);
  readonly employer = signal<EmployerKind>('midsize');
  readonly currentCost = signal(4_700);
  readonly scenarioId = signal(SCENARIOS[1].id);

  readonly exemption = computed(() => FPL_200[this.size()]);
  readonly employerDetail = computed(
    () => EMPLOYERS.find((e) => e.kind === this.employer())!.detail,
  );
  readonly scenario = computed(() => SCENARIOS.find((s) => s.id === this.scenarioId())!);

  readonly bills = computed(() =>
    COMPUTABLE_MODELS.map((m) =>
      bill(m, this.income(), this.size(), this.employer(), this.currentCost()),
    ),
  );

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
    return bill(
      COMPUTABLE_MODELS[modelIndex],
      income,
      this.size(),
      this.employer(),
      this.currentCost(),
    ).household;
  }

  private readonly yStep = computed(() => {
    const top = Math.max(
      this.currentCost(),
      ...COMPUTABLE_MODELS.map((_, i) => this.billAt(i, this.xMax())),
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

  /** Each model is flat at $0, then a straight line: three points draw it exactly. */
  readonly lines = computed(() =>
    COMPUTABLE_MODELS.map((m, i) => {
      const b = bill(m, 0, this.size(), this.employer(), 0);
      const kink = Math.min(b.breakEven ?? this.xMax(), this.xMax());
      const pts = [
        [0, 0],
        [kink, 0],
        [this.xMax(), this.billAt(i, this.xMax())],
      ];
      return {
        id: m.id,
        color: SERIES[i],
        d: pts.map(([px, py], n) => `${n ? 'L' : 'M'}${this.x(px)},${this.y(py)}`).join(' '),
        endY: this.y(pts[2][1]),
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
      rows: COMPUTABLE_MODELS.map((m, i) => {
        const value = this.billAt(i, income);
        return { id: m.id, color: SERIES[i], value, y: this.y(value) };
      }),
    };
  });

  /** The same data as the chart, at round incomes, for the table view. */
  readonly tableRows = computed(() =>
    [50_000, 100_000, 150_000, 200_000, 250_000].map((income) => ({
      income,
      values: COMPUTABLE_MODELS.map((_, i) => this.billAt(i, income)),
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

  /** "$1,200 less than you pay now" and the like. */
  verdict(household: number): { text: string; tone: 'less' | 'more' | 'same' } {
    const diff = Math.round(household - this.currentCost());
    if (Math.abs(diff) < 1) return { text: 'About what you pay now', tone: 'same' };
    return diff < 0
      ? { text: `${this.usd(-diff)} less than you pay now`, tone: 'less' }
      : { text: `${this.usd(diff)} more than you pay now`, tone: 'more' };
  }
}
