# Oregon UHP: other models to consider (parked)

**Status: parked on 2026-11-13.** Marcus asked to hold this idea for now. Nothing here is on the
site, and nothing here should go on the site without the usual source check and review seats.

**Confidence: low.** Everything below is from memory except the figures marked "board", which come
from the Governance Board's draft legislative report (October 13, 2026) and its legislative brief.
Verify every outside fact before it is used anywhere.

## Where this came from

1. A question: which states have tried a single public plan, and why did they fail? Every attempt
   died before launch, largely on the size of the visible tax (Vermont 2014, Colorado 2016).
2. A friend's suggestion: a thin public floor with a private top-up. Priced roughly from the
   board's documents, it lowers the new taxes by only about 4% to 14% and costs Oregon more in
   total. That page is live but unlisted: `/oregon-universal-health-plan/floor-and-top-up`
   (PR #80, arithmetic in `src/app/oregon-health-plan/uhp-floor.ts`).
3. The follow-up question this note answers: is there another model worth considering?

## The one worth a real look: one price list, many payers

All-payer rate setting, plus automatic enrollment for the uninsured.

**What it is.** The state sets one price for each service that every payer uses: employer plans,
individual plans, Medicaid and, with a federal waiver, Medicare. Insurers and employer plans stay.
People without coverage are enrolled automatically in a public or subsidized plan.

**Why it stands out.**

- It has a long US track record. Maryland has set hospital prices for all payers since the 1970s
  under a federal waiver.
- It avoids the three things that killed single payer elsewhere: a very large visible tax, the need
  to redirect Medicare money, and a fight over large employers' self-funded plans (67% of workers
  with employer coverage, per the board's brief).
- It keeps part of the draft's savings. One price list removes much of the billing complexity the
  draft counts on.
- The coverage gap is small next to the plan. The board's report counts about 122,000 uninsured
  Oregonians today, costing about $0.6 billion a year (board). It projects 348,000 uninsured in
  2032 (board), so the gap is growing.

**What it does not do.** It does not end premiums, deductibles or job-tied coverage. It is a cost
fix with a coverage patch. It also keeps patient billing, so it gives up the draft's saving from
providers collecting every dollar billed.

**Where a rough price would start (board, Table E7 and report page 23).**

- Reduced billing and eligibility work: $4 billion to $5 billion a year in 2032. One price list
  should keep some share of this; how much is the main thing to estimate.
- Providers collecting every dollar billed: $3.0 billion to $3.5 billion. Mostly lost, because
  patients are still billed.
- Covering the uninsured: about $2.3 billion to $2.6 billion in 2032 (board, Milliman's figures for
  348,000 people).
- The board's own further savings on drugs and fraud ($1.0 billion and $0.8 billion, Table E8) do
  not obviously depend on a single payer and might carry over.

**What to verify before doing anything with it.**

- How Maryland's system works today (hospital global budgets, the current federal model) and what
  it has and has not achieved on cost.
- Whether a state can bind self-funded employer plans to a price list. Maryland's hospital rates
  do; the legal basis needs checking for Oregon.
- What Oregon already has: its health care cost growth target program and the Oregon Health Plan
  Bridge program for people just above Medicaid.
- Whether any of this is inside the board's charge. Senate Bill 1089 asks it to design a single
  public plan, so this is probably outside it.

## The others, briefly

| Approach | Where tried | First read |
|---|---|---|
| Public option alongside private plans | Washington, Colorado, Nevada | Low enrollment and small savings so far |
| Mandate, regulated insurers and subsidies | Massachusetts; the Netherlands, Switzerland | Works for coverage (Massachusetts 2.8% uninsured in 2024), does little for cost |
| Employer "pay or play" | Hawaii since 1974; San Francisco | Legally narrow; San Francisco's version survived a challenge in the federal appeals circuit that covers Oregon |
| Catastrophic coverage for everyone | Proposed, never enacted | The plan pays only above a deductible tied to income. The version of the floor idea that would move the tax, and harder on the sick |
| Phasing in by group | In the board's own draft | Not a different model; lowers the risk of any of them |

## If this is picked up again

1. Verify the outside facts above with sources.
2. Price all-payer the way the floor was priced: a small arithmetic file with named inputs, named
   assumptions and a spec, starting from Table E7.
3. Decide the form before building: a note to the board, a section on the opinion page, or an
   unlisted page like the floor's.
4. Run the same review seats that earned their keep on the floor page: sources and law, skeptic and
   committee member, advocate and provider and plain-language reader, and a markup check.

Lesson from the floor page: the first chat sketch (15% to 25% off the taxes) was far too rosy
against the built number (4% to 14%). Treat any estimate here as unpriced until the arithmetic
exists.
