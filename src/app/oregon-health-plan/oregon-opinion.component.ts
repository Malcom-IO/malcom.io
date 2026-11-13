import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from '../quillquest/quillquest-shell.component';
import {
  CEILING_ROWS,
  COST_PER_PERSON,
  TOP1_STAKE,
  averageContribution,
  ceiling,
  ceilingIncome,
} from './uhp-ceiling';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/**
 * Marcus's own view of how the plan is paid for. Deliberately a separate page:
 * the explainer at /oregon-universal-health-plan takes no position, and this
 * one does. It is labeled as opinion at the top and says so again at the end.
 * Its arithmetic lives in uhp-ceiling.ts and is not the board's.
 */
@Component({
  selector: 'app-oregon-opinion',
  imports: [RouterLink, QuillquestShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './oregon-opinion.component.html',
  styleUrl: './oregon-opinion.component.scss',
})
export class OregonOpinionComponent {
  readonly updated = 'November 13, 2026';
  readonly rows = CEILING_ROWS;
  readonly costPerPerson = COST_PER_PERSON;
  readonly familyCeiling = ceiling(4);
  readonly stake = TOP1_STAKE;
  /** Incomes at which the ceiling is first reached, for one person and for four. */
  readonly reachOne = ceilingIncome(1);
  readonly reachFour = ceilingIncome(4);
  /** The ceiling for four, and the draft's top example, as multiples of the average. */
  readonly ceilingTimes = Math.round(ceiling(4) / averageContribution(4));
  readonly topTimes = Math.round(
    Math.max(...CEILING_ROWS.map((r) => r.draft.high)) / averageContribution(4),
  );

  usd(value: number): string {
    return USD.format(Math.round(value / 100) * 100);
  }

  /** "$72,000 to $129,000", or one figure when both ends are the same. */
  span(r: { low: number; high: number }): string {
    const low = this.usd(r.low);
    const high = this.usd(r.high);
    return low === high ? low : `${low} to ${high}`;
  }

  pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
}
