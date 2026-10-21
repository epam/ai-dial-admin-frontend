## Context

See proposal.md for motivation. Current shape of the Run Comparison page (`components/Runs/Compare/`):

- `CompareView` holds `primaryRunId` / `comparedRunId` (slots `Primary` / `Secondary`) plus a separate
  `isFlipped` boolean. `getCompareRuns(primary, compared, isFlipped)` builds the display-ordered `CompareRun[]`
  (`slot`, `index`, `isBaseline`), and views render by iterating it.
- Data and deltas are keyed by **slot**: the primary run is the merged row itself, the compared run is
  `row._compared`. Every delta helper (`getMetricDelta`, `getCompareFieldDelta`, `countCompareDiffs`,
  `getCompareRowFullDiffKind`, the heat map builders, `CompareDeltaCellRenderer`, the row-detail sections) is
  `_compared − primary`, so "primary is the baseline" is an invariant of ~10 call sites.
- `isFlipped` reorders the list but leaves the invariant on the old run, which is the whole bug.
- `onApplySelectRun` already handles a swap: picking the compared run in the Primary slot makes the old primary
  the compared run, then `router.replace(getCompareRunsUrn(...))`.

## Goals / Non-Goals

**Goals:**
- After a flip the primary slot, the "1" badge and the "(baseline)" label all belong to the same run, on the left.
- No delta site needs to know a flip happened.
- Reuse the existing run-change path rather than adding a second one.

**Non-Goals:**
- Preserving column layout, Display settings, the open row-details panel or row order across a flip.
- Avoiding the data reload a flip causes (see Risks).

## Decisions

### D1. Flip swaps `primaryRunId` and `comparedRunId`; `isFlipped` is removed

The primary slot stays the baseline by construction, so no delta code changes and every "re-check after the
fix" item in the tickets (Summary badges, Heat Map Delta, Delta columns, one-sided highlights, diff legend) is
satisfied by one state change.

*Alternative — keep slots, make every delta baseline-aware (B):* rejected. It touches ~10 call sites and their
duplicated walks (`countCompareDiffs`, `hasCompareRowDiff`, `getCompareRowFullDiffKind`,
`collectVisibleCompareDeltaKinds`, row-detail `diffKind` and delta filter, heat map delta + tooltip, the delta
cell renderer and sort value, Summary cards), keeps `index` and `isBaseline` as two things to keep in step, and
leaves the same trap for every future delta. It would avoid the reload, but the reload is acceptable (D3).

### D2. Flip goes through the same path as picking a run in the modal

Extract the "set new primary/compared, update state, `router.replace`" tail of `onApplySelectRun` into one
helper and call it from both. Flip passes `(comparedRunId, primaryRunId)`. The URL is rewritten
(`?runs=b,a`), so reload and shared links keep the flip.

### D3. Flip is "a change of the compared pair", so existing reset behavior applies

`useCompareViewTabState` already resets on any id change; the id-change effect in `CompareView` already closes
the row panel, clears Display state and `onlyMatchingTestCases`; and `runs` is re-derived. Flip inherits all of
it, which matches the existing `run-compare-row-details` rule "Changing compared runs resets Display". Results
are re-fetched and re-merged with the new primary first, so row order follows the new baseline.

*Alternative — swap `results`/`comparedResults`/summary data in memory to skip the reload:* rejected for now.
It needs a second code path through three tabs and the summary hook, and it still has to rebuild the merged
`selectedRow`; the user chose to close the panel and re-merge rows, which removes most of its benefit.

### D4. `getCompareRuns` loses its `isFlipped` parameter; `index` follows the slot

With no flipped state, the list is always `[primary (index 1, baseline), compared (index 2)]`.
`CompareRun.isBaseline` is then always the first entry. It is kept: `CompareRunTag` reads it, and removing it is
churn that does not belong in a bug fix. The `models.ts` doc comment that says "reordering the list is all a
flip does" is rewritten. `swapComparePairColumnState` and its spec are deleted — column ids are positional
(`x` / `cmp_x`), so they must not be swapped when the data underneath them is.

### D5. Row-details diff count comes from the displayed sections

`CompareRowDetailPanel` computes `countRowDetailDiffs(sections)` over all sections; the table renders
`displaySections` (the display tree applied). Count `displaySections` instead. "View differences only" needs no
handling, since it only hides rows that have no diff. This mirrors the Execution Results grid, which already
passes `hiddenColIds` to `countCompareDiffs`.

## Risks / Trade-offs

- [Flip reloads run data, so tabs show a loader, and a frame of stale results may render against swapped
  runs] → Same behavior as picking a run in the modal today; acceptable. If it proves visible, swap loaded
  results in memory as a follow-up.
- [Column order, widths, sort and filter state are lost on flip; today `swapComparePairColumnState` carries
  them] → Accepted and specified (flip resets like any pair change). Called out so reviewers expect it.
- [`router.replace` on flip makes the page server component re-run] → Already the case for the modal path.
- [Tests assert the old behavior: `getCompareRuns` with `isFlipped`, `swapComparePairColumnState`, CompareView
  flip] → Rewritten in the test task.
