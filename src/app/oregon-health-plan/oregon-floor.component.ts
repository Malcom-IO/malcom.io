import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from '../quillquest/quillquest-shell.component';
import {
  ADMIN_LOST,
  CHILD_SHARE,
  COPAYS_KEPT,
  ESTIMATE_GAP,
  Range,
  floorPieces,
  floorRates,
  outOfPocket2032,
  perOregonian,
  taxCut,
} from './uhp-floor';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface Bar {
  label: string;
  detail: string;
  range: Range;
  /** Width of the bar, as a share of the widest. */
  width: number;
  kind: 'off' | 'back' | 'net';
}

/**
 * An idea Marcus is floating, not a recommendation: a thinner public plan (the
 * floor) with a private top-up. A separate page on purpose. The explainer
 * takes no position, and the opinion page argues for two changes to the draft;
 * this one asks for something to be priced. Arithmetic in uhp-floor.ts.
 *
 * Built like the other two pages, to be read as cards, bars and tables, and it
 * shares their stylesheets.
 */
@Component({
  selector: 'app-oregon-floor',
  imports: [RouterLink, QuillquestShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './oregon-floor.component.html',
  styleUrls: [
    './oregon-health-plan.component.scss',
    './oregon-opinion.component.scss',
    './oregon-floor.component.scss',
  ],
})
export class OregonFloorComponent {
  readonly updated = 'November 13, 2026';
  readonly year = 2026;

  readonly actuary = floorPieces('actuary');
  readonly board = floorPieces('board');
  readonly cut = { actuary: taxCut('actuary'), board: taxCut('board') };
  readonly rates = [floorRates('board'), floorRates('actuary')];
  readonly each = perOregonian('actuary');
  readonly gap = ESTIMATE_GAP;
  /** The floor's rates at the actuary's estimate, for the comparison with Vermont. */
  readonly atActuary = floorRates('actuary');
  readonly oop = outOfPocket2032().toFixed(1);
  readonly kept = COPAYS_KEPT;
  readonly children = CHILD_SHARE;
  readonly adminLost = ADMIN_LOST;

  /** The pieces at the actuary's estimate, as bars on one scale. */
  readonly bars: Bar[] = (() => {
    const p = this.actuary;
    const widest = Math.max(p.topUp.high, p.copays.high, p.givenBack.high, p.net.high);
    const bar = (label: string, detail: string, range: Range, kind: Bar['kind']): Bar => ({
      label,
      detail,
      range,
      width: (range.high / widest) * 100,
      kind,
    });
    return [
      bar('Dental, vision and more move to the top-up', 'For adults who are not on Medicaid', p.topUp, 'off'),
      bar('Copays, paid by patients or their top-up', 'Above the exemption, up to a yearly limit', p.copays, 'off'),
      bar('Clinics bill patients and top-up insurers again', 'Part of two savings the draft counts is lost', p.givenBack, 'back'),
      bar('Net: comes off the new taxes', 'Low end: least moved, most lost. High end: the reverse', p.net, 'net'),
    ];
  })();

  // ------------------------------------------------------------- formatting
  /** "$4.5–6.4 billion": a range of billions in one unbroken piece. */
  billions(range: Range): string {
    return `$${range.low.toFixed(1)}–${range.high.toFixed(1)} billion`;
  }
  /** "$1.4–3.2B": the same range, short enough for a stat card. */
  billionsShort(range: Range): string {
    return `$${range.low.toFixed(1)}–${range.high.toFixed(1)}B`;
  }
  /** "12–16%". */
  pctSpan(range: Range): string {
    return `${Math.round(range.low * 100)}–${Math.round(range.high * 100)}%`;
  }
  /** "6.1–6.6%". */
  rateSpan(range: Range): string {
    return `${(range.low * 100).toFixed(1)}–${(range.high * 100).toFixed(1)}%`;
  }
  pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
  pct1(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
  /** "$1,000–1,400": dollars to the nearest hundred. */
  usdSpan(range: Range): string {
    const hundred = (v: number) => Math.round(v / 100) * 100;
    return `${USD.format(hundred(range.low))}–${hundred(range.high).toLocaleString('en-US')}`;
  }
}
