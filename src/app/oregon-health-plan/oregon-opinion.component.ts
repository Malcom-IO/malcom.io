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
  COST_PER_PERSON,
  FLOOR_RATE,
  OWING_NOTHING,
  TOP1_STAKE,
  capped,
  ceiling,
  ceilingIncome,
  floor,
  floorAndSoftCap,
  povertyLine,
  softCapped,
} from './uhp-ceiling';
import { BOARD_PRIVATE_RATE, HOUSEHOLD_ROWS } from './uhp-households';
import { MODELS, contribution, employerRate } from './uhp-model';

/** The draft as written, or one of the ideas applied on top of it. */
type View = 'draft' | 'pick' | 'soft' | 'ceiling';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Top of the chart's income axis. */
const X_MAX = 2_000_000;

/**
 * Marcus's own view of how the plan is paid for. Deliberately a separate page:
 * the explainer at /oregon-universal-health-plan takes no position, and this
 * one does. It is labeled as opinion at the top and says so again at the end.
 *
 * Built like the explainer, to be read as tables and pictures: the same twelve
 * households, a chart, bars. Its arithmetic lives in uhp-ceiling.ts and is not
 * the board's. It shares the explainer's stylesheet for those pieces.
 */
@Component({
  selector: 'app-oregon-opinion',
  imports: [RouterLink, QuillquestShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './oregon-opinion.component.html',
  styleUrls: ['./oregon-health-plan.component.scss', './oregon-opinion.component.scss'],
})
export class OregonOpinionComponent {
  readonly updated = 'November 13, 2026';
  readonly models = MODELS;
  readonly costPerPerson = COST_PER_PERSON;
  readonly familyCeiling = ceiling(4);
  readonly stake = TOP1_STAKE;
  readonly owingNothing = OWING_NOTHING;
  readonly floorRate = FLOOR_RATE;
  readonly povertyFour = povertyLine(4);
  /** The median family of four in the explainer's table: today, and under the draft. */
  readonly median = HOUSEHOLD_ROWS.find(
    (h) => h.size === 4 && h.income === 110_000 && h.employer === 'private',
  )!;
  readonly medianDraft = { low: Math.min(...this.median.models), high: Math.max(...this.median.models) };

  readonly views: readonly { id: View; label: string; heading: string }[] = [
    { id: 'draft', label: 'The draft', heading: '' },
    { id: 'pick', label: 'A floor and a soft cap', heading: ', with a floor and a soft cap' },
    { id: 'soft', label: 'A soft cap alone', heading: ', with a soft cap' },
    { id: 'ceiling', label: 'A hard ceiling', heading: ', with a hard ceiling' },
  ];
  readonly view = signal<View>('pick');
  readonly viewHeading = computed(() => this.views.find((v) => v.id === this.view())!.heading);
  /** Which model the chart and bars show; the table shows all five. */
  readonly modelIndex = signal(0);

  private apply(view: View, draft: number, income: number, size: number): number {
    switch (view) {
      case 'pick':
        return floorAndSoftCap(draft, income, size);
      case 'soft':
        return softCapped(draft, size);
      case 'ceiling':
        return capped(draft, size);
      default:
        return draft;
    }
  }

  // ------------------------------------------------------------------ table
  /** The explainer's twelve households, with the chosen idea applied to each cell. */
  readonly rows = computed(() =>
    HOUSEHOLD_ROWS.map((h) => {
      const cells = h.models.map((draft) => {
        const value = this.apply(this.view(), draft, h.income, h.size);
        return {
          value,
          draft,
          changed: Math.abs(value - draft) > 0.5,
          up: value > draft + 0.5,
          // A saving under the draft that this idea turns into a cost.
          flipped: draft < h.now && value > h.now,
        };
      });
      // What the employer would pay in payroll tax on this household's wages: the
      // other half of the bill, which the household's own figure leaves out.
      const rates =
        h.employer === 'private'
          ? [BOARD_PRIVATE_RATE]
          : h.employer === 'public'
            ? MODELS.map((m) => employerRate('public', m.id))
            : [0];
      const payroll = { low: Math.min(...rates) * h.wages, high: Math.max(...rates) * h.wages };
      return { ...h, cells, payroll, changed: cells.some((c) => c.changed) };
    }),
  );
  /** How many of the twelve pay more, less, or the same as the draft asks, in any model. */
  readonly tally = computed(() => {
    const rows = this.rows();
    return {
      more: rows.filter((r) => r.cells.some((c) => c.up)).length,
      less: rows.filter((r) => r.cells.some((c) => c.changed && !c.up)).length,
      same: rows.filter((r) => !r.changed).length,
      flipped: rows.filter((r) => r.cells.some((c) => c.flipped)).length,
    };
  });

  // ------------------------------------------------------------------- bars
  /** A family of four with no worker credit, at the top, under the chosen model. */
  readonly topBars = computed(() => {
    const model = MODELS[this.modelIndex()];
    const scale = contribution(model, X_MAX, 0, 4, 0);
    return [1_000_000, 2_000_000].map((income) => {
      const draft = contribution(model, income, 0, 4, 0);
      const items = [
        { label: 'The draft', value: draft, tone: 'draft' },
        { label: 'Floor and soft cap', value: floorAndSoftCap(draft, income, 4), tone: 'pick' },
        { label: 'A hard ceiling', value: capped(draft, 4), tone: 'ceiling' },
      ];
      return { title: `Family of four at ${USD.format(income)}`, items: items.map((i) => ({ ...i, pct: (i.value / scale) * 100 })) };
    });
  });

  /** Middle households from the table: what they pay today, under the draft, and with a floor. */
  readonly middleBars = computed(() => {
    const i = this.modelIndex();
    return HOUSEHOLD_ROWS.filter(
      (h) => h.income <= 110_000 && h.employer !== 'none',
    ).map((h) => {
      const draft = h.models[i];
      const items = [
        { label: 'Pays today', value: h.now, tone: 'today' },
        { label: 'The draft', value: draft, tone: 'draft' },
        { label: 'Floor and soft cap', value: floorAndSoftCap(draft, h.income, h.size), tone: 'pick' },
      ];
      const scale = Math.max(...items.map((x) => x.value), 1);
      return { title: `${h.who}, ${USD.format(h.income)}`, items: items.map((x) => ({ ...x, pct: (x.value / scale) * 100 })) };
    });
  });

  // ------------------------------------------------- where the ceiling starts
  readonly reach = [1, 2, 4].map((size) => {
    const r = ceilingIncome(size);
    return {
      size,
      label: size === 1 ? 'One person' : size === 2 ? 'A couple' : 'A family of four',
      ceiling: ceiling(size),
      ...r,
      left: (r.low / 1_000_000) * 100,
      width: ((r.high - r.low) / 1_000_000) * 100,
    };
  });
  readonly reachTicks = [0, 250_000, 500_000, 750_000, 1_000_000];

  // ------------------------------------------------------------------ chart
  private readonly plotEl = viewChild<ElementRef<HTMLElement>>('plot');
  readonly width = signal(720);
  readonly height = 320;
  readonly narrow = computed(() => this.width() < 520);
  readonly pad = computed(() => ({ left: 52, right: this.narrow() ? 12 : 128, top: 16, bottom: 34 }));

  private readonly yMax = computed(() => {
    const top = contribution(MODELS[this.modelIndex()], X_MAX, 0, 4, 0);
    return Math.ceil(top / 50_000) * 50_000;
  });
  private x(income: number): number {
    const p = this.pad();
    return p.left + (income / X_MAX) * (this.width() - p.left - p.right);
  }
  private y(dollars: number): number {
    const p = this.pad();
    return this.height - p.bottom - (dollars / this.yMax()) * (this.height - p.top - p.bottom);
  }
  readonly plotRight = computed(() => this.width() - this.pad().right);
  readonly plotBottom = computed(() => this.height - this.pad().bottom);

  readonly xTicks = computed(() =>
    (this.narrow() ? [0, 1_000_000, 2_000_000] : [0, 500_000, 1_000_000, 1_500_000, 2_000_000]).map(
      (v) => ({ x: this.x(v), label: v === 0 ? '$0' : v >= 1_000_000 ? `$${v / 1_000_000}M` : `$${v / 1000}K` }),
    ),
  );
  readonly yTicks = computed(() => {
    const step = this.yMax() <= 150_000 ? 50_000 : 100_000;
    const ticks: { y: number; label: string }[] = [];
    for (let v = 0; v <= this.yMax(); v += step) {
      ticks.push({ y: this.y(v), label: v === 0 ? '$0' : `$${v / 1000}K` });
    }
    return ticks;
  });

  /** Draft, soft cap and ceiling for a family of four with no worker credit. */
  readonly lines = computed(() => {
    const model = MODELS[this.modelIndex()];
    const series: { id: View; label: string; d: string; endY: number }[] = [];
    for (const view of ['draft', 'pick', 'ceiling'] as const) {
      const pts: string[] = [];
      let last = 0;
      for (let n = 0; n <= 200; n++) {
        const income = (X_MAX * n) / 200;
        last = this.apply(view, contribution(model, income, 0, 4, 0), income, 4);
        pts.push(`${n ? 'L' : 'M'}${this.x(income).toFixed(1)},${this.y(last).toFixed(1)}`);
      }
      series.push({
        id: view,
        label: view === 'draft' ? 'The draft' : view === 'pick' ? 'Floor + soft cap' : 'Hard ceiling',
        d: pts.join(' '),
        endY: this.y(last),
      });
    }
    return series;
  });
  readonly ceilingY = computed(() => this.y(this.familyCeiling));
  readonly chartTable = computed(() => {
    const model = MODELS[this.modelIndex()];
    return [250_000, 500_000, 1_000_000, 1_500_000, 2_000_000].map((income) => {
      const draft = contribution(model, income, 0, 4, 0);
      return { income, draft, pick: floorAndSoftCap(draft, income, 4), ceiling: capped(draft, 4) };
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

  usd(value: number): string {
    return USD.format(Math.round(value));
  }
  /** Rounded to the nearest hundred, for figures quoted in text. */
  usd100(value: number): string {
    return USD.format(Math.round(value / 100) * 100);
  }
  /** What the floor asks of a household. */
  floorFor(income: number, size: number): number {
    return floor(income, size);
  }
  pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
}
