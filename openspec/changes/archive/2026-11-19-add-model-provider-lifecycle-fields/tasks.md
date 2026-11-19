## 1. Types and helpers

- [x] 1.1 Add optional `provider`, `deprecationDate` and `endOfService` (all `string`) to `DialModelResource` in `apps/ai-dial-admin/src/models/dial/resource.ts`
- [x] 1.2 Add `parseIsoDate` and `formatIsoDate` in `apps/ai-dial-admin/src/utils/models/lifecycle-date.ts` (local-time conversion, `null` for absent or malformed input, per design.md)

## 2. i18n

- [x] 2.1 Add `deprecationDate` and `endOfService` to `EntityFieldsI18nKey` and a shared `SelectDate` placeholder to `EntityPlaceholdersI18nKey`; the existing `Provider` placeholder is reused in `apps/ai-dial-admin/src/constants/i18n.ts`, with the strings in `apps/ai-dial-admin/src/locales/en.ts`; reuse `EntityFieldsI18nKey.provider`

## 3. Properties form

- [x] 3.1 In `apps/ai-dial-admin/src/components/Assets/Platform/Models/Properties.tsx`, add a Provider `Input` after the intro control and, below it, two `LifecycleDateField`s (ui-kit `Calendar`, `CalendarMode.Date`, 40px field height) on one row, disabled for a read-only admin; a picked date is stored through `formatIsoDate`, a malformed or absent stored value shows the placeholder and is left untouched until a date is picked; add a clear icon button beside each date field, vertically centered on the field only (shown only while a value is set, `aria-label` from `ButtonsI18nKey.Clear`, icon `aria-hidden`, disabled for a read-only admin) that sets the field to `undefined`

## 4. Tests

- [x] 4.1 `apps/ai-dial-admin/src/utils/models/tests/lifecycle-date.spec.ts`: round trip, zero padding, no day shift under a negative-offset timezone, `null` for empty and malformed input
- [x] 4.2 Extend `apps/ai-dial-admin/src/components/Assets/Platform/Models/tests/Properties.spec.tsx`: provider edit, date pick stored as `YYYY-MM-DD`, stored date shown, clear button removes the date and is absent when empty, malformed value preserved, untouched model gains no fields, read-only admin disabled
- [x] 4.3 Cover the model resource write path in the existing asset-metadata or model actions spec: the three fields pass through and absent ones stay absent

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the affected specs with `npx vitest run` from `apps/ai-dial-admin/`; fix all findings
