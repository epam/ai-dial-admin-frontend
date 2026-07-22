# Design

## Backend contract (as delivered by `caller-table-permissions`)

Confirmed against branch `worktree-caller-table-permissions`:

1. **`permissions` on the table DTO** — `TableDto` gains a nested, read-only
   `permissions: { write: boolean, modify: boolean }` on `GET /v1/tables` (list) and
   `GET /v1/tables/{name}` (and on create/update/patch responses, which reuse the DTO). It is **always
   present**, both booleans. Computed by `TableCallerPermissions`, sharing role-matching with
   `TableAccessEvaluator` so reporting and enforcement cannot drift:
   - `system` table → `{false, false}` for **every** caller (incl. `FULL_ADMIN`);
   - else `FULL_ADMIN` → `{true, true}`;
   - else each flag = caller's provider-role ∩ that list ≠ ∅ (independent);
   - `none` mode → `{true, true}` for non-system tables.
2. **`/v1/tables/{name}/access` unchanged** — `GET` and `PUT` both `FULL_ADMIN`-only. Role *lists* stay
   invisible to non-admins.

Consequence: the FE reads the two booleans straight off each table and never needs the caller's raw
provider roles or the table's lists. System-table protection is already folded into the flags.

## Deferred: read-only-admin viewing of role lists

The original intent (a `READ_ONLY_ADMIN` seeing, read-only, a table's assigned roles) is **not
supported** by the delivered backend: `GET /access` is `FULL_ADMIN`-only, and `permissions` reports only
the caller's own effective write/modify — not the lists. So the role-management panel is
`FULL_ADMIN`-only here. Enabling the read-only view is a follow-up requiring a backend `GET /access`
relaxation; deliberately out of scope until then.

## Capability sources in the FE

- **Application role** — from the core admin `security-info` `userInfo.roles` (already in `AppContext`).
  Governs catalog actions (create/delete) and role management.
- **Per-table capability** — `table.permissions.write` / `.modify`. Governs the per-table edits.

`AppContext` exposes `isFullAdmin = !isEnableAuth || roles.includes(FULL_ADMIN)`, the existing
`isReadOnlyAdmin`, and raw `isEnableAuth` (for the per-table fallback).

## One hook returns the decisions

`useAnalyticsTablePermissions(table?)`:

```ts
{
  canCreate:      isFullAdmin,                                  // create source / enrichment
  canDelete:      isFullAdmin && !table?.system,               // delete (admin, never on system)
  canManageRoles: isFullAdmin,                                 // GET+PUT /access (view+edit; admin-only)
  canWrite:       table?.permissions?.write  ?? !isEnableAuth,  // insert rows
  canModify:      table?.permissions?.modify ?? !isEnableAuth,  // schema + description
}
```

- `canWrite`/`canModify` trust the backend flag; `?? !isEnableAuth` keeps the surface open in `none`
  mode if `permissions` is somehow absent, and defaults to read-only (safe) when auth is on.
- No need to re-OR `isFullAdmin` into write/modify — the backend already returns `true` for admins.
- No need for a separate `system` guard on write/modify — the backend reports `{false,false}` for
  system tables, so those affordances hide on their own. `canDelete` keeps an explicit `!system`
  because `permissions` does not cover delete.

## Gating map

| Affordance | Component | Gate |
|---|---|---|
| Create source / enrichment | `TablesView` | `canCreate` |
| Delete (list row action column) | `TablesView` | `canDelete` (per-row disable for system stays) |
| Delete table (detail button) | `TableDetailView` | `canDelete` |
| Write rows | `TableDetailView` | `canWrite` |
| Add columns / edit / drop / inline rename / metadata / description | `TableDetailView` | `canModify` |
| Role-management panel (view + edit) | `TableDetailView` | `canManageRoles` |

Hide, don't disable — consistent with `isReadOnlyAdmin` usage elsewhere. Independence holds: a
`can_write`-only caller sees Write rows but no schema affordances, and vice-versa.

## Role-management panel

A `DialFormPopup`/section on the detail view, mounted only when `canManageRoles`:

- Loads via `getTableAccess(name)`; two multi-value **text** inputs (write / modify role names — free
  text, no roles-list source). Reuse `Common/MultiValueAutocomplete` (ui-kit `DialTag` chips;
  `availableItems` empty ⇒ pure free-text add).
- Save issues `replaceTableAccess(name, {write, modify})` (full replace). Blank role names rejected
  before submit (backend also 422s); duplicates de-duplicated. Failures surface via the notification
  path.

## Data flow

- `AnalyticsTable.permissions?` arrives with the existing `getTables`/`getTable` fetches — no extra
  request for gating.
- New `TableAccess { write: string[]; modify: string[] }`; `TABLE_ACCESS_URL(name)` =
  `${TABLE_URL(name)}/access`; `getTableAccess`/`replaceTableAccess` on `AnalyticsDataApi`; matching
  server actions using the existing `token()` helper.

## Defense in depth

The UI gate is usability, not security. The backend authorization and its `403` remain authoritative
for anything the UI does not pre-filter, surfaced through the existing error-notification path.

## Testing

- **Hook**: matrix over app role × `permissions` × `isEnableAuth`, incl. missing `permissions`
  (read-only when auth on, open when off), `system` table (`canDelete` false), and `FULL_ADMIN`.
- **`TablesView`**: create + row-delete present only for `FULL_ADMIN`.
- **`TableDetailView`**: write gated by `permissions.write`; modify affordances + action column + inline
  rename gated by `permissions.modify`; delete by `FULL_ADMIN` & non-system; system table exposes
  nothing.
- **Panel + API/actions**: get/replace hit the right URL with the token; blank-role validation; save
  calls `replaceTableAccess`; panel absent for non-admins.

## Out of scope / deferred

- Backend `GET /access` relaxation to enable read-only-admin role viewing.
- Role autocomplete/directory; access-change audit; per-table gating of read/query paths.
