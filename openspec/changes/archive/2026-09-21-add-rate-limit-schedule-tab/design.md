## Context

The System Properties page (`components/SystemProperties/SystemProperties.tsx`) edits DIAL Core's
global-settings singleton (`v1/settings/platform/global`, wired in `server/core/settings-api.ts`)
through one tab today: Global Interceptors. `isChanged` is `isEqual(currentSettings, globalSettings)`
over the whole blob, and the page's save flow (etag-on-existence, update notification, router
refresh) is shared by every field on it.

Core's `GlobalSettings` (ai-dial-core) now carries `rateLimitSchedule: { timezone, weekStartDay,
resetTime }` — the deployment-wide anchor for the DAY/WEEK/MONTH calendar rate-limit windows
configured per role. Core validates: timezone must be a real IANA region id (`ValidTimezone` —
fixed offsets rejected so the schedule survives DST), `resetTime` must match
`^([01][0-9]|2[0-3]):[0-5][0-9]$`, `weekStartDay` is the `Mon`..`Sun` enum. Omission ≡
`UTC / Mon / 00:00`. An older Core ignores the field entirely (`@JsonIgnoreProperties`).

## Goals / Non-Goals

**Goals:**

- A Rate Limit Schedule tab on the System Properties page with controls for all three fields.
- Client-side validation that mirrors Core's, so a save cannot 400.
- No false dirty state when the blob simply lacks the field.
- Read-only admin parity with the interceptors tab.

**Non-Goals:**

- Editing `retriableErrorCodes` (stays round-trip-only), per-role rate limits (Roles entity),
  etag/read/write API changes, 2.0 ui-kit adoption, DST/offset preview of the chosen timezone.

## Decisions

### D1: 1.0 ui-kit controls

- **Timezone** — `DialSelect` with `searchable`, options from `Intl.supportedValuesOf('timeZone')`.
- **Week start day** — `DialSelect` over the seven `WeekDay` values.
- **Reset time** — `DialInput` with free-text `HH:mm` entry.

Alternative considered: the 2.0 `Calendar` component's `time` (masked HH:mm field) and `weekday`
(popover of weekday names) modes are a near-exact fit, but the app uses the 1.0 generation
throughout and this would be its first 2.0 adoption — declined to keep the change pattern-conformant.

### D2: Display defaults, materialize on touch

When `currentSettings.rateLimitSchedule` is `undefined`, the three controls *display* Core's
defaults (UTC / Monday / 00:00) but the field stays `undefined` in state. The first change to any
control writes a full object (`{ ...DEFAULT_RATE_LIMIT_SCHEDULE, ...changed }`), so the page never
goes dirty without user action. Alternative — normalizing defaults into state on load — rejected:
it makes `isEqual` report dirty on page open and needs a matching normalization of the original to
compensate. Consequence (accepted): once touched, all three values are explicit in the saved blob;
for Core that is semantically identical to omission, and "reset to defaults" in the UI means setting
the values back, not removing the field.

### D3: Validation via `SaveValidationContext`, reported by the field component

Only `resetTime` is free-text; timezone and week start day come from selects, so they are valid by
construction — but validity must still cover a blob hand-edited outside the API carrying an invalid
stored value. A pure util `isRateLimitScheduleValid(schedule)` in
`components/SystemProperties/utils/` (with the Core-mirroring regex in the feature `constants.ts`)
checks all three fields; `RateLimitSchedule.tsx` runs it on the effective schedule and reports the
result to `SaveValidationContext` (`SetField`/`RemoveField` in a `useEffect`, the idiom
`UpstreamEndpoints/Endpoint/Endpoint.tsx` uses). `ChangedEntityButtons` consumes
`useSaveValidationContext().isValid` directly — `disabled={disableSave ?? !isValid}`, the prop kept
as an explicit override for callers that pass it (`SimpleButtonsWrapper`,
`PublicationsButtonsWrapper`, `FolderInfoHeader`, `AssetChangedEntityButtons`). The page dispatches
`Reset` on a successful save, the `Toolsets/View/View.tsx` idiom. Every page rendering
`ChangedEntityButtons` mounts the provider (60+ entity pages, plus `Sidebar`/`ToolHeader`/
`TestCasesList`/`ListView/Evaluation/Header` mount their own), so the direct consumption is safe.

The original design derived `disableSave` in `SystemProperties.tsx` and passed it through `Header`
as a prop, rejecting `SaveValidationContext` on the belief the provider was not mounted on this
page — that was wrong: `system-properties/page.tsx` already mounts it. Switched to the context at
the user's request during apply (2026-09-21); `Header.tsx` needed no change at all. The input also
gets `invalid` styling plus an i18n'd error caption while the text fails the regex.

### D4: Model placement

`models/system-properties.ts` gains the `RateLimitSchedule` interface and a `WeekDay` enum
(`Mon = 'Mon'` … `Sun = 'Sun'` — value set as enum per code-standards), plus
`rateLimitSchedule?: RateLimitSchedule` on `GlobalSettings`, commented like `retriableErrorCodes`:
absent means Core defaults; the page preserves whatever the read returned on save.

### D5: Timezone list source

`Intl.supportedValuesOf('timeZone')`, memoized in the feature component, with `'UTC'` prepended:
ECMA-402 omits it from the supported list by design, while Core's `ZoneId.getAvailableZoneIds()`
(which `ValidTimezone` checks against) includes it — without the prepend, Core's own default
timezone would be invalid. The shared `SUPPORTED_TIMEZONES` export feeds both the select options
and the validation util, so the two can never drift. No fallback path: every targeted browser
(Chrome 93+, Firefox 94+, Safari 15.4+) and the Node ≥18 vitest environment support it, and a
degraded empty select would be worse than the rare old-browser failure. The component is
client-only, so SSR availability is irrelevant.

### D6: Tab wiring and i18n

`EntityViewTab.RateLimitSchedule` + `rateLimitScheduleTab(t)` appended in
`getSystemPropertiesTabs` (`utils/tabs/utils.ts`), a `changeRateLimitSchedule` callback in
`SystemProperties.tsx` mirroring `changeInterceptors`, and a new feature component
`components/SystemProperties/RateLimitSchedule.tsx` (props: the current schedule, an
`onChangeRateLimitSchedule`, and the read-only-disabled derivation stays inside via
`useIsReadOnlyAdmin()`). i18n: `TabsI18nKey.RateLimitSchedule` for the tab label; field labels,
description hint ("anchors the day/week/month rate-limit windows configured per role") and the
reset-time error text in a new `SystemPropertiesI18nKey` group — no existing shared group carries
weekday names or these labels (`EntityFields.week` is an unrelated period label).

## Risks / Trade-offs

- [Explicit defaults vs omitted field are indistinguishable in the saved blob] → semantically
  identical for Core; documented in D2; the UI offers no "clear schedule" action, so there is no
  way to accidentally unset it.
- [Blob hand-edited outside the API carries an invalid stored timezone/resetTime] → D3's full
  validation marks it invalid, Save is disabled until corrected; the controls still render the
  stored value rather than silently replacing it.
- [Timezone select is empty on an unsupported browser] → accepted (D5); targeted browsers all
  support `Intl.supportedValuesOf`.
- [Roles page shows rate-limit windows without mentioning this anchor] → out of scope; the tab's
  hint text states the relationship so the connection is discoverable from this side.

## Migration Plan

Single PR, no data migration. Deploys safely against an older Core (unknown field dropped on
write) and against a Core that already has the field (read passes it through `page.tsx` untouched;
the model type merely starts describing it). Rollback = revert the PR; no stored data references
frontend state.

## Open Questions

(none — the four design questions from exploration are settled in the proposal.)
