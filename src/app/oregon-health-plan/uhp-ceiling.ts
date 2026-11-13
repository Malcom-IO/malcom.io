import { HOUSEHOLD_ROWS } from './uhp-households';
import { BEST, POPULATION_2032, REVENUE_TARGET } from './uhp-statewide';
import { FPL_200, MODELS, contribution } from './uhp-model';

/**
 * Arithmetic for the OPINION page only. None of this is the board's, and none
 * of it appears on the explainer. It illustrates one idea: no household pays
 * more than what covering its own members costs the plan.
 */

/**
 * What the plan would spend per Oregonian in 2032, on Milliman's best estimate.
 * An all-ages statewide average, in 2032 dollars: a yardstick, not the cost of
 * any particular household.
 */
export const COST_PER_PERSON = Math.round((BEST.plan * 1e9) / POPULATION_2032 / 100) * 100;

/** The ceiling for a household: the plan's cost of covering everyone in it. */
export function ceiling(size: number): number {
  return COST_PER_PERSON * size;
}

/** A hard ceiling: pay the draft's contribution, but never more than the ceiling. */
export function capped(draft: number, size: number): number {
  return Math.min(draft, ceiling(size));
}

/** A soft cap: above the ceiling, each further dollar of contribution is halved. */
export function softCapped(draft: number, size: number): number {
  const top = ceiling(size);
  return draft <= top ? draft : top + (draft - top) / 2;
}

const range = (values: readonly number[]) => ({ low: Math.min(...values), high: Math.max(...values) });

/** The higher-income example households, under the draft and under both ideas. */
export const CEILING_ROWS = HOUSEHOLD_ROWS.filter((h) => h.size === 4 && h.income >= 220_000).map(
  (h) => ({
    who: h.who,
    income: h.income,
    now: h.now,
    ceiling: ceiling(h.size),
    draft: range(h.models),
    hard: range(h.models.map((v) => capped(v, h.size))),
    soft: range(h.models.map((v) => softCapped(v, h.size))),
  }),
);

/**
 * How much money is in play. The household contribution is 43% of the new
 * taxes in Model 1 and 40% in the others ($30 to $39 billion in all), and the
 * top 1% of filers pay between a quarter and two fifths of it by model. A ceiling could give
 * up no more than that, and in practice only part of it.
 */
const shares = MODELS.map((m) => m.top1Share);
/** The household contribution's share of the new revenue: 43% in Model 1, 40% in the rest (report, "% of Revenue"). */
const householdShare = (modelId: number) => (modelId === 1 ? 0.43 : 0.4);
/** Each model's own pairing: its revenue share times its top-1% share. */
const top1OfRevenue = MODELS.map((m) => householdShare(m.id) * m.top1Share);
export const TOP1_STAKE = {
  low: Math.round(REVENUE_TARGET.board * Math.min(...top1OfRevenue) * 10) / 10,
  high: Math.round(REVENUE_TARGET.best * Math.max(...top1OfRevenue) * 10) / 10,
  shareLow: Math.min(...shares),
  shareHigh: Math.max(...shares),
};

/**
 * The income at which a household with no worker credit first reaches its
 * ceiling, lowest and highest across the five models, to the nearest $10,000.
 */
export function ceilingIncome(size: number): { low: number; high: number } {
  const top = ceiling(size);
  const reached = MODELS.map((m) => {
    let income = 0;
    while (contribution(m, income, 0, size, 0) < top) income += 1_000;
    return Math.round(income / 10_000) * 10_000;
  });
  return { low: Math.min(...reached), high: Math.max(...reached) };
}

/**
 * What the average household of a given size would contribute: the household
 * contribution's share of the new taxes, spread evenly over every Oregonian.
 * A yardstick for "how many times the average" a bill is, nothing more.
 */
export function averageContribution(size: number): number {
  const perPerson =
    ((REVENUE_TARGET.board * 0.4 + REVENUE_TARGET.best * 0.43) / 2) * 1e9 / POPULATION_2032;
  return perPerson * size;
}

// ---------------------------------------------------------------- the floor
/** The share of income above the poverty line that every household contributes at least. */
export const FLOOR_RATE = 0.02;

/** The federal poverty line for a household: half the 200% figure the models use. */
export function povertyLine(size: number): number {
  return FPL_200[size] / 2;
}

/**
 * A minimum contribution: 2% of income above the poverty line. It starts at
 * zero at the poverty line, so there is no cliff, and it only bites where the
 * draft asks for less, which is mostly where the worker credit or the
 * exemption has wiped the bill out.
 */
export function floor(income: number, size: number): number {
  return Math.max(0, income - povertyLine(size)) * FLOOR_RATE;
}

/**
 * The two together: never less than the floor, and above the plan's average
 * cost for the household each further dollar is halved. Unlike a hard ceiling,
 * a household at $2,000,000 still pays more than one at $1,000,000.
 */
export function floorAndSoftCap(draft: number, income: number, size: number): number {
  return softCapped(Math.max(draft, floor(income, size)), size);
}

/** Tax filers who would owe nothing under the draft, lowest and highest model. */
const nothing = MODELS.map((m) => m.returnsOwingNothing);
export const OWING_NOTHING = { low: Math.min(...nothing), high: Math.max(...nothing) };
