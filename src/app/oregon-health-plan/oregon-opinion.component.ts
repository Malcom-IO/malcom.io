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
  TOP1_STAKE,
  averageContribution,
  capped,
  ceiling,
  ceilingIncome,
  softCapped,
} from './uhp-ceiling';
import { HOUSEHOLD_ROWS } from './uhp-households';
import { MODELS, contribution } from './uhp-model';

/** The draft as written, or one of the two ideas applied on top of it. */
type View = 'draft' | 'ceiling' | 'soft';

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
  readonly ceilingTimes = Math.round(ceiling(4) / averageContribution(4));

  readonly views: readonly { id: View; label: string }[] = [
    { id: 'draft', label: 'The draft' },
    { id: 'ceiling', label: 'With a ceiling' },
    { id: 'soft', label: 'With a soft cap' },
  ];
  readonly view = signal<View>('ceiling');
  /** Which model the chart and bars show; the table shows all five. */
  readonly modelIndex = signal(0);

  private apply(view: View, draft: number, size: number): number {
    return view === 'ceiling' ? capped(draft, size) : view === 'soft' ? softCapped(draft, size) : draft;
  }

  // ------------------------------------------------------------------ table
  /** The explainer's twelve households, with the chosen idea applied to each cell. */
  readonly rows = computed(() =>
    HOUSEHOLD_ROWS.map((h) => {
      const cells = h.models.map((draft) => {
        const value = this.apply(this.view(), draft, h.size);
        return { value, draft, changed: value < draft - 0.5 };
      });
      return { ...h, cells, changed: cells.some((c) => c.changed) };
    }),
  );
  readonly unchanged = computed(() => this.rows().filter((r) => !r.changed).length);

  // ------------------------------------------------------------------- bars
  /** A family of four with no worker credit, at three incomes, under the chosen model. */
  readonly bars = computed(() => {
    const model = MODELS[this.modelIndex()];
    const top = contribution(model, X_MAX, 0, 4, 0);
    return [400_000, 1_000_000, 2_000_000].map((income) => {
      const draft = contribution(model, income, 0, 4, 0);
      const items = [
        { label: 'The draft', value: draft, tone: 'draft' },
        { label: 'With a soft cap', value: softCapped(draft, 4), tone: 'soft' },
        { label: 'With a ceiling', value: capped(draft, 4), tone: 'ceiling' },
      ];
      return { income, items: items.map((i) => ({ ...i, pct: (i.value / top) * 100 })) };
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
  readonly pad = computed(() => ({ left: 52, right: this.narrow() ? 12 : 118, top: 16, bottom: 34 }));

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
    for (const view of ['draft', 'soft', 'ceiling'] as const) {
      const pts: string[] = [];
      let last = 0;
      for (let n = 0; n <= 200; n++) {
        const income = (X_MAX * n) / 200;
        last = this.apply(view, contribution(model, income, 0, 4, 0), 4);
        pts.push(`${n ? 'L' : 'M'}${this.x(income).toFixed(1)},${this.y(last).toFixed(1)}`);
      }
      series.push({
        id: view,
        label: view === 'draft' ? 'The draft' : view === 'soft' ? 'Soft cap' : 'Ceiling',
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
      return { income, draft, soft: softCapped(draft, 4), ceiling: capped(draft, 4) };
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
  pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
}
