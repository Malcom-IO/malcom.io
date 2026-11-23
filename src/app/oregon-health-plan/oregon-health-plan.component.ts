import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from '../quillquest/quillquest-shell.component';
import { MODELS, RevenueModel, SCENARIOS, payrollTax } from './uhp-model';

import { HOUSEHOLD_ROWS } from './uhp-households';
import { UhpCalculatorComponent } from './uhp-calculator.component';
import { version as uhpCalculatorVersion } from 'oregon-uhp-calculator/package.json';
import {
  BEST,
  BOARD,
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

/** Longest bar in the statewide charts, in billions; bars scale against it. */
const BAR_MAX = 8;

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const BASE = 'https://www.oregon.gov/uhpgb';

/** Chart series colors: categorical slots 1 to 5, set per theme in _tokens.scss. */
const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'] as const;

/**
 * A plain-language explainer of Oregon's proposed Universal Health Plan. Its
 * calculators are the open-source widget (see uhp-calculator.component.ts); the
 * rest of the page runs on the Governance Board's published models in uhp-model.ts.
 *
 * This is a civic explainer, not studio marketing: it is deliberately neutral,
 * every number traces to a board document (see uhp-model.ts), and it says
 * plainly what the board has not decided. Not linked from the main nav.
 */
@Component({
  selector: 'app-oregon-health-plan',
  imports: [NgTemplateOutlet, RouterLink, QuillquestShellComponent, UhpCalculatorComponent],
  templateUrl: './oregon-health-plan.component.html',
  styleUrl: './oregon-health-plan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OregonHealthPlanComponent {
  readonly updated = 'November 13, 2026';
  /** Copyright year: the year of the last update, not of the visit. */
  readonly year = this.updated.slice(-4);
  readonly sources = {
    report: `${BASE}/Documents/board-meetings/2026/20261015/20261015-legislative-report-draft.pdf`,
    brief: `${BASE}/Documents/board-meetings/2026/20261015/legislative-brief-10142026.pdf`,
    econw: `${BASE}/Documents/board-meetings/2026/20260618/20260605-ECOnorthwest-FR-Full-Report.pdf`,
    appendix: `${BASE}/Documents/board-meetings/2026/20261015/expenditure-revenue-appendix-10142026.pdf`,
    board: `${BASE}/Pages/index.aspx`,
    meetings: `${BASE}/board-meetings/Pages/2026-meetings.aspx`,
  };
  /** Built after each site build by scripts/make-uhp-pdf.mjs. */
  readonly pdf = '/oregon-universal-health-plan.pdf';

  readonly models = MODELS;
  readonly scenarios = SCENARIOS;
  readonly series = SERIES;

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
      label: 'Top rate, on the highest slice of income',
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
  /** The two published estimates, side by side. */
  readonly estimates = [
    {
      name: "Milliman's best estimate",
      who: "The board's actuary",
      tone: 'blue',
      current: BEST.statusQuo,
      plan: BEST.plan,
      taxes: REVENUE_TARGET.best,
      privateNow: PRIVATE_TODAY.best,
    },
    {
      name: "The board's assumptions",
      who: 'Slower cost growth and more savings',
      tone: 'green',
      current: LOW.statusQuo,
      plan: BOARD.plan,
      taxes: REVENUE_TARGET.board,
      privateNow: PRIVATE_TODAY.board,
    },
  ];
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

  // ------------------------------------------------------- example tables
  /** The installed open-source calculator's version, for the source note. */
  readonly uhpVersion = uhpCalculatorVersion;
  readonly scenarioId = signal(SCENARIOS[1].id);
  readonly scenario = computed(() => SCENARIOS.find((s) => s.id === this.scenarioId())!);

  /** Fixed example households for the side-by-side table. */
  readonly households = HOUSEHOLD_ROWS;

  /** The payroll tax at a few payroll sizes, for firms that do not want to type. */
  readonly bizExamples = [420_000, 1_100_000, 8_500_000, 20_000_000, 190_000_000].map((payroll) => ({
    payroll,
    one: payrollTax(payroll, 1),
    rest: payrollTax(payroll, 2),
  }));

  constructor() {
    const host = inject(ElementRef<HTMLElement>);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // Paper has no "show more": open every collapsed section for printing,
      // then put back the ones the reader had left closed.
      const root: HTMLElement = host.nativeElement;
      let opened: HTMLDetailsElement[] = [];
      const beforePrint = () => {
        opened = [...root.querySelectorAll<HTMLDetailsElement>('details:not([open])')];
        for (const d of opened) d.open = true;
      };
      const afterPrint = () => {
        for (const d of opened) d.open = false;
        opened = [];
      };
      window.addEventListener('beforeprint', beforePrint);
      window.addEventListener('afterprint', afterPrint);
      destroyRef.onDestroy(() => {
        window.removeEventListener('beforeprint', beforePrint);
        window.removeEventListener('afterprint', afterPrint);
      });
    });
  }

  // ------------------------------------------------------------ formatting
  usd(value: number): string {
    return USD.format(Math.round(value));
  }

  /** Always one decimal, so 9.0% sits beside 9.4% without looking like a different kind of number. */
  pct1(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  pct(value: number, digits = 1): string {
    return `${Number((value * 100).toFixed(digits))}%`;
  }
}
