## Why

DIAL Core now stores `spendingLimits` in its global-settings singleton (ai-dial-core PR #2220, on top of
the config-file support from #2182). Without a control for it, an admin can only change spending-limit
enforcement by editing Core's config file, and the System Properties page has no way to show the
effective mode. The page already edits the rest of that singleton (global interceptors, rate-limit
schedule), so this is the missing tab.

## What Changes

- Add a **Spending Limits** tab to System Properties, next to Global Interceptors and Rate Limit Schedule.
- The tab edits `GlobalSettings.spendingLimits`: a **mode** select (`off` / `shadow` / `enforce`) and a
  **default cost object** text field.
- An absent `spendingLimits` field displays Core's defaults (`off` / `ORG`) without making the page dirty;
  the first edit writes both values (same convention as Rate Limit Schedule).
- An empty default cost object disables Save; Core's own 400 covers anything stricter.
- A short note on the tab tells the user that saving overrides any value set in Core's config file,
  because the blob wins over the file wholesale.
- Mode helper text describes each mode; selecting `enforce` shows an inline warning that it blocks requests.
- Controls are disabled for a read-only admin.
- The model gains `SpendingLimitMode` and `SpendingLimits`; `GlobalSettings.spendingLimits` is optional.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `system-properties`: adds the Spending Limits tab, its default-display and dirty-state behaviour, its
  validation, the override note, and read-only handling.

## Non-goals

- Reading the effective value from Core's file-config view (`ConfigResourceController` /
  `FileConfigController`). The tab shows only what the settings blob holds; the override note is the
  mitigation for the upgrade trap. A follow-up can add the file read.
- Editing `retriableErrorCodes`, which stays round-tripped only.
- Per-policy or per-cost-object budget management; this is the global switch only.
- Validating the cost-object format client-side beyond non-empty — Core does not document one.
- Any change to the save path (`updateProperties`, `settings-api.ts`); both already send the whole object.

## Impact

- `src/models/system-properties.ts`: new enum and interface, optional field on `GlobalSettings`.
- `src/components/SystemProperties/`: new `SpendingLimits.tsx`, constants, and wiring in
  `SystemProperties.tsx`.
- `src/utils/tabs/utils.ts`: `EntityViewTab.SpendingLimits`, `spendingLimitsTab`, and
  `getSystemPropertiesTabs`.
- `src/constants/i18n.ts` and `src/locales/en.ts`: tab label and `SystemProperties` strings.
- Shared code touched: `getSystemPropertiesTabs` is used only by the System Properties header, so no
  other page is affected. `SaveValidationContext` gains one more field key.
- Backend: Core `GET`/`PUT v1/settings/platform/global`, `spendingLimits` object. Requires a Core
  version that includes #2220; an older Core ignores or rejects the unknown field.
