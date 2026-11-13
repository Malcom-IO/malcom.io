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
import { COST_PER_PERSON, OWING_NOTHING, TOP1_STAKE, ceiling } from './uhp-ceiling';
import { HOUSEHOLD_ROWS } from './uhp-households';
import { MODELS, contribution, payrollTax } from './uhp-model';
import { REVENUE_TARGET } from './uhp-statewide';
import {
  BASE,
  BASE_SHARES,
  DEFAULT_HOUSEHOLD_SHARE,
  PROPOSED,
  householdBill,
  model6,
  model6Rows,
  model7,
  model7Rows,
  payrollLowWithReserve,
  softCapYardstick,
} from './uhp-model6';

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
 * It proposes a sixth model (uhp-model6.ts): the board's Model 3 with money
 * moved from the employer payroll tax to the household contribution, and an
 * optional soft cap at the top. Built like the explainer, to be read as tables
 * and pictures; it shares the explainer's stylesheet for those pieces.
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
  readonly costPerPerson = COST_PER_PERSON;
  readonly familyCeiling = ceiling(4);
  readonly stake = TOP1_STAKE;
  readonly owingNothing = OWING_NOTHING;
  readonly baseShares = BASE_SHARES;
  readonly baseRate = BASE.topRate;
  /** The two models this page proposes, each with a name and a description. */
  readonly proposed = PROPOSED;
  readonly model6Info = PROPOSED[0];
  readonly model7Info = PROPOSED[1];
  // ---------------------------------------------------------------- Model 7
  /** Model 7 at the board's own lower exemption, and with no exemption at all. */
  readonly m7 = model7(1.38);
  readonly m7Floor = model7(0);
  readonly m7Rows = model7Rows(1.38);
  /** How much less the $1,000,000 family pays under Model 7 than under Model 3. */
  readonly m7TopCut = (() => {
    const row = this.m7Rows.find((r) => r.income === 1_000_000)!;
    return { low: 1 - row.ownHigh / row.model3, high: 1 - row.ownLow / row.model3 };
  })();
  /** The same cut if there were no exemption at all: the most any version could do. */
  readonly m7MaxCut = 1 - this.m7Floor.rate / BASE.topRate;

  /**
   * What the board's own models show about a smaller exemption. Its two models
   * with no worker credit differ in where the tax starts: Model 3 at 200% of
   * poverty, Model 5 at 138%.
   */
  readonly exemptionEvidence = [
    { label: 'Model 3: starts at 200% of poverty ($66,000 for four)', value: MODELS[2].returnsOwingNothing },
    { label: 'Model 5: starts at 138% of poverty ($45,540 for four)', value: MODELS[4].returnsOwingNothing },
  ];

  /** The median family of four in the explainer's table. */
  private readonly medianRow = HOUSEHOLD_ROWS.find(
    (h) => h.size === 4 && h.income === 110_000 && h.employer === 'private',
  )!;
  readonly median = {
    now: this.medianRow.now,
    low: Math.min(...this.medianRow.models),
    high: Math.max(...this.medianRow.models),
  };

  // --------------------------------------------------------------- controls
  /**
   * Share of the new revenue that comes from households rather than payroll.
   * Fixed: a named model is one definite thing. (It was a slider at first, and
   * a control at the top of a page that changes things far below was confusing.)
   */
  readonly share = signal(DEFAULT_HOUSEHOLD_SHARE).asReadonly();
  /** Off by default: with it off, Model 6 raises what Model 3 raises. */
  readonly softCap = signal(false);

  readonly m6 = computed(() => model6(this.share()));
  readonly yardstick = computed(() => softCapYardstick(this.share()));
  readonly reservePayroll = computed(() => payrollLowWithReserve(this.share()));


  /** The revenue mix as three bar segments, for the draft and for Model 6. */
  readonly mix = computed(() => {
    const s = this.m6().shares;
    return [
      { label: 'Draft, Model 3', household: BASE_SHARES.household, payroll: BASE_SHARES.payroll, business: BASE_SHARES.business },
      { label: 'Model 6', household: s.household, payroll: s.payroll, business: s.business },
    ];
  });

  // ------------------------------------------------------------------ table
  readonly rows = computed(() => model6Rows(this.share(), this.softCap()));
  readonly tally = computed(() => {
    const rows = this.rows();
    return {
      less: rows.filter((r) => r.own < r.now - 0.5).length,
      more: rows.filter((r) => r.own > r.now + 0.5).length,
      total: rows.length,
    };
  });

  /** Dollars a year that move from the payroll tax to household payments, in billions. */
  readonly moved = computed(() => {
    const delta = this.share() - BASE_SHARES.household;
    return { low: REVENUE_TARGET.board * delta, high: REVENUE_TARGET.best * delta };
  });
  /**
   * The top 1%'s share of ALL the new revenue: under Model 3, and under Model 6
   * before any soft cap. Their share of the household contribution does not
   * change when the rate is scaled; the household contribution's size does.
   */
  readonly top1OfAll = computed(() => ({
    draft: BASE_SHARES.household * BASE.top1Share,
    model6: this.share() * BASE.top1Share,
  }));
  /** The $1,000,000 family: Model 3 against Model 6 as currently set. */
  readonly million = computed(() => this.rows().find((r) => r.income === 1_000_000)!);

  /** The example the page names when it says who comes out behind. */
  readonly publicSingle = computed(() => this.rows().find((r) => r.who === 'Single public employee')!);
  /** Two employers, a small one and a large one: payroll tax under Model 3 and under Model 6. */
  readonly employers = computed(() =>
    [1_100_000, 190_000_000].map((payroll) => {
      const draft = payrollTax(payroll, BASE.id);
      return { payroll, draft, model6: draft * this.m6().payrollScale };
    }),
  );
  bn(billions: number): string {
    return `$${billions.toFixed(1)} billion`;
  }
  /** Compact dollars for large figures: "$16.6 million", "$36,700". */
  big(value: number): string {
    return value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(1)} million` : this.usd100(value);
  }
  /** How much less payroll tax employers pay under Model 6, as a share. */
  readonly payrollCut = computed(() => 1 - this.m6().payrollScale);

  // ------------------------------------------------------------- middle bars
  /** Households with an employer: own bill plus payroll tax, draft against Model 6. */
  readonly middleBars = computed(() =>
    this.rows()
      .filter((r) => r.employer !== 'none' && r.income <= 220_000)
      .map((r) => {
        const scale = Math.max(r.total.draft, r.total.model6, r.now, 1);
        const bar = (label: string, own: number, payroll: number) => ({
          label,
          own,
          payroll,
          ownPct: (own / scale) * 100,
          payrollPct: (payroll / scale) * 100,
        });
        return {
          title: `${r.who}, ${USD.format(r.income)}`,
          now: r.now,
          nowPct: (r.now / scale) * 100,
          bars: [
            bar('Draft, Model 3', r.model3, r.payroll.draft),
            bar('Model 6', r.own, r.payroll.model6),
          ],
        };
      }),
  );

  // ------------------------------------------------------------------ chart
  private readonly plotEl = viewChild<ElementRef<HTMLElement>>('plot');
  readonly width = signal(720);
  readonly height = 320;
  readonly narrow = computed(() => this.width() < 520);
  readonly pad = computed(() => ({ left: 52, right: this.narrow() ? 12 : 132, top: 16, bottom: 34 }));

  /** A family of four with no employer, by income: two draft models and Model 6. */
  private readonly series = computed(() => [
    { id: 'm1', label: 'Draft, Model 1', value: (income: number) => contribution(MODELS[0], income, 0, 4, 0) },
    { id: 'm3', label: 'Draft, Model 3', value: (income: number) => contribution(BASE, income, 0, 4, 0) },
    {
      id: 'm6',
      label: this.softCap() ? 'Model 6, soft cap' : 'Model 6',
      value: (income: number) => householdBill(income, 4, this.share(), this.softCap()),
    },
  ]);
  private readonly yMax = computed(() => {
    const top = Math.max(...this.series().map((s) => s.value(X_MAX)));
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
  readonly lines = computed(() => {
    const drawn = this.series().map((s) => {
      const pts: string[] = [];
      for (let n = 0; n <= 200; n++) {
        const income = (X_MAX * n) / 200;
        pts.push(`${n ? 'L' : 'M'}${this.x(income).toFixed(1)},${this.y(s.value(income)).toFixed(1)}`);
      }
      return { id: s.id, label: s.label, d: pts.join(' '), endY: this.y(s.value(X_MAX)) };
    });
    // Keep end labels a text-height apart where two lines finish close together.
    const byY = [...drawn].sort((a, b) => a.endY - b.endY);
    for (let i = 1; i < byY.length; i++) {
      if (byY[i].endY - byY[i - 1].endY < 14) byY[i].endY = byY[i - 1].endY + 14;
    }
    return drawn;
  });
  readonly ceilingY = computed(() => this.y(this.familyCeiling));
  readonly chartTable = computed(() =>
    [250_000, 500_000, 1_000_000, 1_500_000, 2_000_000].map((income) => ({
      income,
      values: this.series().map((s) => s.value(income)),
    })),
  );
  readonly seriesLabels = computed(() => this.series().map((s) => s.label));

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

  // ------------------------------------------------------------- formatting
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
  readonly abs = Math.abs;
  pct1(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
  range(r: { low: number; high: number }): string {
    const low = this.usd100(r.low);
    const high = this.usd100(r.high);
    return low === high ? low : `${low} to ${high}`;
  }
}
