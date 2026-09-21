## 1. Model and constants

- [x] 1.1 Add `RateLimitSchedule` interface and `WeekDay` enum (`Mon`..`Sun`), plus optional
  `rateLimitSchedule?: RateLimitSchedule` on `GlobalSettings` (commented like
  `retriableErrorCodes`: absent = Core defaults, preserved on save) in
  `apps/ai-dial-admin/src/models/system-properties.ts`
- [x] 1.2 Create `apps/ai-dial-admin/src/components/SystemProperties/constants.ts` with
  `DEFAULT_RATE_LIMIT_SCHEDULE` (`UTC` / `Mon` / `00:00`) and the Core-mirroring reset-time regex
  `^([01][0-9]|2[0-3]):[0-5][0-9]$`

## 2. Validation util

- [x] 2.1 Create `isRateLimitScheduleValid(schedule)` in
  `apps/ai-dial-admin/src/components/SystemProperties/utils/` (pure: valid three-field object →
  true; undefined → true; invalid/missing fields → false)
- [x] 2.2 Unit tests for it in the co-located `tests/` — positive cases, each invalid field
  (bad reset time, non-IANA timezone, unknown week day), undefined/absent-field fallbacks

## 3. Tab wiring

- [x] 3.1 Add `EntityViewTab.RateLimitSchedule` and `rateLimitScheduleTab(t)` to
  `apps/ai-dial-admin/src/utils/tabs/utils.ts`, appended in `getSystemPropertiesTabs`; update the
  expectation in `src/utils/tabs/tests/utils.spec.ts:423`
- [x] 3.2 Add i18n keys — `TabsI18nKey.RateLimitSchedule` and a new `SystemPropertiesI18nKey` group
  (field labels, anchoring description hint, reset-time validation message) in
  `apps/ai-dial-admin/src/constants/i18n.ts`, with entries in every `src/locales/*.ts`
- [x] 3.3 In `apps/ai-dial-admin/src/components/SystemProperties/SystemProperties.tsx`: add the
  `changeRateLimitSchedule` callback (mirrors `changeInterceptors`), the tab content branch, and
  dispatch `ValidationActionType.Reset` on save success; Save's disabled state comes from
  `SaveValidationContext` — `RateLimitSchedule.tsx` reports field validity (D3) and
  `ChangedEntityButtons` consumes `isValid` directly (`disableSave ?? !isValid`), so no
  `Header`/page wiring is needed

## 4. Rate Limit Schedule component

- [x] 4.1 Create `apps/ai-dial-admin/src/components/SystemProperties/RateLimitSchedule.tsx`:
  searchable `DialSelect` over `Intl.supportedValuesOf('timeZone')` (memoized), `DialSelect` for
  week start day, `DialInput` for reset time with invalid styling + error caption; displays
  `DEFAULT_RATE_LIMIT_SCHEDULE` values when the schedule is undefined without writing them to
  state; all controls disabled via `useIsReadOnlyAdmin()`
- [x] 4.2 Component tests in co-located `tests/` (role/accessible-name queries per testing.md):
  stored schedule reflected in controls; absent schedule shows defaults with no unsaved-changes
  state; timezone search filters the IANA list; invalid reset time shows the error and disables
  Save; read-only admin disables all three controls; discard restores read values

## 5. Quality gates

- [x] 5.1 Run `npm run lint` and `npm run format` from the repo root; fix any findings
- [x] 5.2 Run `npm run typecheck` and `npm run typecheck:specs`; both must be at zero
- [x] 5.3 Run the full suite from `apps/ai-dial-admin/` (`npm run test`); all green

No `spec-browser-verify` task: the user declined it on 2026-09-21; the browser-observable
scenarios are covered by the component tests in 4.2 instead.
