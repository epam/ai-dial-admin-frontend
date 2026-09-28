# Design — improve-audit-activities-date-range

Read this in slices. Every section names the files it governs in its first line; find your task's
files and read that section plus §1 (the one decision every section depends on).

All paths are relative to `apps/ai-dial-admin/`.

---

## §1 The central problem: a per-entity start date on an entity-agnostic resolution path

Files: `src/constants/global-time-filter.ts`, `src/utils/time-filter/get-time-range-id.ts`,
`src/hooks/use-time-filter.ts`.

Three places turn a period id into a `TimeRange`, and all three look the id up in the module-level
`timePeriodOptionsConfig`:

- `getTimeRangeById(periodId)` — `src/utils/time-filter/get-time-range-id.ts`
- `useTimeFilter` — three calls (init, `getCurrentTimeRange`, `onTimePeriodChange`)
- `ActivityAuditList`'s own datasource call, `src/components/ActivityAudit/List/List.tsx:204`

`Since Creation` cannot be a row in that array: its start date belongs to one entity, and the array
is read by `UsageLog`, `Dashboard` and `constants/analytics/queries.ts`
(`KNOWN_TIME_PERIODS`). Adding a row there would make the id resolve — nonsensically — everywhere.

**Decision: make the resolution path option-aware, not entity-aware.** The option list becomes the
resolver's second argument, defaulted to the shared config, and an option may carry an absolute
anchor instead of a sliding offset:

```ts
// src/constants/global-time-filter.ts — beside the existing TimePeriodOption
export interface AnchoredTimePeriodOption {
  value: string;
  label: string;
  startDate: Date;          // absolute anchor; already parsed and validated
}
export type TimeFilterOption = TimePeriodOption | AnchoredTimePeriodOption;

export const SINCE_CREATION_PERIOD_ID = 'since-creation';
```

```ts
// src/utils/time-filter/get-time-range-id.ts
export const getTimeRangeById = (
  periodId: string,
  options: TimeFilterOption[] = timePeriodOptionsConfig,
): TimeRange => { /* anchored → { new Date(option.startDate), now }; else now − offset */ };
```

The entity then enters the system exactly once, in the component that already holds it
(`ActivityAuditList`), which builds the option list and hands the same list to `useTimeFilter` and to
`TimeFilter`. No domain model reaches `src/utils/time-filter/` or `src/hooks/`, and every existing
caller keeps working through the default parameter.

`TimePeriodOption` stays exactly as it is (`offset: number`, required), so no existing consumer has
to narrow anything: the union appears only in the two functions that must accept it, in
`TimeFilter`'s prop and in `useTimeFilter`'s options.

### Alternatives rejected

- **`getTimeRangeById(periodId, entity?)`.** Puts `BaseEntity` inside a domain-free time util,
  against `.claude/rules/utils.md`, and every future per-surface period adds another branch inside
  the util. `useTimeFilter` would need the entity too, for no gain over passing the option list.
- **A new row in `timePeriodOptionsConfig`.** Rejected on the code fact above: the same id would
  then resolve on `UsageLog`, `Dashboard` and inside `KNOWN_TIME_PERIODS`, which is the leak the
  ticket's scope rules out.
- **`ActivityAuditList` special-cases the id locally, before calling `getTimeRangeById`.** It fixes
  the fetch path and leaves `useTimeFilter`'s own `timeRange` state wrong — and therefore the trigger
  label and `canAutoRefresh` wrong — because the hook resolves the id itself in three places the
  component cannot reach. Two sources of truth for one id.
- **Commit `Since Creation` as a custom `TimeRange` at click time** (treat it as a preset that
  applies a custom range). Rejected: the range would freeze at the moment of selection, while the
  spec requires it recomputed on every refresh; it would also set `isCustom`, which disables
  auto-refresh (`canAutoRefresh`) and replaces the label with a date pair.
- **Make `TimePeriodOption` itself a discriminated union** (`offset` optional / union member).
  Rejected: it forces narrowing in `getTimePeriodOptionsByMaxMs` and in two existing Analytics spec
  files that read `.offset` off the shared config, for no benefit — the shared config has no
  anchored members and never will.
- **Declare the new types in `src/models/time-range.ts`** (the house constants/models split says
  types do not live in a `constants.ts`). Rejected: `TimePeriodOption` already lives in
  `constants/global-time-filter.ts`, and splitting one option family across two files — with a
  `models → constants` type import to glue it — reads worse than following the file's existing
  shape. The pre-existing misplacement is noted, not fixed here; moving it ripples through eight
  files for no behaviour.

### `startDate` is a `Date`, not a string

`createdAt` arrives as **either** an ISO string **or** a millisecond timestamp serialised as a
string — `src/utils/formatting/date.ts` exists precisely because of that (`toDate` coerces numeric
strings before `new Date`, so `new Date(createdAt)` alone would yield `Invalid Date` for the
numeric form). Parsing therefore happens once, at the boundary where the entity's string enters, via
the exported `toDateOrNull(value)` — which returns `null` for missing, empty and unparseable values.
An anchored option cannot exist with an invalid anchor, so the resolver has no invalid-date branch.
The resolver returns a **fresh** `Date` (`new Date(option.startDate)`) so no caller can mutate the
option's anchor.

---

## §2 The single-date commit rule, and the cap

Files: `src/components/Common/RangePicker/range-fsm.ts`,
`src/components/Common/RangePicker/RangePicker.tsx`.

`toCommit` currently does `endSource = display.end ?? display.start`, which is why one click commits
one day. The new signature keeps the file's existing positional style (`reduce(state, click,
maxDays?)`):

```ts
export const toCommit = (state: RangeFsmState, maxDays?: number, today: Date = new Date()): TimeRange | null
```

For a `single(A)` state the end is `min(today, A + (maxDays − 1) days)`; with no `maxDays` it is
`today`. `interval` and `empty` are unchanged, and `toDisplayRange` and `hydrate` are not touched.
`today` is a parameter so the function stays deterministic under test
(`.claude/rules/utils.md` §2); the default reads the clock only at the single call site,
`RangePicker.handleDayClick`, which now passes `maxDays`.

### Why clamp, rather than refuse or disable days

The capped surfaces (`UsageLog`, and any future consumer of `telemetryMaxRangeMs`) are the only ones
where widening can produce an illegal range. Three options were on the table:

- **Clamp to `A + (maxDays − 1)` — chosen.** The clamped end is exactly the last day the calendar
  still draws as within reach of `A`: `RangePicker.dayClassName` dims everything beyond
  `maxDays − 1` from the anchor while state is `single`, so the committed end lands on the visible
  edge of the reach rather than somewhere the user cannot see. It is also monotone — the moment the
  cap allows reaching today, the clamp is a no-op — and the resulting pair is shown as text in the
  Custom row before Apply.
- **Refuse: keep the old same-day commit when widening would exceed the cap.** Rejected: the same
  gesture would then mean two different things depending on a backend-supplied number the user
  cannot see, and the Custom row would show a one-day pair while the calendar dims two more days as
  reachable.
- **Disable start days older than `maxDays − 1` before today.** Rejected as a real regression: a
  capped surface legitimately lets a user pick an old *pair* (with `maxDays = 3`, some three days
  last month), and disabling old start days removes that.

### Why the same-day click had to change too

Files: same as above.

Widening a single click to "through today" removes the only gesture that produced one day — and
`reduce`'s `single` branch currently treats a second click on the same day as a **no-op**
(`range-fsm.ts:39-42`, asserted by `range-fsm.spec.ts` "single(A) + click same day → no-op"). So
after the widening no gesture at all would yield a one-day range. Dropping that early return makes
`single(A) + click A → interval(A, A)`, which commits `A → A`: single-day selection stays reachable
in two clicks, and the change is consistent with the requirement's existing text ("all clicks from
single state SHALL form an interval"), since `delta === 0` already satisfies `delta ≤ maxDays − 1`.
Clicking a third time hits the `interval` endpoint rule and collapses back to `single(A)`, so the
gesture simply toggles between "that day" and "that day → today".

### Tests that this breaks and must be re-expressed

Read before editing; each of these currently asserts the old behaviour:

- `range-fsm.spec.ts` — "single(A) + click same day → no-op" (now an interval) and
  "single → { start: D 00:00:00, end: D 23:59:59.999 }" (now ends today, or at the clamp).
- `RangePicker.spec.tsx` — "clicking beyond reach resets the anchor to a single day",
  "clicking an interval endpoint collapses to a single day" and "clicking outside an interval
  collapses to a single day" all assert `endDate.getDate() === startDate.getDate()` after landing in
  `single` state with `maxDays = 3`; each now commits the clamped end (`start + 2 days`). Their
  fixtures use dates in March 2026 while the suite's "today" is the real system date, so the clamp —
  not `today` — is what those three assertions become.
- `RangePicker.spec.tsx` "first click on empty calendar emits a single-day range" has a stale comment
  about the same-day no-op but does not exercise it; the assertion (`end ≥ start`) still holds.
- `TimeFilter.spec.tsx` "Apply commits the selected range with isCustom=true" and "Cancel does not
  commit" assert only that a range was passed, so they survive unchanged.

### Known cosmetic mismatch (recorded, not fixed)

`toDisplayRange(single)` still returns `{ start, end: null }`, so after one click the calendar
highlights only the anchor while the committed range reaches today. Changing the display would
change what the *next* click means (the FSM's `single` state is what makes a second click form an
interval), so the display is left alone; the Custom row's start–end text is the observable
confirmation of what will commit. If a later design wants the highlight to match, it needs a
display-only "provisional end" concept rather than a change to the FSM state.

---

## §3 Building the entity-scoped option list

Files: `src/utils/time-filter/since-creation-option.ts` (new),
`src/components/ActivityAudit/List/List.tsx`, `src/constants/i18n.ts`, `src/locales/en.ts`.

One pure, entity-free helper — it takes the timestamp and the already-translated label, so it needs
neither a domain model nor `t()`:

```ts
// src/utils/time-filter/since-creation-option.ts
export const getTimeFilterOptions = (
  createdAt: string | undefined,
  sinceCreationLabel: string,
): TimeFilterOption[] =>
  /* toDateOrNull(createdAt) === null
       ? timePeriodOptionsConfig
       : [...timePeriodOptionsConfig, { value: SINCE_CREATION_PERIOD_ID, label, startDate }] */
```

Returning the shared array unchanged when there is no usable timestamp is what makes three of the
spec's absence scenarios true by construction: the global list passes `entity?.createdAt ===
undefined`, and an unparseable value takes the same branch. There is no disabled row and no tooltip —
`TimeFilter` has no disabled-preset pattern, and inventing one for this edge is out of scope
(proposal Non-goals).

`ActivityAuditList` memoises the list on `[entity, t]` and uses it in three places, all of which must
be the *same* list:

1. `useTimeFilter({ defaultTimeFilter, onTimeFilterChange, timePeriodOptions })`
2. `<TimeFilter timePeriodOptions={…} />` (both mount sites in that file — the entity branch and the
   global branch; passing it in both is harmless and keeps the two calls identical)
3. the datasource's own `getTimeRangeById(timePeriod || '', timeFilterOptions)` at `List.tsx:204`,
   with the memoised list added to the `gridDataSource` `useMemo` dependency array — otherwise a
   refresh after an entity change would resolve against a stale list.

i18n: `TelemetryI18nKey.SinceCreation = 'Telemetry.SinceCreation'` next to
`Custom = 'Telemetry.Custom'` (`constants/i18n.ts:742`), and `SinceCreation: 'Since Creation'` in the
`Telemetry` block of `locales/en.ts`. Component tests assert the **key**, not the English text
(`test-setup.tsx`'s `t()` is identity).

### Why `TimeFilter`'s existing `timePeriodOptions` prop is the right seam

`TimeFilter` already declares `timePeriodOptions?: TimePeriodOption[]` and already falls back to the
shared config through `getTimePeriodOptionsByMaxMs(timePeriodOptions, maxRangeMs)`. Only its **type**
widens to `TimeFilterOption[]`; the label lookup (`options.find(o => o.value === timePeriod)?.label`)
and the rendering loop read `value` and `label` only, so they need no change. This is the house rule
"no new props on `Common/*` to fit one caller" satisfied by an existing prop that had no caller yet.

`getTimePeriodOptionsByMaxMs` gains one rule: with a cap set, drop options that carry no finite
offset (`'offset' in opt && opt.offset <= maxRangeMs`). No consumer sets both today, and that is the
point — the mechanism refuses to offer an unbounded option on a capped surface rather than relying on
a caller's discipline.

---

## §4 Keeping the option id out of the sibling Audit sub-tabs

Files: `src/utils/time-filter/sharable-time-filter.ts` (new),
`src/components/EntityTabs/Audit/EntityAudit.tsx`.

`EntityAudit` holds **one** `timeFilter` state for all four sub-tabs and passes it to each as
`defaultTimeFilter` (`EntityAudit.tsx:33`, `:50`, `:54`, `:63`, `:72`). Left alone, selecting
`Since Creation` on Activities stores `'since-creation'` there, and switching to Traces mounts
`UsageLog` with an id its option list cannot resolve: `getTimeRangeById` falls through to
`offset ?? 0`, producing an empty `now → now` range, and `TimeFilter`'s trigger falls back to
`?? timePeriod`, printing the raw id. Both are user-visible.

The guard is one pure function and one line in `EntityAudit`:

```ts
// src/utils/time-filter/sharable-time-filter.ts
// A period id only one surface's option list can resolve must not travel to a sibling tab.
export const getSharableTimeFilter = (value: TimeFilterValue): TimeFilterValue => /* … */;
```

It returns the value unchanged for a `TimeRange` (every tab understands a custom range) or for an id
present in `timePeriodOptionsConfig`, and `DEFAULT_TIME_PERIOD` otherwise. `EntityAudit` computes it
once and hands it to `Dashboard` and both `UsageLog` instances, while the **Activities** tab keeps the
raw `timeFilter` — so returning to Activities restores `Since Creation`, which is the behaviour the
spec asks for.

Deliberately generic: it knows nothing about `Since Creation`, so any future surface-local option is
covered without touching this file again.

### Alternative rejected

**Report the resolved `TimeRange` upward instead of the id** (translate on the way out of
`useTimeFilter`, so siblings inherit `createdAt → now` as a custom range). It preserves the user's
window across tabs, which is nicer, but it costs more than it buys: the translation has to live
inside `useTimeFilter` (the hook, not the component, calls `onTimeFilterChange`), it sets sibling tabs
to `isCustom` with a frozen end, and returning to Activities would show a date pair rather than
`Since Creation`. The chosen guard keeps generic code generic and keeps the option's meaning on the
one surface that owns it.

---

## §5 Risks — what could be wrong here, and where it shows first

1. **The clamp is the least-exercised path.** No consumer both sets `maxRangeMs` and can be relied on
   to have retention configured locally (`telemetryMaxRangeMs` is frequently `null` on a dev
   install), so the clamp is unit-tested and never browser-checked. If it is wrong, it shows up as a
   `UsageLog` custom range that exceeds retention and returns a backend error — not as a visibly
   broken calendar. The unit test in `range-fsm.spec.ts` is the only guard; keep it explicit about
   the boundary (`delta === maxDays − 1` exactly, and one day beyond).
2. **`createdAt` may not be populated on every entity the Audit tab serves.** `InfoHeader` proves it
   is present for entity detail pages, but the option's absence path is the fallback for anything
   older or leaner. First symptom: the option simply never appears for some entity type — which is
   indistinguishable, from the UI, from a wiring bug in §3. Anyone debugging that should check
   `entity.createdAt` on the payload before touching the option builder.
3. **`List.spec.tsx` mocks both `useTimeFilter` and `TimeFilter`** (lines 29-44), so no current test
   sees the wiring in §3 at all. Task 3.5 has to make the `TimeFilter` mock capture its props; if it
   is left as-is, the whole option-list path can be silently unwired and every test still passes.
   This is the change's biggest blind spot and the reason `Option offered…` and `Selecting Since
   Creation…` are also checked in a browser.
4. **The widening reaches `UsageLog` by design.** If that turns out to be unwanted, the reversal is
   not a prop on the shared control (explicitly rejected by EM); it is a change to this spec's
   requirement, which states the rule once for every consumer.
5. **A same-day interval hydrates as `single`.** `hydrate` maps an `A → A` range back to `single(A)`,
   so reopening a one-day custom range and clicking Apply *without touching the calendar* commits the
   unchanged draft (`TimeFilter` keeps the committed range in `draft`, and `RangePicker` emits nothing
   until a click) — no silent widening. Verified by reading `TimeFilter.handleCustomClick`; if that
   ever changes to derive the draft from the FSM instead of from props, this becomes a real
   widening-on-Apply bug.
6. **Scenario count vs. PR size.** Sixteen scenarios over ten implementation tasks; the two largest
   files touched are `List.tsx` (one `useMemo` and one dep array) and the three spec files in 3.5. If
   3.5 grows past a reviewable diff, split it by spec file rather than dropping assertions.
