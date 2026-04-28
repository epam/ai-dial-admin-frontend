## 1. SaveValidationContext — Add RemoveField

- [x] 1.1 Add `RemoveField` action type to `ValidationActionType` enum in `apps/ai-dial-admin/src/context/SaveValidationContext.tsx`
- [x] 1.2 Add `RemoveField` to the `ValidationAction` union type
- [x] 1.3 Add `RemoveField` case to `validationReducer`: delete the key from `fieldValidations`, recompute `isValid`

## 2. DisplayNameControl — Cleanup and opt-out prop

- [x] 2.1 Add `trackGlobalValidity?: boolean` prop (default `true`) to the `Props` interface in `apps/ai-dial-admin/src/components/BaseControls/DisplayName.tsx`
- [x] 2.2 Guard all `dispatch(SetField)` calls in `validateDisplayName` and the initial `useEffect` with `if (trackGlobalValidity !== false)`
- [x] 2.3 ~~Add a `useEffect` cleanup on unmount~~ — Removed: errors must persist in the background when switching tabs

## 3. Path and Paths — Opt-out prop

- [x] 3.1 Add `trackGlobalValidity?: boolean` to Props in `apps/ai-dial-admin/src/components/Routes/Paths/Path.tsx`; guard all `dispatch` calls with `if (trackGlobalValidity !== false)`; pass it through to the `<Path>` render in `Paths.tsx`
- [x] 3.2 Add `trackGlobalValidity?: boolean` to Props in `apps/ai-dial-admin/src/components/Routes/Paths/Paths.tsx`; guard the `dispatch('path')` call; forward prop to each `<Path>` — no unmount cleanup

## 4. RouteProperties — Opt out of global tracking for app runner routes

- [x] 4.1 In `apps/ai-dial-admin/src/components/Routes/View/Properties/RouteProperties.tsx`, compute `skipGlobalValidation = !!(isAppRoute && isAppRunnerView)` and pass `trackGlobalValidity={!skipGlobalValidation}` to `DisplayNameControl` and `Paths`
- [x] 4.2 Wrap the `methods`, `endpoints`, `status`, `body`, and `order` dispatch calls with `if (!skipGlobalValidation)` so they are skipped for app runner routes

## 5. EntityRoutes — Eager aggregate validity for all routes

- [x] 5.1 In `apps/ai-dial-admin/src/components/EntityView/AppRoute/AppRoute.tsx`, import `getErrorForAppRouteName` from `@/src/utils/validation/name-error` and `isValidRoutePath` from `@/src/utils/validation/path-error`; add `useI18n`
- [x] 5.2 Add a `useEffect` that validates all routes (name, paths, methods, endpoints) and dispatches `SetField('appRoutes', allValid)` whenever `routes` or `isAppRunnerView` changes
- [x] 5.3 ~~Add cleanup `useEffect` for `RemoveField('appRoutes')` on unmount~~ — Removed: `appRoutes` error persists in the background when switching tabs
- [x] 5.4 Remove the `status` and `methods` `dispatch` calls from `onRemoveRoute` (replaced by the aggregate effect)

## 6. Remove route-switching lock

- [x] 6.1 In `apps/ai-dial-admin/src/components/EntityView/AppRoute/AppRouteList.tsx`, remove the `pointer-events-none opacity-50` guard and the `useSaveValidationContext` import (no longer needed)

## 7. Code quality

- [x] 7.1 Run `npm run lint` from repo root and fix any issues
- [x] 7.2 Run `npm run format:write` to apply formatting
- [x] 7.3 Run `npm run test` from `apps/ai-dial-admin/` and confirm all tests pass
