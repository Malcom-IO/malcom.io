import {
  CEILING_ROWS,
  COST_PER_PERSON,
  TOP1_STAKE,
  averageContribution,
  capped,
  ceiling,
  ceilingIncome,
  softCapped,
} from './uhp-ceiling';

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
});
