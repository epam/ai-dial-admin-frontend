## Context

See `proposal.md` — Why. Constraints that shape the approach:

- **The Trends tab already has a data hook.** `use-trends-data.ts` fetches two things in a
  `Promise.all`: a structured query for metric scores, and `getRuns(0, 100, [], [RUN_FILTER(suiteId)])`
  for the suite's runs. It wraps both in a single `try`/`catch` that falls back to
  `emptyTrendsData()` — so today any one failure blanks the whole tab.
- **The new endpoint carries no run name.** `runs[]` carries `testSuiteRunId`, `computationId`,
  `status`, `runCreatedAtMs`, the four counts and `totalCount`. Nothing in it names a run, so the
  label has to come from the suite's runs list, which the hook already has — and once that join
  exists it supplies the date and status too (D8).
- **Pass/fail/error UI is already shared.** `components/Common/PassFailStatus/` holds
  `PassFailErrorCounts`, `PassFailFraction` (`dial-display2-text` numerator + `dial-body-text`
  denominator), `PassFailStatusBreakdown` (12px Tabler icons) and `STATUS_DOT_CLASSES` /
  `STATUS_DOT_ICONS`. Run Summary, Run Compare and the Trends *Runs Passed Threshold* card all
  consume it, so anything added there must be opt-in.
- **`SummarySection`** (`components/Runs/Summary/`) is the established titled-panel chrome for Trends
  sections: `rounded-lg border border-secondary bg-layer-3 p-4`, header slot, optional right control.
- **The endpoint is not deployed yet.** The handoff describes it as in progress on a backend branch,
  so the frontend must tolerate a 404 from day one.
- The `ai-dial-ui-kit` MCP server failed to connect in this session, so ui-kit component choices
  below are grounded in existing in-repo call sites rather than the package metadata. Re-check with
  `searchEntity` / `getEntityDetails` during implementation if a prop does not match.

## Goals / Non-Goals

**Goals:**

- Keep the panel's data flow inside the existing Trends hook so the run-name/route join is free and
  the tab has one loading pass and no layout shift.
- Make each bar a real focusable link, so the navigation and accessible-name requirements in
  `specs/test-suite-trends/spec.md` are satisfied by the DOM rather than by re-implemented behavior.
- Re-express the supplied visual design in this repo's tokens and typography classes, with no raw
  hex, no bespoke font sizes, and no hand-rolled tooltip surface.
- Keep all count arithmetic and the run join in one pure, table-tested util.

**Non-Goals:**

- Unifying `RunStatus` with the endpoint's wider status vocabulary (see D8).
- Reworking `use-trends-data`'s existing structured-query or runs fetches beyond isolating failures.
- A generic reusable stacked-bar component. This is one panel; `Common/` gets nothing until a second
  consumer exists (`components.md` §4, rule of three).

## Decisions

### D1 — Bars are DOM elements, not an ECharts series

The rest of Trends uses ECharts (`OverallScoreTrend`, `MetricTrends`), so the series-chart precedent
points that way. Rejected anyway: the spec requires each bar to be an anchor that supports
middle-click and cmd/ctrl-click, to sit in tab order oldest→newest, to carry its own accessible name,
and to show its tooltip on focus as well as hover. An ECharts canvas renders no DOM nodes for bars,
so all four would have to be re-implemented on an invisible overlay — more code than the bars
themselves, and the kind of divergence `a11y.md` warns about.

So: a flex row of columns, each column an `<a>` (or a `<div>` when the run is unresolvable) wrapping
a fixed-height track `div` with one absolutely-stacked `div` per non-zero bucket. Considered and
rejected: SVG `<rect>`s — focusable and linkable in principle, but styling them needs presentation
attributes instead of Tailwind tokens, which `components.md` §6 pushes against.

### D2 — Four groups, four tokens

No raw hex (`a11y.md` "never hardcode a hex"). The endpoint's four counts render as four groups,
chosen so a bar segment and its legend entry always agree:

| API field | Group | Bar token | Legend token + icon |
| --- | --- | --- | --- |
| `successPassedCount` | pass | `bg-accent-secondary` | `text-accent-secondary`, `IconCheck` |
| `successNotPassedCount` | fail | `bg-red-400` | `text-error`, `IconX` |
| `failedCount` | error | `bg-secondary` | `text-secondary`, `IconCircleMinus` |
| `successNoVerdictCount` | not scored | `bg-yellow-400` | `text-warning`, `IconCircleDashed` |

The first three are exactly `STATUS_DOT_CLASSES`, so this panel and the *Runs Passed Threshold* card
agree on what teal/red/grey mean. The design's `#3ECF8E` green becomes DIAL's teal
`accent-secondary` for that reason.

**Why "not scored" is yellow rather than a second grey.** Error and not-scored are semantically
adjacent - neither is a scoring outcome - and an earlier revision merged them for that reason. Split
back out they are two segments that frequently sit next to each other in the stack, and the only two
greys in the palette (`#9FA6BD` and `#696E7C`) are ~1.9:1 apart, under the 3:1 `a11y.md` asks of a
non-text boundary. `bg-yellow-400` / `text-warning` separates them by hue instead, and the reading
is defensible: a row that executed but produced no verdict is usually a configuration gap worth
noticing. Rejected: `bg-accent-tertiary` (purple carries no meaning here) and `bg-layer-4` (1.6:1
against the track).

A 1px `border-tertiary` (#0C101D) hairline separates adjacent non-zero segments; visually it reads
as the `bg-layer-1` track showing through. It is load-bearing: red against yellow is only 1.86:1,
so hue alone does not carry the boundary between two adjacent fills.

**`bg-red-400` / `bg-yellow-400` are theme tokens, not stock Tailwind.** `tailwind.config.js` maps
them to `var(--bg-red-400, …)` and `var(--bg-yellow-400, …)`, so they follow a themes-service
palette like every other token here; the names read like the stock palette, which invites the
opposite conclusion. Rejected: `bg-error` / `bg-warning`. Those are alert *surface* tints (#402027,
#3F3D25) meant to sit behind text, and as bar fills they measure 1.31:1 and 1.72:1 against the
`bg-layer-1` track — against the 3:1 `a11y.md` asks — versus 6.29:1 and 11.71:1 today. The
saturated equivalents exist only as `text-*` / `stroke-*` tokens, which is why the legend dots use
`text-error` / `text-warning` while the fills use the `bg-*` pair. The two default to the same hex,
so a theme that overrode `--text-error` without `--bg-red-400` would drift a dot from its segment;
that is the cost of the split, and the fix would be new semantic fill tokens in the shared config
rather than a change in this panel.

### D3 — Panel chrome is `SummarySection`, sized to its content

The design calls for `bg-layer-2`; `SummarySection` gives `bg-layer-3`. Taking the component wins:
it is what the two sibling Trends sections use, so the tab stays internally consistent, and
`bg-layer-1` tracks still read against `layer-3`.

The card shares a row with Overall Score Trend at `xl:w-1/2` each, under `xl:items-stretch` so the
two square off against each other's height. A line chart earns a wide viewport; ten bars do not, and
at full width a three-run window left ~230px of empty track under each bar.

Half a row is tight, and that drove the geometry: at 1440px the panel gets ~535px, where the
two-column layout at its original sizes needed ~760px. The bars shrank rather than the readout
wrapping below them, which would have made the card taller than the chart it is squared against:
`BAR_TRACK_HEIGHT` 132 → 90, `BAR_WIDTH` 48 → 32 on a 24px floor, gaps 8 → 4, readout column
288 → 192 with its statuses stacked one per line. That lands at ~529px, and the bar row keeps
`overflow-x-auto` as a last resort rather than letting the card break.

Above the floor the bars grow instead of the card carrying dead space: the chart column is `flex-1`,
every bar is `flex: 1 1 BAR_WIDTH` capped at `BAR_MAX_WIDTH`, and all of them — including the
latest — share one flex row, so one growth distribution covers them. The latest bar keeps its
emphasis through a grow factor and proportional bounds; a fixed width would invert it once the trend
bars grew past. Growing that column is also what aligns the readout, since `SummarySection`
right-aligns its `control` and the body only reaches the same edge when the chart absorbs the slack.

Run labels read bottom-to-top (`writing-mode: vertical-rl` plus `rotate-180`) in a fixed
`BAR_LABEL_HEIGHT` strip. A 32px bar cannot carry a horizontal "Run #128"; rotating buys ~10
characters where widening would have cost the even split.

At `xl` the readout's "Latest Run" heading moves into `SummarySection`'s `control` slot, level with
the card title, which lifts the readout a row and takes that height off the card. The control is
right-aligned, so header and body cells must share a width — `READOUT_COLUMN_CLASSES` holds it for
both, with the column divider on the body cell only (in the header it renders as a detached stub).
Below `xl` the columns stack and the readout renders its own `xl:hidden` copy of the heading.

Rejected: a flexible height on the score chart so it follows the panel. `echarts-for-react` redraws
on window resize, not container resize, so a container-driven height risks a canvas stuck at its
first-paint size.

**Cut from the supplied design:** the footer sentence ("Big number reflects <run> only · …") and the
`0` / `totalCount` axis ticks. Both restate what is already on screen — the readout names its run
and prints `passed / total`, and the track's full height *is* `totalCount`.

### D4 — Typography and radii come from the existing classes

`dial-display2-text` for the primary metric (via `PassFailFraction`, unchanged), `dial-body-semi-text`
for the panel title and the "Latest Run" heading, `dial-small-text` for the readout's run label and
delta chip, `dial-tiny-text` for bar labels, the legend and the tooltip. `rounded-lg` on the panel
(from `SummarySection`), default `rounded` (3px) on tracks and chips. No `text-[38px]`, no `text-xxs`
unless an existing sibling already uses it.

### D5 — The readout reuses `PassFailStatusBreakdown` with an opt-in fourth status

`PassFailStatusBreakdown` already renders pass/fail/error from `PassFailErrorCounts`, which covers
three of D2's four groups. It gains an optional `notScored?: number` plus `notScored` entries in
`STATUS_DOT_CLASSES` / `STATUS_DOT_ICONS`, so one source of truth for status colours and icons
serves Run Summary, Run Compare and both Trends cards; every existing call site omits the prop and
renders three statuses unchanged. A second optional prop, `isVertical`, stacks the statuses one per
line for the panel's 192px column.

Rejected: a breakdown component local to this panel, which would duplicate the token mapping and let
the two drift - the failure the Common extraction in `add-trends-runs-passed-threshold` was done to
prevent.

The legend is a separate small component rather than the same one in `compact` mode: it is a colour
key, and `PassFailStatusBreakdown` always renders counts, which would read as window totals sitting
next to the readout's per-run ones. It draws its colours and icons from the same
`STATUS_DOT_CLASSES` / `STATUS_DOT_ICONS`, so the two cannot drift.

### D6 — Fetch joins `use-trends-data`, with its own failure boundary

The hook already loads the runs list this panel needs for labels, `status` and route params, so a
separate hook would duplicate that request and give the panel a second, independently-timed loading
state — visible as layout shift. Instead the hook gains a third concurrent fetch and
`TrendsData` gains a `casePassRate` field.

The existing single `try`/`catch` is the problem: a 404 from an undeployed endpoint would blank the
whole tab. So the new call is wrapped in its own `try`/`catch` that resolves to `null` rather than
rejecting, leaving the outer handler to cover only the two pre-existing fetches.

The boundary has to cover **parsing as well as the request**. An early revision put the request
inside it but built the bars outside, and a response body that was not the expected object threw
from `buildCasePassRateBars` straight into the outer handler — the whole tab fell back to
`emptyTrendsData()` and rendered "No runs yet" for a suite that had runs. `buildCasePassRateSeries`
now owns both halves: it returns `null` for a null response, for a body with no `runs` array, and
for anything the builder throws on. A hook spec pins the symptom.

That last clause is a catch-all, and it will absorb a defect in the build as readily as a bad row —
which is exactly what happened next (see Risks: the wire-name mismatch). Narrowing it to a row
validator was considered and rejected: the residual throw is the one worth catching, since it is
the one that would otherwise blank the tab. It logs instead, so a fallback is visible in the console
rather than presenting as a healthy-looking "unavailable".

Encoding:

- `casePassRate: null` → request failed → panel shows its unavailable state.
- `casePassRate: { bars: [] }` → endpoint returned `runs: []` → panel shows "no runs yet".

Two distinguishable absences, no extra error field.

### D7 — One pure util owns ordering, the join, and all arithmetic

`Trends/CasePassRate/utils/case-pass-rate.ts`, named exports, no hooks or JSX (`utils.md` §2):

- `buildCasePassRateBars(response, runs)` — reverses the endpoint's newest-first array; indexes
  `runs` by `id` once; per run emits the label, date, status and href from the join (D8), the four
  counts, `totalCount`, `notRunCount` (clamped at `0`) and the non-zero segments with their percentages.
- `getLatestRunDetail(bars)` — latest bar, `passedDelta` against the previous bar, `null` delta for a
  single bar, and `isLackingScoring` per D11.

Percentages are computed here, not in JSX, so the component body stays markup and wiring
(`components.md` §3) and every count rule is unit-testable without rendering.

Dates are formatted in the component from `createdAtMs`, not in the util — the util stays
deterministic and clock-free (`utils.md` §2) and formatting is locale-dependent.

### D8 — Run name, date, status and route all come from the runs list

The response DTO carries `status` and `runCreatedAtMs`, but nothing that names a run. Since the
label has to come from the suite's runs list either way, the bar takes every piece of run metadata
from that one source rather than splitting it across two, which keeps a bar and its tooltip
internally consistent. The hook already fetches the list (D6): `testRunName` for the label,
`createdAt` (falling back to `startedAt`) for the tooltip date, `status` for the in-progress marker,
and `getUrnForEntity` for the href. A run absent from that list keeps its counts and loses the rest,
which is the same condition that makes its bar non-interactive.

Ordering comes from reversing the response array rather than sorting on a timestamp. The endpoint
guarantees newest-first, and reversing keeps every run in the order the backend ranked them -
including runs the join did not resolve, which have no timestamp to sort on.


### D9 — Tooltip is ui-kit `DialTooltip`; no `computationId` in it

`PassFailStatusBreakdown` already wraps itself in `DialTooltip`, so the component is a known quantity
here: it owns placement, the `bg-layer-3` surface, and — the reason it matters — focus as well as
hover, which the spec requires. Hand-rolling the surface from the design's
`bg-layer-3` / `stroke-secondary` / `shadow` tokens would re-implement dismissal and focus handling
that already work.

The API handoff suggests putting `computationId` in the tooltip. Dropped: a raw UUID in a hover
surface is noise for the person reading a trend, and nothing in the panel acts on it — so
`CasePassRateRun` does not model it at all. The date line stays, sourced from the joined run (D8).

### D10 — No feature flag for the undeployed endpoint

D6's unavailable state already covers a 404, and it degrades to one line inside one panel. A new env
toggle would have to be threaded through config, documented in `.env.template`, and then removed —
more moving parts than the failure path it would replace.

### D11 — Lack-scoring is read from the run's outcomes, not from the suite's threshold

When the latest run reached no pass/fail verdict, a `0 / N` readout would be a lie — nothing was
scored, so nothing failed. The panel substitutes a "Lack scoring" note. The condition is

```
successPassedCount + successNotPassedCount === 0 && successNoVerdictCount > 0
```

read entirely from the run the readout describes.

**Rejected: deriving it from `TestSuite.overallScoreThreshold`.** The endpoint's handoff notes that a
suite without a threshold puts every SUCCESS row in `successNoVerdictCount`, which makes an unset
threshold look like a sufficient test. It is not, in either direction:

- *Threshold set, still nothing scored.* A metric can fail to produce a score — the computation
  errored, the metric was not bound, the rows carried no score. The threshold is configured, the
  run is unscored, and a threshold check would show `0 / N` for a run that failed nothing.
- *Threshold unset, but rows scored.* An unset threshold is suite-level and current; the counts
  belong to a run that already happened, possibly before the threshold was cleared. Reading the
  suite would relabel historical runs whenever someone edits the Metrics tab.

The state being reported is "this run produced no verdict", which is a property of the run. The
threshold is one of several reasons that can happen, and the readout does not need to name which.
Reading the run's own counts also keeps the panel dependent on one source — the endpoint — rather
than on a suite field the fetch does not otherwise touch.

`failedCount` is excluded for the same reason. An execution failure tells us the row never reached
scoring, not that scoring was unavailable, so an all-errored run keeps the `0 / N` readout: zero
passed out of N attempted is true and useful there. And any single verdict, pass or fail, means
scoring worked — the pass rate is then meaningful however lopsided it looks.

## Risks / Trade-offs

- **The endpoint ships after this change.** → The panel's unavailable state is the default outcome
  until the backend deploys, so the tab stays usable. The component test for that state is the one
  that proves it.
- **The wire names were mis-read once, and no test caught it.** Mid-implementation the DTO was
  renamed to `runId` / `failed` / `successPassed` / `total`. Those are the names of
  `RunPassRateStats`, the service's internal repository projection — the wire DTO is
  `RunPassRateDto` (`testSuiteRunId`, `status`, `runCreatedAtMs`, `*Count`), and it never changed.
  The panel went blank against the live backend: `runsById.get(undefined)` missed for every run and
  `buildCasePassRateBars` threw on `run.runId.slice(...)`, which the D6 boundary turned into the
  unavailable state. Nothing failed in CI, because the fixtures were renamed alongside the model and
  stayed self-consistent, and `tsconfig.app.json` excludes specs so the type never disagreed with
  them. → No unit test can catch a wire-contract mismatch; the guard is reading the producer. The
  names here are taken from `RunPassRateDto` on the backend branch, and its projection type is
  called out in `CasePassRateRun`'s doc comment so the two are not confused again.
- **The browser-observable criteria were validated by the developer, not the gate.** A
  `spec-browser-verify` task was agreed and then dropped: the endpoint was unmerged at
  implementation time, so the gate could only have reached the unavailable state, and
  `openspec/config.yaml` does not allow a manual-verification step to stand in for it. → The
  panel's states are covered by `CasePassRatePanel.spec.tsx`; ordering, focus and tooltip behavior
  are covered by `RunBar.spec.tsx` through role and accessible-name queries.
- **Ten anchors per panel, each with a tooltip.** → Tooltips are per-bar and mount on hover/focus;
  ten columns is well inside what the Trends tab already renders with two ECharts canvases.
- **Adding `notScored` and `isVertical` touches a component three other views share.** → Both are
  optional and omitted at every existing call site, which keeps the three-status wrapped row; the
  existing `Common/PassFailStatus` specs plus the Run Summary and Run Compare specs are the
  regression gate.
- **The halved width leaves bar labels ~32px wide.** → Labels are rotated to read bottom-to-top, so
  the constraint becomes `BAR_LABEL_HEIGHT` (~10 characters) rather than the bar width. Beyond that
  they truncate, and the full name stays in the bar's tooltip and its accessible name; the latest
  run prints its name unabbreviated in the readout.
- **`xl:` is the only breakpoint, for both the row and the card's own split.** Between the stacking
  point and ten bars there is a band where bars sit at their 24px floor. → Below that the bar row
  scrolls horizontally rather than the bars collapsing to slivers. Container queries would fit the
  card's internal split better than a viewport breakpoint, but this Tailwind config has no container
  query plugin.
- **Bars are not tabular data, but they are a row of columns.** `components.md` §5 forbids CSS
  tables for tabular *data*; this is a chart, so flexbox is correct — worth stating because a
  reviewer scanning for "flex row of columns" may read it as a hand-built table.

## Migration Plan

No migration. Additive UI plus one new read-only endpoint call; no schema, storage or route changes,
and nothing to roll back beyond reverting the change.

## Open Questions

- Whether the no-verdict legend entry should link to the Metrics tab where `overallScoreThreshold` is
  authored. Deferrable: the spec only requires the hint text, and adding a link later changes one
  component.
