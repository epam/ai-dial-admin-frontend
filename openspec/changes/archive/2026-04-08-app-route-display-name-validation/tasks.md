## 1. Constants and i18n

- [x] 1.1 Add `APP_ROUTE_NAME_REGEX = /^[a-zA-Z0-9_]+$/` constant to `apps/ai-dial-admin/src/constants/validation.ts`
- [x] 1.2 Add `AlphanumericUnderscore = 'Error.AlphanumericUnderscore'` to `ErrorI18nKey` enum in `apps/ai-dial-admin/src/constants/i18n.ts`
- [x] 1.3 Add the error string to `apps/ai-dial-admin/src/locales/en.ts`: `AlphanumericUnderscore: 'Field must not contain forbidden characters. Only alphanumeric characters and underscore are allowed.'`

## 2. Validation function

- [x] 2.1 Add `getErrorForAppRouteName(name?, names?, t?)` to `apps/ai-dial-admin/src/utils/validation/name-error.ts` — checks duplicate, length (2–255), then `APP_ROUTE_NAME_REGEX`, returning `ErrorType.FORBIDDEN_CHARS` with `ErrorI18nKey.AlphanumericUnderscore` on regex failure

## 3. Unit tests for new validator

- [x] 3.1 Add tests for `getErrorForAppRouteName` in `apps/ai-dial-admin/src/utils/validation/tests/name-error.spec.ts`:
  - valid name returns `null`
  - name with hyphen returns `FORBIDDEN_CHARS` error
  - name with space returns `FORBIDDEN_CHARS` error
  - name with `@` returns `FORBIDDEN_CHARS` error
  - underscore-only name is valid
  - alphanumeric name is valid
  - duplicate name returns `EXISTING` error
  - name too short returns `LENGTH` error

## 4. DisplayNameControl

- [x] 4.1 Add `alphanumericOnly?: boolean` prop to `DisplayNameControl` in `apps/ai-dial-admin/src/components/BaseControls/DisplayName.tsx`
- [x] 4.2 In `validateDisplayName` inside `DisplayNameControl`, when `alphanumericOnly` is `true` call `getErrorForAppRouteName` instead of `getErrorForName`

## 5. Wire up in RouteProperties and CreateRoute

- [x] 5.1 Pass `alphanumericOnly={isAppRoute}` to `<DisplayNameControl>` in `apps/ai-dial-admin/src/components/Routes/View/Properties/RouteProperties.tsx`
- [x] 5.2 Replace the `getErrorForName` call with `getErrorForAppRouteName` in `apps/ai-dial-admin/src/components/EntityView/AppRoute/CreateRoute.tsx`

## 6. Component tests

- [x] 6.1 Add test to `apps/ai-dial-admin/src/components/Routes/View/Properties/tests/RouteProperties.spec.tsx`: entering a name with a forbidden character when `isAppRoute=true` shows the alphanumeric error message
- [x] 6.2 Add tests for `CreateRoute` in a new `apps/ai-dial-admin/src/components/EntityView/AppRoute/tests/CreateRoute.spec.tsx`:
  - valid name enables the Create button
  - name with forbidden character shows error and disables Create button
  - correcting an invalid name clears the error

## 7. Quality checks

- [x] 7.1 Run `npm run lint` from the repo root and fix any issues
- [x] 7.2 Run `npx vitest run src/utils/validation/tests/name-error.spec.ts` from `apps/ai-dial-admin/` and confirm all tests pass
- [x] 7.3 Run `npx vitest run src/components/Routes/View/Properties/tests/RouteProperties.spec.tsx` from `apps/ai-dial-admin/` and confirm all tests pass
