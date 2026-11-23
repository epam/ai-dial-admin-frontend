## Why

A run's Extraction result grid shows one row per HTTP request. A test case produces several rows when it has
multi-turn data, when the suite ran with more than one run, or when it is configured with several requests.
The rows of different test cases interleave, so the state of one test case is only readable by filtering on
its name, and the logical order — run → request → turn — cannot be had at all (sorting one position column
breaks the other two).

The overall score belongs to the test case, not to a request. Repeating it on every row of a multi-row test
case reads as if each request were scored.

## What Changes

- The run Extraction result grid can **group rows by test case**: one group row per test case followed by its
  result rows, collapsible with a chevron in a fixed column at the far left.
- Rows inside a group are in natural order — `# Run number` → `Request` → `Turn`. Groups are ordered
  alphabetically by test case name.
- A **Group by test case** switch next to the Columns button turns grouping on and off.
  The switch is offered only when grouping applies, and grouping is off by default: the grid opens as the flat
  list and the user opts in.
- Grouping **applies to a run** when run number, request or turn varies across its results — the same
  condition that already keeps a position column visible. A run in which none of them varies keeps the flat
  list and no switch, and its rows keep showing the overall score as today.
- While grouped, the **overall score is shown on the group row only**; the result rows leave the cell blank,
  so the score visibly belongs to the test case. In the flat list it stays on every row.
- While grouped, columns are not sortable or filterable. The user turns grouping off to sort or filter.
- Group rows do not open the row detail panel.

## Capabilities

### New Capabilities

- `run-results-test-case-grouping`: when the Extraction result grid groups by test case, the group and result
  row layout and ordering, expand/collapse, the toggle and its availability, sort/filter behaviour while
  grouped, and keyboard/assistive-technology exposure of the groups.

### Modified Capabilities

- `run-results-overall-score`: the "Run results show each test case's overall score" requirement assumes every
  row carries the score. In grouped mode the score moves to the group row and result rows are blank; the
  threshold icon, rounding and missing-score rules apply to the group row's cell unchanged.
- `run-results-turn-columns`: its "Multi-turn results are not grouped" requirement is replaced by "The flat
  list renders one row per result" (the flat list is unchanged, grouping is the new switchable view), and
  "Request and Turn columns are sortable" applies to the flat list only.

## Non-goals

- Run Comparison (Compare view) grouping. PR #5213 also changed it; that stays out of this change.
- Sorting or filtering inside a group, or a test-case-name filter that keeps groups intact.
- A child count, an aggregate status or a failure indicator on the group row.
- Persisting the toggle or the collapsed groups beyond the open run view (no `localStorage`).
- A per-test-case grouping condition: grouping is decided per run, so single-row test cases of a groupable run
  appear as a group with one result row.
- Any backend or query change — test case scores are already loaded for the grid.

## Impact

- `components/Runs/View/ExtractionResult.tsx` — builds grouped rows, ignores group rows on click, resets
  grid sort/filter when grouping turns on.
- `components/Runs/View/View.tsx` — the switch next to the Columns button.
- `components/Runs/View/models.ts`, `use-run-view-tab-state.ts` — `isGroupedByTestCase` and the collapsed group
  keys join the Extraction result tab state, so they survive switching tabs like the other grid state.
- `components/Runs/View/grouped-columns.ts` — derives the grouped columns from the stored ones: a fixed,
  pinned toggle column in front, score column on group rows only, sort/filter off, `—` fallbacks guarded on
  group rows.
- New pure util for group building and ordering under `components/Runs/utils/`, a toggle cell renderer, and
  the row-type enum/models next to them.
- `utils/evaluation/column-variation.ts` — a helper exposing "does any position index vary" for the switch.
- `locales/en.ts`, `constants/i18n.ts` — `RunsI18nKey` entries for the switch and the chevron labels.
- `Grid/CellRenderers/OverallScoreCellRenderer.tsx` is reused as is for the group row. No shared component
  changes; Compare (`Runs/Compare/**`) and the row detail panels are not touched.
- Specs: new `run-results-test-case-grouping`, deltas on `run-results-overall-score` and
  `run-results-turn-columns`.
