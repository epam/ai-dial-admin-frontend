## Why

DIAL Core's global settings gained a `rateLimitSchedule` field (`GlobalSettings` in ai-dial-core:
`timezone`, `weekStartDay`, `resetTime`) that anchors when the DAY/WEEK/MONTH calendar rate-limit
windows — the limits configured per role on the Roles entity — reset. Today the Admin console's
System Properties page round-trips the field untouched on save (it isn't even in the frontend
`GlobalSettings` type), so the only way to set it is editing the settings blob by hand. The page
needs a tab that exposes it as first-class controls.

## What Changes

- Add a **Rate Limit Schedule** tab to the System Properties page, alongside Global Interceptors
  (`EntityViewTab` value, `getSystemPropertiesTabs`, `TabsI18nKey`, locales).
- New feature component `components/SystemProperties/RateLimitSchedule.tsx` with three controls,
  all generation-1.0 ui-kit:
  - **Timezone** — searchable `DialSelect` over the full IANA list from
    `Intl.supportedValuesOf('timeZone')` (Core's `ValidTimezone` accepts exactly that set; fixed
    offsets like `+02:00` are rejected server-side because a schedule must survive DST).
  - **Week start day** — `DialSelect` over the seven `WeekDay` values (`Mon`..`Sun`).
  - **Reset time** — `DialInput` validated client-side against Core's
    `^([01][0-9]|2[0-3]):[0-5][0-9]$` so a save cannot 400.
- Extend `GlobalSettings` (`models/system-properties.ts`) with `rateLimitSchedule?` and a
  `RateLimitSchedule` model, following the same round-trip discipline as `retriableErrorCodes`.
- Untouched-vs-touched semantics: when the settings blob has no `rateLimitSchedule`, the tab
  *displays* Core's defaults (UTC / Monday / 00:00) but keeps the field `undefined` in state — the
  page never goes falsely dirty. Touching any control makes all three values explicit (identical
  semantics to omission for Core).
- All three controls disabled under `useIsReadOnlyAdmin()`, matching how the interceptors tab
  hides its mutating actions.
- Save/discard, etag handling, and the update notification flow are reused as-is from
  `SystemProperties.tsx` — no server-side changes beyond the model type (`settings-api.ts` already
  PUTs the whole settings object; `page.tsx` passes the response through unmodified).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `system-properties`: add requirements for the Rate Limit Schedule tab — rendering defaults when
  the field is absent, editing the three fields with client-side validation mirroring Core's
  constraints, read-only-admin disabled state, and preserving the "fields the page doesn't own
  survive a save" guarantee for the rest of the blob.

## Impact

- `apps/ai-dial-admin/src/models/system-properties.ts` — new `RateLimitSchedule` interface +
  optional field on `GlobalSettings`.
- `apps/ai-dial-admin/src/utils/tabs/utils.ts` (+ `tests/utils.spec.ts`) — new tab enum value,
  tab factory, updated `getSystemPropertiesTabs` expectation.
- `apps/ai-dial-admin/src/components/SystemProperties/SystemProperties.tsx` — tab branch +
  `changeRateLimitSchedule` callback (mirrors `changeInterceptors`).
- New `apps/ai-dial-admin/src/components/SystemProperties/RateLimitSchedule.tsx` (+ tests).
- `apps/ai-dial-admin/src/constants/i18n.ts` + `src/locales/*.ts` — tab label, field labels,
  description hint, validation error text.
- Backend contract: DIAL Core `v1/settings/platform/global` singleton (already wired in
  `src/server/core/settings-api.ts`); field shape and validation defined by ai-dial-core's
  `GlobalSettings` / `RateLimitSchedule` / `ValidTimezone` (see `docs/open_api_core.yaml`).
  No backend change required.
- Existing spec behavior preserved: first-ever-save (no `If-Match`), `If-Match: *` once the blob
  exists, non-404 read-failure warning — untouched.

## Non-goals

- No editing of `retriableErrorCodes` — it stays round-trip-only.
- No changes to the per-role rate limits UI (Roles entity) that this schedule anchors.
- No adoption of 2.0 ui-kit components (`Calendar` time/weekday modes were considered and
  declined — the app is on the 1.0 generation throughout).
- No change to etag/concurrency handling or the settings read/write API layer.
- No timezone "current offset" display or DST preview — plain id list + search only.
