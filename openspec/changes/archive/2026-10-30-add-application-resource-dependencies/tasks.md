## 1. Models, i18n and tab wiring

- [x] 1.1 Add `ResourceDependency` (`kind`, `link_id`, `target.path`, `access`, `required`), `ResourceAccess` enum (`READ`, `WRITE`) and `AdminConsentStatus` / `ApprovedResource` models in `src/models/dial/resource-dependency.ts`; add `resource_dependencies?: ResourceDependency[]` to `DialApplication` in `src/models/dial/application.ts`
- [x] 1.2 Add `EntityViewTab.ResourceDependencies`, a `resourceDependenciesTab(t)` builder and `TabsI18nKey.ResourceDependencies` in `src/utils/tabs/utils.ts`; drop `dependenciesTab` from the `AssetsApplications` branch of `getTabsForAsset` only (admin-backend `dependenciesTab` usage at line ~398 stays)
- [x] 1.3 In `src/components/Assets/Entities/Apps/View.tsx` append the Resource Dependencies tab, in the Dependencies tab's old position, for public-bucket applications only (`!isPlatformBucketPath(folderId)`), alongside the existing MCP `toolsTab` splice
- [x] 1.4 Render `ResourceDependencies` from `src/components/Applications/View/TabsContent.tsx` for `EntityViewTab.ResourceDependencies` when `view === ApplicationRoute.AssetsApplications`; leave the `Dependencies` branch for the admin-backend view
- [x] 1.5 Add i18n keys (`ResourceDependenciesI18nKey` in `src/constants/i18n.ts`, strings in `src/locales/en.ts`) for labels, placeholders, notes, dialogs and validation messages; reuse `ButtonsI18nKey` for Cancel / Add / Save

## 2. Core-direct consent client

- [x] 2.1 Create `src/server/core/admin-consent-api.ts` (`AdminConsentApi extends CoreApi`): `getStatus`, `grant`, `withdraw` on `v1/consent/${encodeCorePath(appPath)}/admin-consent`, mapping Core's `grantedResources[].url` to `path`; register the instance where `externalServiceConsentApi` is exported
- [x] 2.2 Add `getAdminConsentStatus`, `grantAdminConsent`, `withdrawAdminConsent` server actions to `src/app/[lang]/assets-applications/actions.ts` (token via `getUserToken()`, same response shape as the external-service consent actions)

## 3. Validation and derivation utils

- [x] 3.1 `utils/validate-dependency.ts`: Link ID required + unique, target-path grammar (decoded segments, root vocabulary, `users`, bare type root, `{current-user}` position, empty / `*` / `.` / `..`), access non-empty, 100-entry cap; returns the first failing rule as an i18n key
- [x] 3.2 `utils/copy-link-id.ts` (`_copy`, `_copy2`, … until unique), `utils/access.ts` (Write-implies-Read toggling, fixed `READ`, `WRITE` order), `utils/derive-consent-state.ts` (saved count + Core status + dirty → label, visible buttons, disabled flags, notes)
- [x] 3.3 `utils/update-dependencies.ts`: add / replace / insert-after / remove over the array, returning `undefined` for an empty result; `isDeclarationDirty` over the `resource_dependencies` slice only

## 4. Dependencies grid and modal

- [x] 4.1 `src/components/Assets/Entities/Apps/ResourceDependencies/ResourceDependencies.tsx`: tab root (`flex flex-col h-full`), no-data component when the status read fails, wires grid, modal, consent block and dialogs to `selectedApp` / `onChangeApplication`; export via `TabsContent`
- [x] 4.2 `DependenciesGrid.tsx`: header `Resource Dependencies: {n}` + `Add dependency` (disabled at 100), `GridView` filling the remaining height, columns Link ID / Target Path (`EllipsisTooltip`) / Access / Required / actions via `ActionCellRenderer` (Edit, Duplicate, Remove), empty state; column defs in `utils/columns.tsx`
- [x] 4.3 `DependencyModal.tsx` (add / edit): Link ID and Target path inputs with the placeholder, Read / Write checkboxes with Write-forces-Read, Required switch with description, Cancel / Add (Save) footer, confirm disabled on invalid input, inline first-error messages; use the existing validation-context field pattern

## 5. Admin consent block

- [x] 5.1 `use-admin-consent.ts`: fetch status on mount and when the saved etag changes, expose `status`, `isLoading`, `hasFailed`, `approve`, `revoke` (each calls the action, shows success / error notification, refetches)
- [x] 5.2 `AdminConsent/AdminConsent.tsx`: header + state-matrix buttons, `LabelledText` facts (Status, Last approved by, Last approved at), spinner while loading, polite `role="status"` live region, neutral "reflects the saved definition" note and red "Declaration changed since last approval" note
- [x] 5.3 `AdminConsent/ApprovedResources.tsx` and a shared `ResourceList` rendering `path (WRITE, READ)` lines
- [x] 5.4 `ConsentDialog.tsx` on `ConfirmationPopup`: approve / re-approve variant listing the saved declaration, revoke variant listing `grantedResources`, loading state on confirm

## 6. Tests

- [x] 6.1 Util specs: `validate-dependency` (every rule incl. encoded `%2e%2e`, both documented examples, uniqueness with edit exclusion, cap), `copy-link-id`, `access`, `derive-consent-state` (full matrix + dirty), `update-dependencies` (empty → `undefined`, insert-after order)
- [x] 6.2 Component specs: `DependencyModal` (Write forces Read, disabled Add, validation messages), `DependenciesGrid` (count, columns, Duplicate / Remove / Edit, cap), `AdminConsent` (each matrix row, dirty note, stale note + list), `ConsentDialog` (saved vs granted lists, confirm / cancel), `ResourceDependencies` (no-data on failed status, refetch after etag change)
- [x] 6.3 `AdminConsentApi` spec (URLs, methods, `url` → `path` mapping) and server-action specs beside `actions.spec.ts`
- [x] 6.4 Update `tabs` specs and `Assets/Entities/Apps/tests/View.spec.tsx` for the new tab set (no Dependencies on public or platform; Resource Dependencies on public only), and `TabsContent` tests for the admin-backend view keeping Dependencies

## 7. Docs and quality gates

- [x] 7.1 Update any `docs/` page that lists the asset-application tabs or consent behaviour
- [x] 7.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`; fix all findings
