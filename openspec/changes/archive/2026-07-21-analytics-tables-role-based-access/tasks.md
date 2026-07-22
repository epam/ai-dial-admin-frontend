# Tasks — Analytics Tables role-based access (FE)

> Backend contract delivered by `caller-table-permissions` (branch
> `worktree-caller-table-permissions`): table DTO carries `permissions {write, modify}`;
> `/v1/tables/{name}/access` stays `FULL_ADMIN`-only. Read-only-admin viewing of role lists is
> deferred (needs a future backend `GET /access` relaxation).

## 1. Models

- [x] In `src/models/analytics/table.ts`, add optional `permissions?: TablePermissions` to
      `AnalyticsTable`, with `TablePermissions { write: boolean; modify: boolean }`.
- [x] Add `TableAccess { write: string[]; modify: string[] }` for the access API.

## 2. Capability flags on AppContext

- [x] In `src/context/AppContext.tsx`: add `isFullAdmin` and `isEnableAuth` to `AppContextType`; accept
      an `isEnableAuth?` prop; derive `isFullAdmin = !isEnableAuth || roles.includes(FULL_ADMIN)`; keep
      `isReadOnlyAdmin`.
- [x] Pass `isEnableAuth={isEnableAuth}` into `<AppContextProvider>` in `app/[lang]/layout.tsx`.

## 3. Permissions hook

- [x] Create `src/hooks/use-analytics-table-permissions.ts` exporting
      `useAnalyticsTablePermissions(table?)` → `{ canCreate, canDelete, canManageRoles, canWrite,
      canModify }` per design (`canWrite`/`canModify` fall back to `!isEnableAuth` when `permissions`
      is absent; `canDelete = isFullAdmin && !table?.system`).

## 4. Access API client + server actions

- [x] In `src/server/analytics/analytics-data-api.ts`: add `TABLE_ACCESS_URL(name)` =
      `${TABLE_URL(name)}/access`; `getTableAccess(name, token): Promise<TableAccess | null>` (GET);
      `replaceTableAccess(name, access, token): Promise<ServerActionResponse>` (PUT).
- [x] In `app/[lang]/tables/actions.ts`: add `getTableAccess(name)` and
      `replaceTableAccess(name, access)` server actions using the existing `token()` helper.

## 5. Gate the Tables catalog

- [x] In `TablesView.tsx`, use `useAnalyticsTablePermissions()`; render Create source / Create
      enrichment only when `canCreate`; include the per-row Delete action column only when `canDelete`
      (keep the existing per-row disable for system tables).

## 6. Gate the table detail

- [x] In `TableDetailView.tsx`, use `useAnalyticsTablePermissions(table)`.
- [x] Delete button → `canDelete`; Write rows button → `canWrite`; Add columns button → `canModify`.
- [x] Grid action column (edit/drop) → shown only when `canModify`.
- [x] Inline column-name rename (`editable`) → `canModify`.
- [x] Any table description edit affordance → `canModify`.
- [x] Drop the now-redundant `!isSystem` guards where `permissions` already covers them (keep `isSystem`
      only for the system read-only badge and `canDelete`).

## 7. Full-admin role-management panel

- [x] Add `TableAccessPanel` under `components/Analytics/Tables/` (`DialFormPopup` or section): loads
      via `getTableAccess`, two multi-value role-name inputs (write / modify). Reuse
      `Common/MultiValueAutocomplete` (free-text add).
- [x] Save → `replaceTableAccess` (full replace). Reject blank role names before submit; de-duplicate;
      surface failures via the notification path.
- [x] Mount it in `TableDetailView` only when `canManageRoles` (`FULL_ADMIN`).

## 8. i18n

- [x] Add `AnalyticsTablesI18nKey` keys + `locales/en.ts` strings for the panel (title, Write roles,
      Modify roles, add-role placeholder, save, empty state, blank-role error).

## 9. Tests

- [x] `use-analytics-table-permissions` unit test: matrix over app role × `permissions` × `isEnableAuth`,
      incl. missing `permissions`, system table, and `FULL_ADMIN`.
- [x] `TablesView`: create buttons + row-delete present only for `FULL_ADMIN`.
- [x] `TableDetailView`: write gated by `permissions.write`; modify affordances + action column + inline
      rename gated by `permissions.modify`; delete by `FULL_ADMIN` & non-system; system table unchanged.
- [x] `TableAccessPanel`: editable + Save calls `replaceTableAccess`; blank-role validation; absent for
      non-admins.
- [x] `analytics-data-api` + `tables/actions`: get/replace access hit the right URL with the token;
      error path.

## 10. Verify

- [x] `npm run lint` clean.
- [x] `npx vitest run` for the touched files green (from `apps/ai-dial-admin/`).
- [ ] Manual check against the running service: a user with a table `modify` role edits that table's
      schema but cannot write rows; `FULL_ADMIN` manages roles; system tables expose no edits.
