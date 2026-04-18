## Context

`AUDIT_MAX_RANGE_DAYS` is read at SSR time in `app/[lang]/layout.tsx` and flows through `AppContextProvider` as `auditMaxRangeDays?: number`. Four consumers read it: `UsageLog`, `Telemetry/Dashboard` (indirectly, via `useTimePeriodOptions`), `Telemetry/TelemetryControls`, and `ActivityAudit/List`. Three of those consume influx-backed telemetry (`GET /api/v1/metrics/datasets/dial_analytics_realtime/data`); the fourth consumes a separate revisions store (`GET /history/revisions`).

Meanwhile, the backend already exposes `GET /api/v1/metrics/datasets` returning `DatasetInfo[]` with `{ name, maxTimeRangeMs }` — the influx retention cap per dataset. A client hook `useTimePeriodOptions` already fetches this on mount and narrows the preset list for `UsageLog` and `Dashboard`, but does not cap `RangePicker.maxDays`. The two pathways (env var + client hook) therefore duplicate intent for telemetry consumers and leave `RangePicker` coverage inconsistent.

Today's prop/state flow:

```
process.env.AUDIT_MAX_RANGE_DAYS ──► AppContext.auditMaxRangeDays ──► TimeFilter.maxRangeDays
                                                                      ├─ getTimePeriodOptionsByMaxDays (days)
                                                                      └─ RangePicker.maxDays (days)

GET /api/v1/metrics/datasets ──► useTimePeriodOptions (client) ──► TimeFilter.timePeriodOptions (pre-filtered, ms-keyed)
```

After the change:

```
SSR telemetryApi.getDatasets(token) ──► dial_analytics_realtime.maxTimeRangeMs
                                         │
                                         ▼
                      AppContext.telemetryMaxRangeMs ──► TimeFilter.maxRangeMs
                                                         ├─ getTimePeriodOptionsByMaxMs
                                                         └─ RangePicker.maxDays  (converted at boundary)

ActivityAudit/List ──► TimeFilter without maxRangeMs prop (no cap)
```

## Goals / Non-Goals

**Goals:**
- Single source of truth for telemetry time-range cap: the backend `DatasetInfo.maxTimeRangeMs` value for the `dial_analytics_realtime` dataset.
- Preserve synchronous (SSR) availability of the cap so `RangePicker` never renders uncapped during the window before a client fetch resolves.
- Keep ms as the canonical unit across context and props; convert to days only at the `RangePicker` boundary (which inherently operates in calendar-day units for the FSM).
- Remove the cap from `ActivityAudit/List`, which queries an unrelated revisions store.
- Delete redundant client-side pathway (`useTimePeriodOptions` hook).

**Non-Goals:**
- No operator-side override mechanism. The backend value is authoritative.
- No per-dataset or per-consumer cap configuration. The dataset name (`dial_analytics_realtime`) stays hardcoded in one place.
- No fallback logic for a failed `/metrics/datasets` call — if the backend is unreachable at SSR, other SSR calls in the same layout (`themesApi`, `utilityApi`) would fail first; no additional handling is required here.
- No changes to the `RangePicker` FSM semantics or to `TimeFilter` layout.

## Decisions

### Decision 1: SSR fetch in `app/[lang]/layout.tsx`, not a new server action
Reuse `telemetryApi.getDatasets(token)` directly in the layout server component — the same pattern already used for `themesApi.getThemesConfiguration()`, `utilityApi.getBeVersion()`, and `utilityApi.getUserInfo()`. Compose with a pure util `extractTelemetryMaxRangeMs(res)` that checks success, validates the array shape, looks up `dial_analytics_realtime`, and returns `maxTimeRangeMs` (or `undefined`). Pass the result to `AppContextProvider` as `telemetryMaxRangeMs`.

**Rationale**: Keeps the synchronous contract the env var provides; avoids introducing a client-side fetch on every telemetry/usage page; the util is pure, testable in isolation, and lives next to other telemetry utils. The API class stays thin — `getDatasets` is a one-line passthrough to `this.getAction`, no domain logic.

**Alternatives considered**:
- *API method wrapper (`getTelemetryMaxRangeMs` on `TelemetryApi`)*: Encapsulates fetch + extraction in one call, but the name suggests a dedicated backend endpoint that doesn't exist. Mixes transport with domain extraction. Rejected in favor of thin-API + pure-util split.
- *Dedicated server action wrapping `getDatasets` for client callers*: Orphaned once `useTimePeriodOptions` is deleted; no live caller left. Rejected — delete rather than keep dead code.
- *Keep `useTimePeriodOptions` and migrate to API-only (no env var)*: Preserves client fetch latency and the `RangePicker` uncapped-window issue. Rejected.

### Decision 1a: Shared constants live in `src/constants/`
- `TELEMETRY_DATASET_NAME = 'dial_analytics_realtime'` goes in `src/constants/telemetry.tsx` alongside the other telemetry constants, and is imported by `server/telemetry-api.ts` (for `DASHBOARD_URL` construction) and `utils/telemetry.ts` (for the extractor).
- `MS_PER_DAY` goes in `src/constants/global-time-filter.ts` alongside `timePeriodOptionsConfig`, and is imported by `range-fsm.ts`, `TimeFilter.tsx`, and `TimeFilter.spec.tsx` (replacing three prior inline duplicates).

**Rationale**: Matches the repo convention — plain value constants belong under `src/constants/` by topic. Single source of truth for the dataset identifier and the day/ms conversion factor.

### Decision 2: ms as the canonical unit in context and `TimeFilter`
Rename `AppContext.auditMaxRangeDays: number` → `telemetryMaxRangeMs: number`. Add a ms-keyed equivalent (`getTimePeriodOptionsByMaxMs`) in `src/constants/global-time-filter.ts` and remove `getTimePeriodOptionsByMaxDays`. `TimeFilter` accepts `maxRangeMs?: number`; it divides by `MS_PER_DAY` (using `Math.floor`) at the `RangePicker.maxDays` boundary.

**Rationale**: The backend returns ms; keeping ms avoids repeated day ↔ ms conversions and conversion-direction mistakes. `RangePicker` is the only consumer that needs calendar days (its FSM operates in `|X − A|` day deltas), so the conversion lives at that single boundary.

**Alternatives considered**:
- *Keep days in context*: Requires dividing by `MS_PER_DAY` at the layout boundary, then multiplying back to ms in the preset-filter helper. Asymmetric and loses precision on non-integer day values. Rejected.

### Decision 3: Delete `useTimePeriodOptions` hook
Once `AppContext.telemetryMaxRangeMs` is populated synchronously, the preset-filter work collapses into `TimeFilter` itself via `getTimePeriodOptionsByMaxMs(timePeriodOptionsConfig, maxRangeMs)`. No client-side effect is needed. `UsageLog` and `Telemetry/Dashboard` consume the same context field as everyone else and pass it to `TimeFilter`.

**Rationale**: Removes duplicated logic; removes client-side round-trip; aligns all four telemetry consumers on one data flow.

### Decision 4: `ActivityAudit/List` drops the cap entirely
Remove `auditMaxRangeDays`/`maxRangeDays` references from `ActivityAudit/List/List.tsx`. The `/history/revisions` endpoint has no retention-based cap; no product requirement mandates a UI-only cap for it; keeping one would require inventing a new config source and re-introduce divergence from real backend state.

**Rationale**: The old name ("audit") and the old consumer mapping were the misalignment. Telemetry gets the backend-driven cap; audit gets no cap.

### Decision 5: `Math.floor(ms / MS_PER_DAY)` for `maxDays`
The `RangePicker` FSM interprets `maxDays` as an inclusive calendar-day reach. A dataset retention like `7.5 days` in ms should surface as `maxDays = 7` (cannot span a window larger than retention). Floor is the safe rounding direction.

## Risks / Trade-offs

- **Preset list may render narrower immediately on load** → On consumers that previously loaded with the default full list until `useTimePeriodOptions` resolved, the preset list is now correctly narrowed on first paint. This is an improvement, not a regression, but visually different. Mitigation: acceptable as-is; no special UX handling.
- **SSR failure of `telemetryApi.getDatasets`** → If the backend is unavailable at SSR, the overall layout render already fails on `themesApi`/`utilityApi`; `telemetryMaxRangeMs` would be `undefined`, which `TimeFilter` treats as uncapped. Mitigation: acceptable; matches current SSR failure semantics.
- **Operators with `AUDIT_MAX_RANGE_DAYS` set in deployment configs** → The env var is silently ignored after the change. Mitigation: release notes call out the removal; backend retention is the new configuration surface.
- **Hardcoded dataset name `dial_analytics_realtime`** → If the telemetry dataset is renamed, the cap derivation breaks silently (returns `undefined`). Mitigation: centralize the name in one server-side constant (`TELEMETRY_DATASET_NAME`) so a rename is a one-line change; the existing `DASHBOARD_URL` already bakes the name into its path, so both references can co-locate.
- **Dataset array not found** → If `getDatasets` responds successfully but the dataset is missing from the list, `telemetryMaxRangeMs` is `undefined` and the UI is uncapped. Mitigation: same as the "not set" scenario today — acceptable, no special handling.

## Migration Plan

1. Add `TELEMETRY_DATASET_NAME` constant in `src/constants/telemetry.tsx`; import into `src/server/telemetry-api.ts` for `DASHBOARD_URL`.
2. Add pure `extractTelemetryMaxRangeMs(res)` util in `src/utils/telemetry.ts` (imports the constant from `constants/telemetry`).
3. Add exported `MS_PER_DAY` in `src/constants/global-time-filter.ts`; replace inline copies in `range-fsm.ts`, `TimeFilter.tsx`, and `TimeFilter.spec.tsx` with imports.
4. Introduce `telemetryMaxRangeMs` in `AppContext` and update the provider.
5. Replace env-var read in `layout.tsx` with `extractTelemetryMaxRangeMs(await telemetryApi.getDatasets(token))`.
6. Rename `getTimePeriodOptionsByMaxDays` → `getTimePeriodOptionsByMaxMs`; update `TimeFilter` prop signature (`maxRangeDays` → `maxRangeMs`); convert to days only at the `RangePicker` boundary.
7. Swap consumers `UsageLog`, `Telemetry/Dashboard`, `Telemetry/TelemetryControls` to the new prop; remove `useTimePeriodOptions` import and call.
8. Delete `src/hooks/use-time-period-options.ts`.
9. Delete the orphaned `getDatasets()` server action in `src/app/[lang]/dashboard/actions.ts` + its test block; remove the `getDatasets` mock from `UsageLog.spec.tsx`.
10. Remove max-range wiring from `ActivityAudit/List/List.tsx` (including the now-unused `useAppContext` import).
11. Remove `AUDIT_MAX_RANGE_DAYS` documentation from `README.md` and `.env.template`.
12. Update tests: `TimeFilter.spec`, `telemetry-api.spec`, `telemetry.spec` (utils — new extractor cases), `global-time-filter.spec` (ms-keyed helper), and the UsageLog mock.
13. Rollback: revert the commit; the env var and client hook are additive on reverse.

## Open Questions

- None. Dataset name hardcoding and unit (ms) are confirmed. Operator migration is documented via release notes (out of scope for this change artifact).
