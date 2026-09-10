## 1. Base API: allow omitting `If-Match`

- [x] 1.1 In `apps/ai-dial-admin/src/server/base-api.ts`, change `putActionWithEtag`'s `etag` parameter
      to `string | undefined` and drop the `|| DEFAULT_ETAG` fallback, so the `If-Match` header is set
      only when `etag` is defined. Confirm the one call site that relies on unconditional-overwrite
      semantics (`utility-api.ts`'s config-version write) still passes `DEFAULT_ETAG` explicitly.
- [x] 1.2 Add/update unit tests for `putActionWithEtag` covering: a defined etag sends `If-Match` with
      that value; `undefined` sends no `If-Match` header at all; `DEFAULT_ETAG` passed explicitly still
      sends `If-Match: *`.

## 2. Frontend model: complete the `GlobalSettings` type

- [x] 2.1 In `apps/ai-dial-admin/src/models/system-properties.ts`, add `retriableErrorCodes?:
      number[]` to `GlobalSettings`, matching Core's `GlobalSettings` POJO field.

## 3. System Properties read path: track blob-existence as a boolean

- [x] 3.1 In `apps/ai-dial-admin/src/app/[lang]/system-properties/page.tsx`, replace the untyped
      `etag = res?.etag || DEFAULT_ETAG` handling with a plain `doesSettingsExist: boolean` derived
      from the read outcome (`true` on success, `false` on a 404 "no blob yet" response).
- [x] 3.2 On a read failure that isn't the expected 404, push a warning into `optionWarnings` (reusing
      the existing `EntitiesI18nKey`/`getErrorNotification` pattern already used on this page for the
      interceptor option list) instead of silently proceeding as if the read succeeded.
- [x] 3.3 Thread `doesSettingsExist` through to `SystemProperties.tsx` and
      `system-properties/actions.ts` → `updateProperties` → `settingsApi.updateSystemProperties` →
      `putActionWithEtag`, passing `DEFAULT_ETAG` when `true` (assert-exists) and `undefined` when
      `false` (omit `If-Match`, create).

## 4. Tests

- [x] 4.1 Add/update component tests for `SystemProperties.tsx` covering: save succeeds when the
      initial read found no settings blob (no `If-Match` sent); save sends `If-Match: *` when a blob
      already existed; a 412 response still surfaces the existing error notification unchanged.
- [x] 4.2 Add/update tests for `system-properties/page.tsx` (or its data-fetching logic) covering the
      404-is-not-an-error case and the "other failure surfaces a warning" case.
- [x] 4.3 Add/update tests asserting a save round-trips an existing `retriableErrorCodes` value
      unchanged when only `globalInterceptors` is edited.

## 5. Quality gate

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, and `npm run test` (from
      `apps/ai-dial-admin/`) and fix any failures.
