## 1. Model, constants and tab wiring

- [x] 1.1 In `apps/ai-dial-admin/src/models/system-properties.ts`, add `SpendingLimitMode` enum (`Off = 'off'`, `Shadow = 'shadow'`, `Enforce = 'enforce'`), `SpendingLimits` interface (`mode`, `defaultCostObject`), and optional `GlobalSettings.spendingLimits`
- [x] 1.2 In `apps/ai-dial-admin/src/components/SystemProperties/constants.ts`, add `DEFAULT_SPENDING_LIMITS` (`off` / `ORG`) and a `SPENDING_LIMIT_MODE_I18N_KEYS` map (label and helper-text keys per mode)
- [x] 1.3 In `apps/ai-dial-admin/src/utils/tabs/utils.ts`, add `EntityViewTab.SpendingLimits`, a `spendingLimitsTab` helper, and append it in `getSystemPropertiesTabs`
- [x] 1.4 In `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts`, add `TabsI18nKey.SpendingLimits` and the `SystemPropertiesI18nKey` entries (description with override note, mode and cost-object labels, per-mode helper text, enforce warning, cost-object invalid message), reusing shared keys where they exist

## 2. Spending Limits tab

- [x] 2.1 Create `apps/ai-dial-admin/src/components/SystemProperties/SpendingLimits.tsx` modelled on `RateLimitSchedule.tsx`: `Select` for mode, text input for default cost object, effective value from `spendingLimits ?? DEFAULT_SPENDING_LIMITS`, first edit writes both values, `useIsReadOnlyAdmin` disables both controls
- [x] 2.2 Add the helper text for the selected mode, the `role="status"` enforce warning, and the `role="alert"` cost-object message with `invalid` state on the field
- [x] 2.3 In `SystemProperties.tsx`, derive cost-object validity from the current settings and register it with the save-validation context for the page lifetime, including after a context reset; remove the tab-owned registration from `SpendingLimits.tsx` while retaining inline feedback
- [x] 2.4 In `SystemProperties.tsx`, add `changeSpendingLimits` (handling a null `prev` like `changeRateLimitSchedule`) and render the tab when `activeTab === EntityViewTab.SpendingLimits`

## 3. Unit tests

- [x] 3.1 Add `components/SystemProperties/tests/SpendingLimits.spec.tsx`: stored values shown, absent field shows defaults without calling the change callback on focus/blur, first edit materializes both values, enforce warning shown only for `enforce`, blank and whitespace cost object invalid, read-only disables both controls, controls found by role/label
- [x] 3.2 Extend `tests/SystemProperties.spec.tsx`: Spending Limits tab appears and renders, save body carries `spendingLimits` with the other fields preserved, editing interceptors preserves an existing `spendingLimits`, Discard restores the read values, a 400 shows the error notification
- [x] 3.3 Extend the tab-utils spec so `getSystemPropertiesTabs` returns the three tabs in order
- [x] 3.4 Update `tests/SpendingLimits.spec.tsx` for inline validation without tab-owned context registration; extend `tests/SystemProperties.spec.tsx` with real Spending Limits and save-validation behavior to cover empty and whitespace-only values across both other tabs, invalid stored values before opening the tab, correction, discard, and absence of an update request while invalid

## 4. Quality checks

- [ ] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test` suite; fix anything they report
