## Why

The panel decides who is an admin by asking the admin backend (`UtilityApi.getUserInfo` → `/security-info`,
which maps `FULL_ADMIN` / `READ_ONLY_ADMIN`). That backend is being phased out, and it knows nothing about
org units, so a unit user (a caller with roles inside units but no admin rights) can neither reach the panel
nor be told what they may do. DIAL Core's new `GET /v1/user/org-units` (ai-dial-core PR #2209) answers all of
it in one call: `adminAccess` (`FULL` | `NONE`) plus the units the caller works in, with roles and per-namespace
permissions. The panel should take every role and permission decision from it.

## What Changes

- Add a Core client read for `GET /v1/user/org-units` and a typed `UserAccess` model
  (`adminAccess`, `units[]` with `roles` and `permissions`).
- Replace the role-bearing `getUserInfo` picker in `src/app/api/api.ts` with a per-request cached
  `getUserAccess(token)`. **BREAKING**: `UtilityApi.getUserInfo`, `SECURITY_INFO_URL`, the `UserRole` enum and
  `UserInfo.roles` are removed; the admin backend no longer decides roles.
- `CoreUtilityApi.getUserInfo` (`/v1/user/info`) stays and becomes the only identity read, feeding
  `AppContext.userInfo` (`id`, `email`) — no longer used for roles.
- `AppContext` carries the access (`adminAccess`, `units`) and derives `isFullAdmin`, `isUnitMode`, and
  `isReadOnlyAdmin`. Read-only plumbing is kept as is; `isReadOnlyAdmin` is **always false for now** apart from
  the existing config-file entity override, until Core emits a read-only admin access level.
- Start gate: `FULL` → full panel; `NONE` with any unit → unit mode; `NONE` with no units → the 403 page.
  A `404` (org units off) counts as full admin; so does authentication being disabled.
- Unit mode: menu sections shown by `read` on the section's namespace in any unit; the `platform` root and
  admin-only config reads are skipped; create/edit/delete in a folder gated by `write` on the namespace at the
  owning unit; approve/reject gated by `publications` read+write; Role assignments tab gated by
  `role-assignments` read/write.
- `isFullAdminCaller` (server) reads the same cached access instead of the admin backend.

## Capabilities

### New Capabilities
- `user-org-units-access`: the caller's access read from Core (`adminAccess`, units, roles, permissions), the
  start-mode gate (full / unit / denied, 404 and auth-off as full), how `AppContext` exposes it, and the
  unit-mode rules for menu sections, folder write actions, approve/reject and the role-assignments tab.

### Modified Capabilities
- `utility-core-api`: the "identity read prefers the admin backend" requirement becomes "identity read is
  Core-only and carries no roles"; the `getUserInfo` picker is removed.
- `analytics/tables`: the "role capability model" requirement defines `isFullAdmin` from `userInfo.roles`; it
  now derives from `adminAccess`.

## Non-goals

- Removing `UtilityApi` or `DIAL_ADMIN_API_URL`: import/export, config sync, version and the footer still use
  the admin backend, and `adminApiEnabled` keeps gating them.
- A real read-only admin level; waits on Core (`adminAccess: READ_ONLY` follow-up).
- Replacing `OrgUnitsContext`'s own `GET /v1/org-units/public?recursive=true` read with the new `items[]`.
- Backward compatibility for deployments relying on the admin backend's `READ_ONLY_ADMIN` role: those callers
  now resolve as `NONE`.

## Impact

- Code: `src/app/api/api.ts`, `src/server/utility-api.ts`, `src/server/core/core-utility-api.ts`,
  `src/server/user-access.ts`, `src/utils/auth/full-admin.ts`, `src/models/user-info.ts`,
  `src/context/AppContext.tsx`, both layouts, `src/components/Menu/**`, `src/components/Assets/utils.ts`,
  `src/components/Common/FileManager/utils.ts`, Publications approve/reject, org-unit roles tab.
- Shared surface: `useAppContext().isFullAdmin` / `isReadOnlyAdmin` have ~140 consumers; their meaning for a
  full admin is preserved, so consumers are untouched.
- Risks: a Core with auth on and no admin rules answers `NONE` with no units for everyone, so the panel shows
  the 403 page — a deployment-config prerequisite to call out in release notes. The Analytics service's own
  `FULL_ADMIN` is a separate concept; the panel's `isFullAdmin` only gates its affordances.
- Depends on ai-dial-core PR #2209 (open); re-check the response shape before merge.
