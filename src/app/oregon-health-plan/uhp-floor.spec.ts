import {
  ADMIN_LOST,
  CHILD_SHARE,
  COPAYS_KEPT,
  ESTIMATE_GAP,
  MEDICAID_DENTAL,
  MEDICAID_SHARE,
  OUT_OF_POCKET_2022,
  floorPieces,
  floorRates,
  outOfPocket2032,
  perOregonian,
  taxCut,
} from './uhp-floor';
import { MODEL3 } from './uhp-model3-plus';
import { BEST, LOW } from './uhp-statewide';

describe('floor and top-up arithmetic', () => {
  it('carries 2022 out-of-pocket spending to 2032', () => {
    expect(OUT_OF_POCKET_2022).toBeCloseTo((5342 - 1072 - 776) / 1000, 3);
    expect(outOfPocket2032()).toBeCloseTo(5.86, 1);
    expect(MEDICAID_SHARE).toBeCloseTo(0.26, 2);
  });

  it('builds each piece from the named inputs', () => {
    const p = floorPieces('actuary');
    const extras = BEST.planDentalVisionMore;
    expect(p.topUp.low).toBeCloseTo(extras * (1 - MEDICAID_SHARE) * (1 - CHILD_SHARE.high), 6);
    expect(p.topUp.high).toBeCloseTo((extras - MEDICAID_DENTAL) * (1 - CHILD_SHARE.low), 6);
    expect(p.copays.low).toBeCloseTo(outOfPocket2032() * COPAYS_KEPT.low, 6);
    expect(p.copays.high).toBeCloseTo(outOfPocket2032() * COPAYS_KEPT.high, 6);
    // Unpaid cost sharing comes back in step with the copays; part of the billing saving goes too.
    expect(p.givenBack.low).toBeCloseTo(
      BEST.collectability * COPAYS_KEPT.low + BEST.providerAdmin * ADMIN_LOST.low,
      6,
    );
    expect(p.givenBack.high).toBeCloseTo(
      BEST.collectability * COPAYS_KEPT.high + BEST.providerAdmin * ADMIN_LOST.high,
      6,
    );
    expect(floorPieces('board').givenBack.high).toBeCloseTo(
      LOW.collectability * COPAYS_KEPT.high + LOW.providerAdmin * ADMIN_LOST.high,
      6,
    );
    expect(floorPieces('board').target).toBe(30);
  });

  it('pairs the least moved with the most given back, and the reverse', () => {
    for (const target of ['actuary', 'board'] as const) {
      const p = floorPieces(target);
      expect(p.net.low).toBeCloseTo(p.topUp.low + p.copays.low - p.givenBack.high, 6);
      expect(p.net.high).toBeCloseTo(p.topUp.high + p.copays.high - p.givenBack.low, 6);
      expect(p.moved.low).toBeCloseTo(p.topUp.low + p.copays.low, 6);
      // More moves to private payment than comes off the taxes, at both ends.
      expect(p.moved.low).toBeGreaterThan(p.net.low);
      expect(p.moved.high).toBeGreaterThan(p.net.high);
      expect(p.net.low).toBeGreaterThan(0);
      expect(p.net.low).toBeLessThan(p.net.high);
    }
  });

  it('lands where the page says it does', () => {
    const actuary = floorPieces('actuary');
    expect(actuary.net.low).toBeCloseTo(1.6, 1);
    expect(actuary.net.high).toBeCloseTo(5.65, 1);
    expect(actuary.givenBack.low).toBeCloseTo(1.4, 1);
    expect(actuary.givenBack.high).toBeCloseTo(3.2, 1);
    expect(actuary.moved.low).toBeCloseTo(4.8, 1);
    expect(actuary.moved.high).toBeCloseTo(7.1, 1);
    expect(taxCut('actuary').low).toBeCloseTo(0.04, 2);
    expect(taxCut('actuary').high).toBeCloseTo(0.145, 2);
    // "It covers part of the difference between the two estimates, not all of it."
    expect(actuary.net.high).toBeLessThan(ESTIMATE_GAP);
    const board = floorPieces('board');
    expect(board.net.low).toBeCloseTo(1.3, 1);
    expect(board.net.high).toBeCloseTo(5.15, 1);
  });

  it('scales every rate by the same share, and the larger cut gives the lower rate', () => {
    const board = floorRates('board');
    const cut = taxCut('board');
    expect(board.household.draft).toBeCloseTo(MODEL3.topRate, 6);
    expect(board.household.floor.low).toBeCloseTo(MODEL3.topRate * (1 - cut.high), 6);
    expect(board.household.floor.high).toBeCloseTo(MODEL3.topRate * (1 - cut.low), 6);
    expect(board.household.floor.high).toBeLessThan(board.household.draft);
    const actuary = floorRates('actuary');
    expect(actuary.household.draft).toBeCloseTo(MODEL3.topRate * 1.3, 6);
    // "At the actuary's estimate even the floor's rates are close to Vermont's 11.5% + 9.5%."
    expect(actuary.payrollLow.floor.low).toBeGreaterThan(0.105);
    expect(actuary.payrollLow.floor.high).toBeLessThan(0.125);
    expect(actuary.household.floor.low).toBeGreaterThan(0.085);
    expect(actuary.household.floor.high).toBeLessThan(0.1);
  });

  it('gives per-person figures from the same pieces', () => {
    const each = perOregonian('actuary');
    expect(each.taxes.low).toBeGreaterThan(300);
    expect(each.taxes.high).toBeLessThan(1350);
    expect(each.privately.low).toBeGreaterThan(each.taxes.low);
    expect(each.privately.high).toBeGreaterThan(each.taxes.high);
  });
});
