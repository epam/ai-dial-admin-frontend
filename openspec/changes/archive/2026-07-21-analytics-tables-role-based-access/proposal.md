## Why

The Analytics data-access service enforces **role-based access** on its table endpoints, at two
granularities:

- **Catalog-level, admin-only**: creating a source/enrichment table and deleting a table require
  `FULL_ADMIN`.
- **Per-table, role-delegated**: each table carries two lists of provider role names —
  `write` (may insert rows) and `modify` (may change schema/description), independent of each other.
  A caller is authorized when it is `FULL_ADMIN` or one of its provider roles is in the table's list
  for that operation.

The frontend Tables UI is blind to this — it shows the same fully-editable surface to everyone who can
open the catalog, so a non-permitted operator only learns of a restriction from a `403`. This change
makes the Tables UI present exactly the affordances each operator is allowed to use.

## Backend contract (implemented in `caller-table-permissions`)

The backend now reports each caller's effective per-table permissions, so the FE never re-implements
authorization. Confirmed from branch `worktree-caller-table-permissions`:

- **`permissions` object on the table DTO** — `GET /v1/tables` list items and `GET /v1/tables/{name}`
  (and create/update/patch responses, which reuse the DTO) carry
  `permissions: { write: boolean, modify: boolean }`, always present. Semantics mirror enforcement:
  `FULL_ADMIN` → both `true`; a `system` table → both `false` for **every** caller (incl. `FULL_ADMIN`);
  `none` mode → both `true`; otherwise each flag is the caller's provider-role match against that
  table's list.
- **`/v1/tables/{name}/access` is unchanged** — both `GET` and `PUT` stay `FULL_ADMIN`-only. The role
  *lists* remain invisible to non-admins.

### Gap vs. the original intent (needs a decision)

The original picture had **read-only admins able to *see* a table's assigned roles** (read-only). The
delivered backend does **not** support that — `GET /access` is still `FULL_ADMIN`-only, and the new
`permissions` object reports only the caller's *own* effective write/modify, not the role lists. So as
built, the role-management panel can be **`FULL_ADMIN`-only** (view + edit). Letting a `READ_ONLY_ADMIN`
view the lists would need a further backend change (relax `GET /access`). This proposal is written to
the backend as-delivered; the read-only-admin role view is called out as deferred.

## What Changes

- **`AnalyticsTable` model** gains an optional `permissions?: { write: boolean; modify: boolean }`, plus
  a `TableAccess { write: string[]; modify: string[] }` model for the access API.
- **Capability inputs on `AppContext`**: `isFullAdmin` (auth-aware) and `isEnableAuth`, alongside the
  existing `isReadOnlyAdmin`. (The coarse `canModifyAnalyticsTables` flag from the first cut is not
  reintroduced.)
- **Permissions hook** `useAnalyticsTablePermissions(table?)` → `{ canCreate, canDelete, canManageRoles,
  canWrite, canModify }`.
- **Tables list (`TablesView`)**: Create source / Create enrichment and the per-row Delete action shown
  only to `FULL_ADMIN` (per-row Delete stays disabled for system tables as today).
- **Table detail (`TableDetailView`)**:
  - Delete table → `FULL_ADMIN` and non-system.
  - Write rows → `table.permissions.write`.
  - Add/drop/rename columns, column-metadata edits, inline rename, description edits →
    `table.permissions.modify`. (System tables report both `false`, so these hide automatically.)
- **Role-management panel** on the detail view: `FULL_ADMIN` reads and full-replaces the table's
  `write` / `modify` provider-role lists via new `getTableAccess` / `replaceTableAccess`
  (`GET`/`PUT /v1/tables/{name}/access`). Not shown to non-admins (backend forbids the read).
- **Auth disabled (`none`)**: surface stays fully open (flags resolve `true`; the fallback handles a
  missing `permissions`).

## Non-goals

- **No backend changes.** Consumes the delivered `caller-table-permissions` contract as-is.
- **Read-only-admin viewing of role lists — deferred** (needs a backend `GET /access` relaxation).
- **No role picker/directory** — provider role names are free text (there is no roles-list endpoint).
- **No change to `isReadOnlyAdmin` semantics** or its ~112 non-analytics consumers.
- **No gating of read/query paths** beyond backend behavior; sensitive-column filtering stays backend-side.

## Capabilities

### Modified Capabilities

- `analytics`: the Tables UI becomes role-aware — catalog actions gated by `FULL_ADMIN`, per-table
  row-write and schema/description edits gated by the backend `permissions` object, and a
  `FULL_ADMIN`-only per-table role-list management panel.

## Impact

- **Context**: `src/context/AppContext.tsx` — add `isFullAdmin`, `isEnableAuth` (accept `isEnableAuth`
  prop); `app/[lang]/layout.tsx` passes it.
- **Model**: `src/models/analytics/table.ts` — `permissions?`, `TableAccess`.
- **Hook**: `src/hooks/use-analytics-table-permissions.ts`.
- **API client**: `src/server/analytics/analytics-data-api.ts` — `TABLE_ACCESS_URL`, `getTableAccess`,
  `replaceTableAccess`.
- **Server actions**: `app/[lang]/tables/actions.ts` — `getTableAccess`, `replaceTableAccess`.
- **Components**: `TablesView.tsx`, `TableDetailView.tsx`, new `TableAccessPanel`.
- **i18n**: new `AnalyticsTablesI18nKey` keys.
- **Tests**: hook, both views, panel, access API/actions.
- No impact on other app sections or on `none`-mode deployments.
