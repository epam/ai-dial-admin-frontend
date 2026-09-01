## 1. Platform App Runners — forbidden-char constraint (no change; Bug #1 is not valid)

- [ ] 1.1 ~~Remove the `idForbiddenChars={CORE_UNENCODABLE_ID_CHARS}` prop~~ — reverted; Core does reject these characters so the client-side guard is correct and stays

## 2. Shared duplicate modal — conditional Display Name

- [x] 2.1 In `apps/ai-dial-admin/src/components/Assets/Modals/DuplicatePlatformAsset.tsx`, introduce a `hasDisplayName` helper (or inline predicate) that returns true only for `PlatformModels`, `PlatformAppRunners`, and `PlatformInterceptors`
- [x] 2.2 Gate the `displayName` state variable and the `onChangeDisplayName` handler on `hasDisplayName(view)`
- [x] 2.3 Gate the `<DisplayNameControl>` render on `hasDisplayName(view)`

## 3. Platform Roles — enable duplicate action

- [x] 3.1 In `apps/ai-dial-admin/src/components/Assets/utils.ts` (`getGridActionLabels`), move `ApplicationRoute.PlatformRoles` into the case that includes `duplicate` alongside Models, AppRunners, Interceptors, and Routes; remove the comment citing the modal defect

## 4. Canonical spec updates

- [x] 4.1 In `openspec/specs/platform-app-runners/spec.md`, correct the `$id` constraint requirement to accurately describe the existing client-side forbidden-char validation on the platform create form
- [x] 4.2 In `openspec/specs/platform-routes/spec.md`, add the `Route asset list offers a duplicate action` requirement with its scenarios
- [x] 4.3 In `openspec/specs/platform-roles/spec.md`, add the `Role asset list offers a duplicate action` requirement with its scenarios

## 5. Testing

- [x] 5.1 In the unit tests for `DuplicatePlatformAsset`, add cases verifying that `DisplayNameControl` is rendered for `PlatformAppRunners` and is absent for `PlatformRoutes` and `PlatformRoles`

## 6. Code quality

- [x] 6.1 Run `npm run lint`, `npm run format`, and `npm run test` (from `apps/ai-dial-admin/`) and resolve any issues
