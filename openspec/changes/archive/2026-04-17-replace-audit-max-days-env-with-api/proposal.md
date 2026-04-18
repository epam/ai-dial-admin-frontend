## Why

The `AUDIT_MAX_RANGE_DAYS` env var caps time-range selection in several UI areas, but the backend already publishes the authoritative cap as `maxTimeRangeMs` in `GET /api/v1/metrics/datasets` (derived from influx retention config). The env var must be hand-synced with backend retention, is misnamed ("audit" — yet three of its four consumers are telemetry), and drives a cap on ActivityAudit which queries a separate revisions store that has no such retention. Two parallel pathways exist today: SSR env-driven `auditMaxRangeDays` and client-fetched `useTimePeriodOptions` — both attempt to solve the same problem for telemetry consumers.

## What Changes

- **BREAKING**: Remove the `AUDIT_MAX_RANGE_DAYS` env var and its `process.env` read in `app/[lang]/layout.tsx`. Also drop the entry from `README.md` and `.env.template`.
- **BREAKING**: Rename `AppContext.auditMaxRangeDays?: number` → `AppContext.telemetryMaxRangeMs?: number`. Source the value from a server-side `telemetryApi.getDatasets(token)` call in the layout and run the response through a pure util `extractTelemetryMaxRangeMs(res)` that looks up dataset `dial_analytics_realtime` (hardcoded constant). No dedicated API method wrapper — the layout composes `getDatasets` + util directly.
- Delete the `useTimePeriodOptions` client hook (redundant once the SSR path provides the same value synchronously).
- Delete the orphaned `getDatasets()` server action in `src/app/[lang]/dashboard/actions.ts` (only the deleted hook called it) and its test; remove the matching `getDatasets` mock in `UsageLog.spec.tsx`.
- Replace `getTimePeriodOptionsByMaxDays(maxDays, ...)` and the duplicate `getFilteredTimePeriodOptions` with a single ms-keyed `getTimePeriodOptionsByMaxMs(options, maxRangeMs?)`. `TimeFilter` accepts `maxRangeMs?: number` and converts to `maxDays` via `Math.floor(ms / MS_PER_DAY)` at the `RangePicker` boundary.
- Consolidate `MS_PER_DAY` into a single export from `src/constants/global-time-filter.ts`; remove inline duplicates in `range-fsm.ts`, `TimeFilter.tsx`, and `TimeFilter.spec.tsx`.
- Place the `TELEMETRY_DATASET_NAME = 'dial_analytics_realtime'` constant in `src/constants/telemetry.tsx` (not in the server API file); import into `telemetry-api.ts` (for `DASHBOARD_URL`) and `utils/telemetry.ts` (for the extractor).
- Wire the new `telemetryMaxRangeMs` value into `UsageLog`, `Telemetry/Dashboard`, and `Telemetry/TelemetryControls` (replacing the env-sourced prop + replacing the client hook).
- Remove the cap entirely from `ActivityAudit/List` — no `maxRangeDays`/`maxRangeMs` prop passed to `TimeFilter`; preset list remains unfiltered and `RangePicker` remains uncapped.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `custom-range-picker`: The "Configurable max range via environment variable" requirement is replaced with an API-sourced equivalent; the cap is scoped to telemetry consumers only, and ActivityAudit is explicitly not capped.

## Impact

- **Code**:
  - `apps/ai-dial-admin/src/app/[lang]/layout.tsx` — drop `process.env.AUDIT_MAX_RANGE_DAYS` read; compose `extractTelemetryMaxRangeMs(await telemetryApi.getDatasets(token))` and pass to `AppContextProvider`.
  - `apps/ai-dial-admin/src/context/AppContext.tsx` — rename field (`auditMaxRangeDays` → `telemetryMaxRangeMs`) and its type (number days → number ms).
  - `apps/ai-dial-admin/src/server/telemetry-api.ts` — `getDatasets(token)` is the thin passthrough; `DASHBOARD_URL` imports `TELEMETRY_DATASET_NAME` from `constants/telemetry`.
  - `apps/ai-dial-admin/src/utils/telemetry.ts` — add pure `extractTelemetryMaxRangeMs(res: ServerActionResponse): number | undefined` that checks success, validates the array shape, finds the dataset, returns `maxTimeRangeMs`.
  - `apps/ai-dial-admin/src/constants/telemetry.tsx` — add `TELEMETRY_DATASET_NAME = 'dial_analytics_realtime'`.
  - `apps/ai-dial-admin/src/constants/global-time-filter.ts` — add exported `MS_PER_DAY`; replace days-keyed helpers with single ms-keyed `getTimePeriodOptionsByMaxMs`.
  - `apps/ai-dial-admin/src/components/Common/TimeFilter/TimeFilter.tsx` — accept `maxRangeMs`, convert to `maxDays` via `Math.floor(ms / MS_PER_DAY)` at `RangePicker` boundary.
  - `apps/ai-dial-admin/src/components/Common/RangePicker/range-fsm.ts` — import shared `MS_PER_DAY`.
  - `apps/ai-dial-admin/src/components/UsageLog/UsageLog.tsx`, `Telemetry/Dashboard.tsx`, `Telemetry/TelemetryControls/TelemetryControls.tsx` — swap source from env context field to `telemetryMaxRangeMs`; remove `useTimePeriodOptions` usage.
  - `apps/ai-dial-admin/src/hooks/use-time-period-options.ts` — deleted.
  - `apps/ai-dial-admin/src/app/[lang]/dashboard/actions.ts` — delete orphaned `getDatasets()` action; update its test and the `UsageLog.spec.tsx` mock.
  - `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx` — drop `useAppContext` max-range reference and `maxRangeDays` prop on `TimeFilter`; drop now-unused import.
  - Corresponding test files (TimeFilter spec, utils telemetry spec, telemetry-api spec, global-time-filter spec) updated to the ms-based contract and new extractor.
- **Docs**: Remove `AUDIT_MAX_RANGE_DAYS` row from `README.md` and the commented entry in `.env.template`.
- **APIs**: Consumes existing `GET /api/v1/metrics/datasets` during SSR of the language layout. No new backend endpoints.
- **Operators**: `AUDIT_MAX_RANGE_DAYS` no longer read — operators relying on it must remove it from deployment config. The equivalent cap is now configured on the backend influx retention for `dial_analytics_realtime`.
- **Non-goals**:
  - No override mechanism is added; the backend value is authoritative.
  - Per-dataset or per-consumer caps are out of scope — a single hardcoded dataset drives the telemetry cap.
  - ActivityAudit retention-based capping is out of scope; this change explicitly removes any cap there.
