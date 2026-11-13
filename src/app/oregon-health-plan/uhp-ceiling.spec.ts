import {
  CEILING_ROWS,
  COST_PER_PERSON,
  TOP1_STAKE,
  averageContribution,
  capped,
  ceiling,
  ceilingIncome,
  floor,
  floorAndSoftCap,
  povertyLine,
  softCapped,
} from './uhp-ceiling';
import { HOUSEHOLD_ROWS } from './uhp-households';

describe('opinion page arithmetic', () => {
  it('prices coverage at the plan cost per Oregonian', () => {
    // $77.7 billion over 4.423 million people.
    expect(COST_PER_PERSON).toBe(17_600);
    expect(ceiling(4)).toBe(70_400);
  });

  it('leaves households under the ceiling exactly as the draft has them', () => {
    expect(capped(12_690, 4)).toBe(12_690);
    expect(softCapped(12_690, 4)).toBe(12_690);
  });

  it('stops a hard ceiling at the ceiling and halves the excess under a soft cap', () => {
    expect(capped(261_090, 4)).toBe(70_400);
    expect(softCapped(261_090, 4)).toBe(70_400 + (261_090 - 70_400) / 2);
  });

  it('never raises anyone above the draft', () => {
    for (const row of CEILING_ROWS) {
      expect(row.hard.high).toBeLessThanOrEqual(row.draft.high);
      expect(row.soft.high).toBeLessThanOrEqual(row.draft.high);
      expect(row.soft.high).toBeGreaterThanOrEqual(row.hard.high);
    }
  });

  it('bounds the money in play by the top 1% share of the household contribution', () => {
    expect(TOP1_STAKE.low).toBe(3);
    // Model 4: $39 billion x 40% x 39.9%. Not Model 1's 43% paired with Model 4's share.
    expect(TOP1_STAKE.high).toBe(6.2);
  });

  it('reaches the ceiling far lower for one person than for a family', () => {
    const one = ceilingIncome(1);
    const four = ceilingIncome(4);
    // Model 1: 17,600 / 13.5% above a $31,920 exemption is about $162,000.
    expect(one.low).toBe(160_000);
    expect(one.high).toBeGreaterThan(one.low);
    expect(four.low).toBeGreaterThan(550_000);
    expect(four.high).toBeLessThan(1_050_000);
  });

  it('puts the ceiling for four at about five times the average contribution', () => {
    const times = ceiling(4) / averageContribution(4);
    expect(times).toBeGreaterThan(4.5);
    expect(times).toBeLessThan(6);
  });

  it('starts the floor at the poverty line, with no cliff', () => {
    expect(povertyLine(4)).toBe(33_000);
    expect(floor(33_000, 4)).toBe(0);
    expect(floor(33_100, 4)).toBeCloseTo(2, 5);
    expect(floor(110_000, 4)).toBeCloseTo(1_540, 5);
    expect(floor(20_000, 4)).toBe(0);
  });

  it('asks a little of households the draft charges nothing', () => {
    for (const row of HOUSEHOLD_ROWS.filter((r) => r.income <= 110_000)) {
      for (const draft of row.models) {
        const pick = floorAndSoftCap(draft, row.income, row.size);
        expect(pick).toBeGreaterThanOrEqual(draft);
        expect(pick).toBeGreaterThan(0);
      }
    }
  });

  // The floor is not free for everyone. The page must say so, so pin it here.
  it('turns a saving into a cost for exactly one example household: the single public employee', () => {
    const flipped = HOUSEHOLD_ROWS.filter((row) =>
      row.models.some(
        (draft) => draft < row.now && floorAndSoftCap(draft, row.income, row.size) > row.now,
      ),
    );
    expect(flipped.map((r) => r.who)).toEqual(['Single public employee']);
    // $80,000 less the $15,960 poverty line, at 2%: $1,281 against $940 today.
    expect(Math.round(floor(80_000, 1))).toBe(1_281);
  });

  it('keeps a $2,000,000 household paying more than a $1,000,000 one', () => {
    const one = HOUSEHOLD_ROWS.find((r) => r.income === 1_000_000)!;
    const two = HOUSEHOLD_ROWS.find((r) => r.income === 2_000_000)!;
    one.models.forEach((draft, i) => {
      const a = floorAndSoftCap(draft, one.income, one.size);
      const b = floorAndSoftCap(two.models[i], two.income, two.size);
      expect(b).toBeGreaterThan(a);
      expect(a).toBeLessThanOrEqual(draft);
    });
  });
});
