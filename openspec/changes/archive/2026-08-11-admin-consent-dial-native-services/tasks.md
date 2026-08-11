## 1. Model and dispatch foundation

- [x] 1.1 Add `DIAL_NATIVE = 'DIAL_NATIVE'` to `ToolsetAuthType` in `src/models/dial/resource.ts`
- [x] 1.2 Add `ExternalServiceRowAction` enum (`SignIn` / `Consent` / `None`) to
  `src/components/Assets/Resources/Auth/models.ts` (new file, per the constants/models split)
- [x] 1.3 Add `getExternalServiceRowAction(service)` to
  `src/components/Assets/Resources/Auth/external-service-auth-utils.ts` — an exhaustive `switch` over known
  `authentication_type` values with **no** `default` that returns `SignIn`; absent and unrecognised types
  return `None`
- [x] 1.4 Add `isExternalServiceApproved(service)` to the same util —
  `app_level_auth_status === SIGNED_IN`, ignoring `user_level_auth_status`
- [x] 1.5 Narrow `isLoggedInToExternalService` so it is never consulted for `DIAL_NATIVE` rows (the status
  dot must not go green off the viewing admin's own `user_level_auth_status`)

## 2. Consent API and server actions

- [x] 2.1 Create `src/server/core/external-service-consent-api.ts` —
  `ExternalServiceConsentApi extends CoreApi` with `grant(token, appPath, serviceId)` and
  `withdraw(token, appPath, serviceId)` over `POST` / `DELETE`, no request body, URL built with
  `encodeCorePath(appPath)` and `encodeURIComponent(serviceId)`
- [x] 2.2 Register the class in `src/app/api/api.ts` alongside `externalServiceOpsApi`
- [x] 2.3 Add `grantExternalServiceConsent` / `withdrawExternalServiceConsent` server actions to
  `src/app/[lang]/assets-applications/actions.ts`, authenticating via `getUserToken` like the neighbouring
  sign-in/sign-out actions

## 3. Copy

- [x] 3.1 Add grant/withdraw dialog headers and bodies, `Approved`, `Grant consent`, `Withdraw consent`, and
  `No action available` to `ExternalServiceI18nKey` in `src/constants/i18n.ts`
- [x] 3.2 Add the corresponding strings to `src/locales/en.ts`, using the wording from the proposal verbatim
  — the grant body must say the application will be able to act as **any user in this installation who has
  enabled offline access**, not "its users"

## 4. Consent UI

- [x] 4.1 Create `src/components/Assets/Resources/Auth/ExternalServiceConsentDialog.tsx` — one
  `DialConfirmationPopup` with `ConfirmationPopupVariant.Danger`, parameterised by grant/withdraw copy
- [x] 4.2 Create `src/components/Assets/Resources/Auth/ExternalServiceConsentActions.tsx` — `Approved` badge
  + `Withdraw consent` when approved, `Grant consent` when not; opens the dialog, calls the server action
  through `useProtectedRequest`, shows success/error notifications via `getSuccessNotification` /
  `getErrorNotification`, then `router.refresh()` on success **and** on 404; renders nothing when
  `useIsReadOnlyAdmin()` (the badge still renders)
- [x] 4.3 Wire the dispatch in `ResourceMultiAuth.tsx`: `getExternalServiceRowAction` selects
  `ExternalServiceAuthButtons` (`SignIn`), `ExternalServiceConsentActions` (`Consent`), or nothing (`None`)
- [x] 4.4 Fix the status dot in `ResourceMultiAuth.tsx` — approval-based for `DIAL_NATIVE`, unchanged for
  `OAUTH` / `API_KEY`, hidden for `NONE` and unrecognised types
- [x] 4.5 Add the `OAUTH` / `API_KEY` guard to `ExternalServiceAuthButtons.tsx`, replacing the
  `!authType || authType === NONE` early return
- [x] 4.6 Hide Edit and Delete on a `DIAL_NATIVE` row in `ResourceMultiAuth.tsx` — consent is its only
  mutation, and the Edit form's Service ID field would otherwise orphan the consent record on rename
  (see design D10). Unrecognised types keep both, so they stay removable

## 5. Auth-type selector

- [x] 5.1 Add the `DIAL_NATIVE` option to `authOptions` in `ResourceAuthentication.tsx` with an icon and
  title, and make the selected-card lookup tolerate a type absent from the options list (removes the
  `find(...)!` crash on the read-only-admin branch)
- [x] 5.2 Make `DIAL_NATIVE` never selectable inside `ResourceAuthentication.tsx` via
  `NEVER_SELECTABLE_AUTH_TYPES`, rather than per-caller `excludeAuthTypes` — the prop defaults to inclusive,
  so a caller that omits it would offer the type. Both callers are left unchanged (see design D2)
- [x] 5.3 In `ResourceAuthTypeSection.tsx`, suppress the click handler for `DIAL_NATIVE` and exclude it from
  the `isSelected && config.id !== NONE` body condition so no empty settings panel opens

## 6. Tests

- [x] 6.1 Unit-test `getExternalServiceRowAction` and `isExternalServiceApproved` in
  `src/components/Assets/Resources/Auth/tests/external-service-auth-utils.spec.ts` — every known type, an
  unrecognised type, an absent type, and an absent `app_level_auth_status`
- [x] 6.2 Extend `tests/ResourceMultiAuth.spec.tsx` — `DIAL_NATIVE` shows `Grant consent` when `SIGNED_OUT`
  and `Approved` + `Withdraw consent` when `SIGNED_IN`; no Log in action in either state; `OAUTH` row
  unchanged; unrecognised type renders no action; the status dot stays not-approved when
  `user_level_auth_status === SIGNED_IN` and `app_level_auth_status === SIGNED_OUT`; no consent action for a
  read-only admin
- [x] 6.3 Test `ExternalServiceConsentActions` — dialog opens before any request; cancel sends nothing;
  success refreshes and notifies; `DELETE` returning `false` surfaces no error; failure leaves the row
  unchanged; 404 triggers a refresh
- [x] 6.4 Test the server actions' URL construction for an application path containing a space and multiple
  folder segments (`/` separators preserved, segments encoded)
- [x] 6.5 Add a `ResourceAuthentication` test covering a `DIAL_NATIVE` service: the card renders with no
  auth-settings fields, is not clickable, and does not throw on the read-only-admin branch

## 7. Preview scaffold — must not merge

- [x] 7.0 `src/server/core/temp-dial-native-preview.ts` fakes a `DIAL_NATIVE` service on every application
  read and answers grant/withdraw from module state, so the row UI can be reviewed before `ai-dial-core`
  PR #1815 lands. It is stripped from both `createApp` and `updateApp`, so saving and duplicating an
  application never send the fake to Core
- [x] 7.1 Removed before archive: `temp-dial-native-preview.ts` deleted and all four call sites in
  `assets-applications/actions.ts` reverted, leaving only the two consent server actions

## 8. Quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root; run targeted specs with
  `npx vitest run` from `apps/ai-dial-admin/`
