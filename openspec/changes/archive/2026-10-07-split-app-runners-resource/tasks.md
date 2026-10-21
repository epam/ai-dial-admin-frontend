## 1. Extract the resource picker

- [x] 1.1 Create `apps/ai-dial-admin/src/components/SourceField/Application/AppRunnersResource.tsx` from the current `AppRunners.tsx`, keeping `selectedValue`/`onChangeValue`, `runnerOptions` state, the `runner.$id` mutation, `$id` labels, Platform-origin open-in-tab and Platform re-resolve; drop the `entity`/`onChange` API
- [x] 1.2 Change `SelectAppRunnersModal.tsx` to take the column set explicitly instead of the `isMergedSource` boolean; `AppRunnersResource` passes `PICKER_RUNNER_COLUMNS`
- [x] 1.3 Point `components/Assets/Resources/ResourceSourceField.tsx` at `AppRunnersResource`

## 2. Simplify the admin-BE picker

- [x] 2.1 Reduce `AppRunners.tsx` to the entity API: remove `selectedValue`, `onChangeValue`, `view`, `isMergedSource`, `runnerOptions` state, the `$id` mutation and the Platform URL branch; use `runners` directly, display-name labels, `LIST_RUNNER_COLUMNS` and the single `ApplicationRunners/<id>` URL
- [x] 2.2 Update `SourceField.tsx` call site for the removed props

## 3. Tests

- [x] 3.1 Move `tests/AppRunnersMerged.spec.tsx` and the `onChangeValue` case of `tests/AppRunners.spec.tsx` into `tests/AppRunnersResource.spec.tsx`
- [x] 3.2 Trim `tests/AppRunners.spec.tsx` to the entity API; add a case that Platform-origin options still use display-name labels, standalone columns and the `ApplicationRunners` URL
- [x] 3.3 Update `SourceField/tests/SourceField.spec.tsx` and the `ResourceSourceField`/`Assets/Apps` specs so each mocks the picker it now renders; keep `npm run typecheck:specs` at zero

## 4. Unmatched stored id and Open (AppRunnersResource)

- [x] 4.1 Add a `getRunnerOpenUrl(runner, locale)` helper to `SourceField/Application/utils.ts` (Platform: path; Config: `$id` + `configFile=true`; `undefined` when unresolvable) with unit tests
- [x] 4.2 In `AppRunnersResource.tsx`, show a stored id that matches no option as an extra dropdown item (no matching, no request)
- [x] 4.3 Switch `AppRunnersResource`'s Open control to the helper and hide it when the helper returns `undefined`
- [x] 4.4 Add `AppRunnersResource.spec.tsx` cases for each new scenario in the `platform-app-runners` delta, and keep `typecheck:specs` at zero

## 5. Docs

- [x] 5.1 Confirm no doc under `docs/` references `AppRunners` for asset apps (none found at proposal time) and that the spec deltas match the final code

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the `SourceField`, `Assets/Apps` and `Application` tests, then the full `npm run test`
