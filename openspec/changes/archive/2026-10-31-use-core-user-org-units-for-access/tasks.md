## 1. Models and Core client

- [x] 1.1 Add `src/models/user-access.ts`: `AdminAccess` (`FULL`, `NONE`, `READ_ONLY`), `UnitAction`, `UserOrgUnit` (extends `OrgUnit` fields with `roles`, `permissions`), `UserAccess`, `AccessMode` (`FULL`, `UNIT`, `DENIED`); add the raw DTO next to `core-user-info.ts` in `src/models/dial/`, typed from PR #2209's `docs/open_api_core.yaml`
- [x] 1.2 Add `USER_ORG_UNITS_URL = 'v1/user/org-units'` and `CoreUtilityApi.getUserOrgUnits(token)` in `src/server/core/core-utility-api.ts`, keeping the HTTP status on failure so 404 stays distinguishable
- [x] 1.3 Drop `roles` from `CoreUtilityApi.getUserInfo` and its `UserInfo`; delete `UserRole` from `src/models/user-info.ts`

## 2. Mode resolution

- [x] 2.1 Add pure `resolveUserAccess(isEnableAuth, result)` returning `UserAccess` in `src/utils/auth/user-access.ts` (auth off → FULL, 404 → FULL, FULL → FULL, NONE+units → UNIT, NONE+no units or other failure → DENIED); delete `resolveIsFullAdmin` / `full-admin.ts`
- [x] 2.2 Add owner/permission helpers in `src/utils/org-units/` (`canReadNamespace`, `canWriteAt` over `UserOrgUnit[]`, reusing `getOwningUnit`/`toUnitMap` from `utils/org-units/units`), plus the `ApplicationRoute` → namespace mapping

## 3. Server wiring

- [x] 3.1 Remove the `getUserInfo` picker from `src/app/api/api.ts`; add zero-argument, per-request `cache`d `getUserAccess()` in `src/server/user-access.ts` (it resolves the token itself, since a token object is new per call and would defeat `cache`)
- [x] 3.2 Remove `UtilityApi.getUserInfo` and `SECURITY_INFO_URL` from `src/server/utility-api.ts` (the rest of the class stays)
- [x] 3.3 Rewrite `isFullAdminCaller` in `src/server/user-access.ts` on `getUserAccess` / `resolveAccessMode`
- [x] 3.4 Root layout (`src/app/layout.tsx`): render `Page403Wrapper` when mode is `DENIED`, not on identity failure
- [x] 3.5 `[lang]/layout.tsx`: pass `userAccess` and `userInfo` (identity failure no longer blocks) to `AppContextProvider`; skip the `telemetryApi.getDatasets` read in unit mode

## 4. AppContext

- [x] 4.1 Extend `AppContextProvider` / `AppContextType` with `userAccess`, `isUnitMode`, `canReadNamespace`, `canWriteAt`; derive `isFullAdmin` from mode and `isReadOnlyAdmin` from `isEntityReadOnly || adminAccess === READ_ONLY` (drop the `adminApiEnabled` and role terms); update `use-is-read-only-admin.ts` consumers only if their types change

## 5. Unit-mode surfaces

- [x] 5.1 Menu: in unit mode show only sections whose namespace the caller can read, hide Platform / admin-backend groups (`Menu/menu-configuration.tsx`, `MenuContent`, `utils/env/get-menu-items.ts` as needed)
- [x] 5.2 Folder write actions: at the callers of `getGridActionLabels` / `getTreeActionLabels` / `getToolbarOptionLabels` (`Common/FileManager/utils.ts` and the asset views) pass `isReadOnlyAdmin || !canWriteAt(namespace, currentPath)`
- [x] 5.3 Publications: gate Approve/Reject on `publications` read+write at every unit the request touches (`Publications/View/TabsContent.tsx`, `Permissions.tsx` and the touched-targets helper)
- [x] 5.4 Org-unit Role assignments tab: show on `role-assignments` read, enable add/remove on write (`FoldersStorage/UnitInfo.tsx`, `UnitRolesCard.tsx`); drop the 403-probe handling this replaces
- [x] 5.5 i18n: no new strings were needed — the roles card reuses its existing forbidden state and the disabled buttons keep their labels

## 6. Unit tests

- [x] 6.1 `resolveUserAccess`, `canReadNamespace`, `canWriteAt`, route→namespace mapping: every mode, 404, auth-off, nested/prefix-sibling units, empty permissions
- [x] 6.2 `CoreUtilityApi.getUserOrgUnits` and `getUserInfo` (no roles); replace `app/api/tests/get-user-info.spec.ts` with a `getUserAccess` spec (one call per request, no security-info call when `DIAL_ADMIN_API_URL` is set); drop the security-info test from `server/tests/utility-api.spec.ts`
- [x] 6.3 Update `server/tests/user-access.spec.ts`, `AppContext` tests, layout/403-gate tests, Menu, FileManager utils, Publications and `UnitRolesCard.spec.tsx` for the new access source; refresh `test-setup.tsx` context mocks (`isUnitMode`, `canReadNamespace`, `canWriteAt`) there, not inline
- [x] 6.4 Run `npm run typecheck` and `npm run typecheck:specs` at zero

## 7. Docs and specs

- [x] 7.1 Update `docs/` and `.env.template` comments that describe roles coming from the admin backend; add the "Core auth on with no admin rules ⇒ 403 for everyone" prerequisite
- [x] 7.2 Fold the deltas into `openspec/specs/` on archive; refresh `utility-core-api`'s Purpose text, which still names the picker

## 8. Quality checks

- [x] 8.1 Run lint, format check, and the full test suite (`npm run lint`, `npm run format`, `npm run test`) and fix anything they report
