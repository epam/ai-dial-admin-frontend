## 1. Extract the filter editor (PR 1 — no behaviour change)

- [x] 1.1 Add `FilterTreeContext` (`{ fields, functions, refresh }`) and a `useFilterTree()` hook in `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/filter-tree-context.tsx`; the hook returns the provided value, otherwise derives it from `QueryBuilderContext`
- [x] 1.2 Switch `Filter/FilterGroup.tsx`, `Filter/FilterCondition.tsx` and `Common/FnArgEditor.tsx` from `useQueryBuilder()` to `useFilterTree()`; no file moves (the `Common` pieces they use are shared with the other builder sections)
- [x] 1.3 No Query Builder adapter is needed: inside the builder the hook derives its value from the builder's own context
- [x] 1.4 Export `parseFilterRoot` and `isFilterRepresentable` from `QueryBuilder/utils/deserialize.ts` for reuse; no change to their behaviour
- [x] 1.5 Confirm the Query Builder specs stay green with no edited assertions

## 2. Contract: types, API client, actions, permissions (PR 2)

- [x] 2.1 Extend `models/analytics/table.ts`: `TablePermissions` with `get`, `read`, `sensitive`, `rows_restricted`; `TableAccess` to the five lists; `TableAccessUpdateResult` with `ineffective_grants`; `RowPolicy` and the row-policy map; an `IneffectiveGrantReason` enum
- [x] 2.2 Add `getRowPolicies`, `putRowPolicy`, `deleteRowPolicy` to `server/analytics/analytics-data-api.ts`; make the access update take a partial and return the update result; rename `replaceTableAccess` to `updateTableAccess`
- [x] 2.3 Add the matching server actions in `app/[lang]/tables/actions.ts`; treat a `404` on `deleteRowPolicy` as success at the action boundary
- [x] 2.4 Update `hooks/use-analytics-table-permissions.ts`: `canManageRoles = isFullAdmin`, add `canChangeSensitive` and `isRowsRestricted`
- [x] 2.5 Add i18n keys for the Access tab, drawer, banners, Remove role, the badge and the sensitive lock to `src/locales/en.ts` and an `AnalyticsTableAccessI18nKey` group in `src/constants/i18n.ts` (plus `TabsI18nKey.Access`)

## 3. Common/Drawer (PR 3)

- [x] 3.1 Add `components/Common/Drawer/Drawer.tsx`: portal, right-edge overlay, `role="dialog"` + `aria-modal` + accessible name, header/body/footer slots, close control, Escape, focus in on open and back to the trigger on close, rest of the page `inert` while open
- [x] 3.2 Style with Tailwind theme tokens only, above the AG Grid and ui-kit popups; no domain imports

## 4. Access tab, drawer, row limit, Remove role (PR 4)

- [x] 4.1 Add the pure helpers in `Analytics/Tables/access/` (`utils.ts`, `models.ts`, `constants.ts`): `buildRoleRows`, `planAccessSave`, `planRoleRemoval`, step-offered rules
- [x] 4.2 Add `use-table-access.ts`: load access and row policies with the detail view, expose rows, status (loading / ready / forbidden / failed), and the save and remove operations; read the lists again immediately before a save
- [x] 4.3 Add `accessTab` and `EntityViewTab.Access` to `utils/tabs/utils.ts`; move `TableDetailView`'s strip to the ui-kit 2.0 `Tabs` (items `{ id, label }`, `activeTabId`, `onTabChange`, mapped from the `TabModel` factories at the call site, offered only per "Access tab lists a table's roles"; drop the Manage access header button and the `accessOpen` state
- [x] 4.4 Add `AccessTab` with the roles table as a ui-kit 2.0 `Grid` (mark cell renderers with accessible names, Rows cell, row activation by click and Enter), role-name search, the Can read and Rows limited chips, **Add role**, and the caption
- [x] 4.5 Add `RoleDrawer` on `Common/Drawer`: the four steps, locked Write and Modify on system tables, footer summary, the `Editing` / `GrantsSavedWithBanner` / `RowLimitFailed` phases, **Done** and **Save row limit** actions, role picker over the Core role catalog read by the existing `getRoles` — both populations, the roles written through Core's API and the roles declared in Core's configuration file (alphabetical, granted-outside-catalog kept, separate catalog-failure notification, roles already on the table not offered for a new role)
- [x] 4.6 Add `RowLimitEditor`: the table's columns as `FieldOption`s (sensitive included, no dotted enrichment field), `FilterTreeContext` with an empty function catalog, the JSON view on `JsonEditorBase`, deep predicates opening as JSON with the note, empty predicate not savable
- [x] 4.7 Wire the save: `PUT /access` for the changed keys, then `PUT` / `DELETE` of the row policy per the rules (Read off leaves the policy; All rows deletes it; no delete without a policy); `ineffective_grants` as in-drawer `Notification` banners next to the Read card or the sensitive step; every error as a notification with the service's message and request id
- [x] 4.8 Add Remove role: `ConfirmationPopup` listing what is removed and the warning, one `PUT /access` for the keys that named the role and one `DELETE` of its policy when it has one
- [x] 4.9 Delete `TableAccessPanel.tsx` and its spec; confirm no remaining reference to the old popup or to `replaceTableAccess`

## 5. Badge and sensitive lock (PR 5)

- [x] 5.1 Add the Rows restricted badge (`Tag` + `Tooltip`) and use it in the detail header beside the status badge and in the `TablesView` catalog row beside the name, driven by `isRowsRestricted`
- [x] 5.2 Pass `!canChangeSensitive` as `sensitiveDisabled` from `TableDetailView` to `EditColumnPopup`, and show the lock icon and a tooltip with the reason there

- [x] 5.3 Move the detail header to ui-kit 2.0: `Button` for Delete table, Add columns, Add rows and Connect; the JSON Editor switch and the draft's Save / Discard through their existing `isDesignSystem2` opt-in; a labelled **Copy** button through a new `isDesignSystem2` opt-in on `Common/CopyButton`
- [x] 5.4 While an `ACTIVE` table's definition is shown as JSON, render only the Copy button and the JSON Editor switch in the header

## 6. Tests

- [x] 6.1 Unit-test the access helpers (`buildRoleRows` stored vs implied vs none and the Rows cell kinds, `planAccessSave` changed keys and preserved grantees, `planRoleRemoval`, step rules) and the extended `useAnalyticsTablePermissions` scenarios
- [x] 6.2 Test `use-table-access` and the server actions: load, `403` hides the tab silently, another failure notifies and keeps the tab, `404` on policy delete is success, read-before-write
- [x] 6.3 Component-test `Common/Drawer` (focus in and back, Escape, `inert` background, accessible name)
- [x] 6.4 Component-test `AccessTab`, `RoleDrawer` and `RowLimitEditor` against the spec scenarios: marks and Rows cell, filters, add and edit flows, system-table locks, the banner versus notification split, partial-save retry, JSON fallback, empty predicate
- [x] 6.5 Component-test Remove role, the Rows restricted badge in the header and the catalog, the sensitive lock, and the updated `TableDetailView` and `TablesView` specs (tab strip contents, no Manage access button, no access requests for a viewer who cannot manage)
- [x] 6.6 Run `npm run typecheck:specs` and keep it at zero

## 7. Browser verification

- [x] 7.1 Run the `spec-browser-verify` skill for this change against the local stack with authentication disabled, and resolve every `fail` verdict. In that configuration the service reports every permission as true and no confinement, so the verified scenarios are those that do not depend on a backend-reported permission: the Access tab and its count, the roles table marks and Rows cell, the role drawer steps and their offering rules, saving grants and a row limit, the row-limit editor and its JSON fallback, the banner versus notification split, Remove role, the system-table locks of Write and Modify, and the absence of the Manage access header button. The Rows restricted badge, the sensitive lock and the `403`-hides-the-tab rule are covered by the component tests in group 6

## 8. Quality checks

- [x] 8.1 Run lint, format check, `npm run typecheck`, `npm run typecheck:specs` and the full test suite from `apps/ai-dial-admin/`, and fix what they report
