## Why

App Route names serve as route identifiers consumed by the backend, which enforces an alphanumeric + underscore constraint (`^[a-zA-Z0-9_]+$`). Without frontend validation, users can enter names that pass the UI but are rejected by the API, resulting in confusing save errors. Surfacing this constraint early — with a clear message — prevents that confusion.

## What Changes

- Add a new focused validation function `getErrorForAppRouteName` for the App Route "Display Name" field.
- Add a new i18n error key and message: "Field must not contain forbidden characters. Only alphanumeric characters and underscore are allowed."
- Add a new `alphanumericOnly` prop to `DisplayNameControl` that switches its validator to `getErrorForAppRouteName`.
- Pass `alphanumericOnly={true}` from `RouteProperties` when `isAppRoute` is `true`.
- Update `CreateRoute` modal to use `getErrorForAppRouteName` directly (it already calls the validator inline).
- Add unit tests for the new validation function.
- Add component tests for the updated `CreateRoute` and `RouteProperties` behavior.

## Capabilities

### New Capabilities

- `app-route-name-validation`: Input validation for the App Route Display Name field — restricts to alphanumeric characters and underscore (`^[a-zA-Z0-9_]+$`), with a descriptive error message.

### Modified Capabilities

<!-- No existing spec-level capabilities are changing. -->

## Impact

- `utils/validation/name-error.ts` — new exported function `getErrorForAppRouteName`
- `constants/validation.ts` — new regex constant
- `constants/i18n.ts` — new `ErrorI18nKey` entry
- `locales/en.ts` — new error string
- `components/BaseControls/DisplayName.tsx` — new optional `alphanumericOnly` prop
- `components/Routes/View/Properties/RouteProperties.tsx` — passes `alphanumericOnly={isAppRoute}`
- `components/EntityView/AppRoute/CreateRoute.tsx` — switches to `getErrorForAppRouteName`
- Test files for the above
