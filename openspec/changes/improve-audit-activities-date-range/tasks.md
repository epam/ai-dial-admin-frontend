# Tasks — improve-audit-activities-date-range

Design context: `design.md` §1 is the decision every other section depends on — read it plus the
section that names your files. Paths below are relative to `apps/ai-dial-admin/`.

Test commands are written in their cheap form on purpose: run them from `apps/ai-dial-admin/` so the
`@/` alias resolves, and never re-run with a louder reporter — `--reporter=dot` already prints every
failure in full.

## 1. Single-date commit rule in the shared range picker

- [x] 1.1 In `src/components/Common/RangePicker/range-fsm.ts`: remove the `delta === 0` no-op branch
  in `reduce`'s `single` case so a second click on the selected day yields
  `{ kind: 'interval', anchor: A, latest: A }`; change `toCommit` to
  `toCommit(state, maxDays?, today: Date = new Date())`, where a `single(A)` state commits
  `A 00:00:00.000` → `min(today, A + (maxDays − 1) days) 23:59:59.999` and the `interval` and `empty`
  cases are unchanged. Do not touch `toDisplayRange` or `hydrate`. Pass `maxDays` at the one call
  site, `handleDayClick` in `src/components/Common/RangePicker/RangePicker.tsx`. See `design.md` §2
  for why the clamp and not a refusal, and why the same-day click had to change.
- [x] 1.2 Update and extend the unit tests. In
  `src/components/Common/RangePicker/range-fsm.spec.ts`, re-express `single(A) + click same day →
  no-op` and `single → { start: D 00:00:00, end: D 23:59:59.999 }`, and add cases for: single
  commits through today with no `maxDays`; single clamped when `today − A > maxDays − 1`; no clamp
  when `today − A === maxDays − 1` exactly; a click on `today` commits today only; an interval
  commits exactly its two dates. In `src/components/Common/RangePicker/RangePicker.spec.tsx`,
  re-express the three tests that assert `endDate.getDate() === startDate.getDate()` after landing in
  `single` state (`clicking beyond reach…`, `clicking an interval endpoint…`, `clicking outside an
  interval…`) — with `maxDays = 3` each now commits `start + 2 days`. Verify
  `npx vitest run src/components/Common/RangePicker/range-fsm.spec.ts src/components/Common/RangePicker/RangePicker.spec.tsx --reporter=dot`.

## 2. Anchored period options and the resolution path

- [x] 2.1 In `src/constants/global-time-filter.ts`: add `AnchoredTimePeriodOption`
  (`value`, `label`, `startDate: Date`), the union `TimeFilterOption`, and
  `SINCE_CREATION_PERIOD_ID = 'since-creation'`. Leave `TimePeriodOption` and
  `timePeriodOptionsConfig` exactly as they are. Widen `getTimePeriodOptionsByMaxMs` to
  `TimeFilterOption[]` and make it drop options with no finite offset when `maxRangeMs` is set. See
  `design.md` §1 for the shape and the four alternatives rejected.
- [x] 2.2 In `src/utils/time-filter/get-time-range-id.ts`: add a second parameter
  `options: TimeFilterOption[] = timePeriodOptionsConfig`; an anchored option resolves to
  `{ startDate: new Date(option.startDate), endDate: now }` (a fresh `Date`, never the option's own),
  a sliding option keeps today's `now − offset` behaviour, and an unknown id keeps today's
  `now → now` fallback. In `src/hooks/use-time-filter.ts`: add `timePeriodOptions?: TimeFilterOption[]`
  to `UseTimeFilterOptions` and thread it into all three `getTimeRangeById` calls (initial
  `useState`, `getCurrentTimeRange`, `onTimePeriodChange`).
- [x] 2.3 Add two pure helpers. `src/utils/time-filter/since-creation-option.ts`:
  `getTimeFilterOptions(createdAt: string | undefined, sinceCreationLabel: string)` returns
  `timePeriodOptionsConfig` unchanged when `toDateOrNull(createdAt)` (from
  `src/utils/formatting/date.ts`) is `null`, otherwise the shared list plus one anchored option.
  `src/utils/time-filter/sharable-time-filter.ts`: `getSharableTimeFilter(value: TimeFilterValue)`
  returns the value for a `TimeRange` or for an id present in `timePeriodOptionsConfig`, and
  `DEFAULT_TIME_PERIOD` otherwise. Neither helper may import a domain model or `t()`. See
  `design.md` §3 and §4.
- [x] 2.4 Unit-test 2.1–2.3. Extend `src/constants/tests/global-time-filter.spec.ts` (anchored option
  dropped under a cap, kept with no cap) and `src/utils/time-filter/tests/get-time-range-id.spec.ts`
  (anchored resolution under `vi.useFakeTimers`, returned `startDate` not identical to the option's
  own, default parameter unchanged for existing ids). Add
  `src/utils/time-filter/tests/since-creation-option.spec.ts` (ISO string, numeric-millisecond
  string, `undefined`, empty string, unparseable string) and
  `src/utils/time-filter/tests/sharable-time-filter.spec.ts` (`TimeRange`, known id, unknown id).
  Add `src/hooks/tests/use-time-filter.spec.ts` covering initialisation from an anchored id and
  `onTimePeriodChange` resolving one. Verify
  `npx vitest run src/constants/tests/global-time-filter.spec.ts src/utils/time-filter/tests --reporter=dot`
  and `npx vitest run src/hooks/tests/use-time-filter.spec.ts --reporter=dot`.

## 3. Wiring the Activities list and the Audit tab

- [x] 3.1 Add `SinceCreation = 'Telemetry.SinceCreation'` to `TelemetryI18nKey` in
  `src/constants/i18n.ts`, immediately after `Custom = 'Telemetry.Custom'`, and
  `SinceCreation: 'Since Creation',` to the `Telemetry` block of `src/locales/en.ts`, immediately
  after `Custom: 'Custom',`. Nothing else in either file.
- [x] 3.2 In `src/components/Common/TimeFilter/TimeFilter.tsx`: widen the `timePeriodOptions` prop to
  `TimeFilterOption[]`. The preset loop and the trigger-label lookup read `value` and `label` only,
  so they need no change — confirm that rather than rewriting them.
- [x] 3.3 In `src/components/ActivityAudit/List/List.tsx`: memoise
  `getTimeFilterOptions(entity?.createdAt, t(TelemetryI18nKey.SinceCreation))` on `[entity, t]`, pass
  it to `useTimeFilter` as `timePeriodOptions`, pass it to **both** `TimeFilter` mount sites, pass it
  as the second argument of the datasource's `getTimeRangeById(timePeriod || '', …)` call (line 204)
  and add it to the `gridDataSource` `useMemo` dependency array. No other behaviour of the list
  changes. `design.md` §3 lists all four call sites and §5.3 the blind spot in the existing spec.
- [x] 3.4 In `src/components/EntityTabs/Audit/EntityAudit.tsx`: compute
  `getSharableTimeFilter(timeFilter)` once and pass it as `defaultTimeFilter` to `Dashboard` and to
  both `UsageLog` instances; the Activities branch keeps the raw `timeFilter` so returning to it
  restores the selection.
- [x] 3.5 Component tests. In `src/components/Common/TimeFilter/TimeFilter.spec.tsx`: an anchored
  option renders in the preset list and its label shows in the trigger when selected; it is absent
  when `maxRangeMs` is set. In `src/components/ActivityAudit/List/tests/List.spec.tsx`: change the
  `TimeFilter` mock (lines 39-44) to capture its props so the option list can be asserted — present
  with an entity carrying `createdAt`, absent for an entity without one and absent with no entity —
  and assert the activity request's time-range filters when the anchored id is the selected period.
  In `src/components/EntityTabs/Audit/tests/EntityAudit.spec.tsx`: add prop spies for `Dashboard` and
  `UsageLog` and assert they receive `DEFAULT_TIME_PERIOD` — not the anchored id — while Activities
  receives the raw value. Verify
  `npx vitest run src/components/Common/TimeFilter/TimeFilter.spec.tsx src/components/ActivityAudit/List/tests/List.spec.tsx src/components/EntityTabs/Audit/tests/EntityAudit.spec.tsx --reporter=dot`.

## 4. Browser verification

- [ ] 4.1 Run the `spec-browser-verify` skill against the local app (`http://localhost:4200` —
  `npm start` is `nx serve ai-dial-admin`, which listens on 4200, not 3000) for exactly four
  scenarios: `Single date commits through the end of today`,
  `Option offered when the entity carries a creation timestamp`,
  `Selecting Since Creation lists activity from the creation timestamp to now` and
  `Since Creation does not travel to a sibling Audit sub-tab`. Every other scenario is covered by the
  unit tests in 1.2, 2.4 and 3.5 and is deliberately not sent to the browser: the four chosen ones are
  the only ones that cross a boundary the unit tests mock away (a real entity payload's `createdAt`, a
  real activity request, and a real tab switch that mounts `UsageLog`). Prefer `browser_evaluate`
  returning just the asserted values over `browser_snapshot`; a snapshot of the audit grid is
  thousands of tokens. Resolve any `fail` verdict before 5.1.

## 5. Quality checks

- [x] 5.1 From `apps/ai-dial-admin/`: `npm run lint 2>&1 | tail -30` (111 warnings pre-exist — compare,
  do not aim for zero), `npm run format`, `npx tsc -p tsconfig.app.json --noEmit` (this gate is green
  on `development` and blocking in CI, so any error here is this change's), and
  `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary`. Report the output;
  anything to fix comes back as a new task for the role that owns the file, not as an edit from here.
