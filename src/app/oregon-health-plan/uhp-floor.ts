import { MODEL3 } from './uhp-model3-plus';
import { BEST, LOW, POPULATION_2032, REVENUE_TARGET, perPerson } from './uhp-statewide';

/**
 * Arithmetic for the FLOOR AND TOP-UP page only. None of it is the board's,
 * and none of it appears on the explainer or on the opinion page.
 *
 * The idea: the plan covers medical, hospital, behavioral health and
 * prescriptions for everyone (the floor), with copays above the contribution
 * exemption up to a yearly limit tied to income. Adult dental, vision, hearing
 * and fertility care, and the copays, are left to a top-up that insurers sell
 * and employers may buy. People on Medicaid keep everything they have now.
 *
 * Every figure is for 2032, in billions of dollars, and is a rough range: the
 * documents do not price a plan with cost sharing. Inputs from the documents
 * are named; the two assumptions are named as assumptions.
 */

export interface Range {
  low: number;
  high: number;
}

// ------------------------------------------------------------------- inputs
/** Medicaid's dental funding in 2032 (report page 28; legislative brief page 7). */
export const MEDICAID_DENTAL = 0.8;

/** Medicaid's share of Oregonians in 2032: 1,150,000 of 4,423,000 (report page 18). */
export const MEDICAID_SHARE = 1_150_000 / POPULATION_2032;

/**
 * What Oregonians paid out of pocket in 2022: $5,342 million, less $1,072
 * million for non-durable products and $776 million for long-term care
 * (Appendix FR, Figure AFR1a). The appendix imputes it from national shares.
 * It includes people on Medicare, today's out-of-pocket dental and vision,
 * and some care the plan would not cover, so it overstates what a floor's
 * copays could apply to; COPAYS_KEPT is set low for that reason.
 *
 * ECOnorthwest's Exhibit 10 prints a higher figure in "2026 dollars" ($5,068
 * million). It is not used: it does not reconcile with this one at any growth
 * rate the documents use, and may include long-term care.
 */
export const OUT_OF_POCKET_2022 = 3.494;

/** The lower of the two yearly growth rates the brief uses (5.3% to 6.4%, page 7). */
export const GROWTH = 0.053;

/** Out-of-pocket spending carried to 2032 at that rate. */
export function outOfPocket2032(): number {
  return OUT_OF_POCKET_2022 * (1 + GROWTH) ** 10;
}

// -------------------------------------------------------------- assumptions
/**
 * ASSUMED: how much of today's out-of-pocket spending the floor's copays would
 * keep. Well under all of it: nobody on Medicaid or below the exemption pays a
 * copay, preventive care has none, there is a yearly limit tied to income, and
 * the dental and vision part of today's figure has left with the top-up. This
 * share stands in for the copay schedule the page does not have; it is the
 * number an actuary would replace.
 */
export const COPAYS_KEPT: Range = { low: 0.3, high: 0.55 };

/**
 * ASSUMED: the share of the non-Medicaid "dental, vision and more" spending
 * that is for children, and so stays in the floor.
 */
export const CHILD_SHARE: Range = { low: 0.1, high: 0.2 };

/**
 * ASSUMED: the share of the draft's other provider saving, reduced billing and
 * eligibility work (Table E7), that is lost when clinics bill patients again.
 * A clinic that bills any patient keeps its billing office, so some of it goes
 * however small the copays are.
 */
export const ADMIN_LOST: Range = { low: 0.1, high: 0.3 };

// ------------------------------------------------------------------ pieces
export type Target = 'actuary' | 'board';

export interface FloorPieces {
  /** New state revenue the draft needs at this estimate (Table E11). */
  target: number;
  /** Adult dental, vision, hearing, fertility and more leave the plan. */
  topUp: Range;
  /** Copays stay with patients. */
  copays: Range;
  /** Two provider savings the draft counts are partly lost when clinics bill patients again. */
  givenBack: Range;
  /** What comes off the new taxes. Low end: least moved, most given back. High end: the reverse. */
  net: Range;
  /** What households and employers pay privately instead: the first two. */
  moved: Range;
}

/**
 * The floor against the draft, at the actuary's estimate or the board's.
 *
 * TOP-UP. "Dental, vision and more" (Table E6) less Medicaid's part, less the
 * children's share. Medicaid's part is between its dental funding ($0.8
 * billion) and its share of the population times the whole category.
 *
 * GIVEN BACK. The draft counts two provider savings (Table E7, report page
 * 23). One is from providers collecting every dollar billed and no longer
 * billing individuals: unpaid cost sharing, which comes back in step with the
 * copays kept. The other is reduced billing and eligibility work: ADMIN_LOST
 * of it goes when clinics bill patients at all.
 *
 * NET. Low end: the least leaves the plan and the most is given back. High
 * end: the most leaves and the least is given back.
 *
 * NOT COUNTED, and two of the three would make the floor look worse:
 * - a top-up that pays the copays brings back care the copays discouraged,
 *   and the public plan pays for it;
 * - insurers selling a top-up have their own overhead;
 * - people use less care when it is not free (Table E5 does not split this
 *   from newly covered people and people moving in), which lowers the cost.
 */
export function floorPieces(target: Target): FloorPieces {
  const est = target === 'actuary' ? BEST : LOW;
  const oop = outOfPocket2032();
  const extras = est.planDentalVisionMore;
  const topUp = {
    low: (extras - MEDICAID_SHARE * extras) * (1 - CHILD_SHARE.high),
    high: (extras - MEDICAID_DENTAL) * (1 - CHILD_SHARE.low),
  };
  const copays = { low: oop * COPAYS_KEPT.low, high: oop * COPAYS_KEPT.high };
  const givenBack = {
    low: est.collectability * COPAYS_KEPT.low + est.providerAdmin * ADMIN_LOST.low,
    high: est.collectability * COPAYS_KEPT.high + est.providerAdmin * ADMIN_LOST.high,
  };
  return {
    target: target === 'actuary' ? REVENUE_TARGET.best : REVENUE_TARGET.board,
    topUp,
    copays,
    givenBack,
    net: {
      low: topUp.low + copays.low - givenBack.high,
      high: topUp.high + copays.high - givenBack.low,
    },
    moved: { low: topUp.low + copays.low, high: topUp.high + copays.high },
  };
}

/** The share of the new taxes the floor takes off. */
export function taxCut(target: Target): Range {
  const p = floorPieces(target);
  return { low: p.net.low / p.target, high: p.net.high / p.target };
}

// -------------------------------------------------------------------- rates
/** Model 3's payroll rates above $500,000 and above $10 million of payroll. */
const PAYROLL = { low: 0.096, high: 0.14 };

export interface FloorRates {
  target: number;
  /** The draft's rate, then the floor's as a range (the larger cut gives the lower rate). */
  household: { draft: number; floor: Range };
  payrollLow: { draft: number; floor: Range };
  payrollHigh: { draft: number; floor: Range };
}

/**
 * Model 3's rates with the floor. Every rate is scaled by the same share, as
 * the opinion page's "Honest rates" does, and at the actuary's estimate the
 * draft's rates are first scaled up to raise $39 billion.
 */
export function floorRates(target: Target): FloorRates {
  const p = floorPieces(target);
  const up = p.target / REVENUE_TARGET.board;
  const cut = taxCut(target);
  const at = (rate: number) => ({
    draft: rate * up,
    floor: { low: rate * up * (1 - cut.high), high: rate * up * (1 - cut.low) },
  });
  return {
    target: p.target,
    household: at(MODEL3.topRate),
    payrollLow: at(PAYROLL.low),
    payrollHigh: at(PAYROLL.high),
  };
}

// --------------------------------------------------------------- per person
/** Dollars per Oregonian a year: off the new taxes, and paid privately instead. */
export function perOregonian(target: Target): { taxes: Range; privately: Range } {
  const p = floorPieces(target);
  return {
    taxes: { low: perPerson(p.net.low), high: perPerson(p.net.high) },
    privately: { low: perPerson(p.moved.low), high: perPerson(p.moved.high) },
  };
}

/** The gap between the board's estimate and its actuary's that a floor would have to close. */
export const ESTIMATE_GAP = REVENUE_TARGET.best - REVENUE_TARGET.board;
