## Context

Role decisions come from two places today. `getUserInfo` in `src/app/api/api.ts` picks the admin backend's
`/security-info` (roles `FULL_ADMIN` / `READ_ONLY_ADMIN`) when `DIAL_ADMIN_API_URL` is set, otherwise Core's
`/v1/user/info` with `roles: []`. `AppContext` turns those roles into `isFullAdmin` (via the shared
`resolveIsFullAdmin`) and `isReadOnlyAdmin`; `isFullAdminCaller` repeats the read server-side. The root layout
shows `Page403Wrapper` when the identity read fails.

Core now offers `GET /v1/user/org-units` (ai-dial-core PR #2209, open): `adminAccess` `FULL | NONE` plus
`items[]` (`id`, `name`, `displayName`, `path`, `folder`, `roles`, `permissions: namespace → actions`). It
answers 404 while `orgUnits.enabled` is off, and `NONE` also when no admin rules are configured. Applications
and API keys always get `NONE` and no units.

`isReadOnlyAdmin` has ~140 consumers and the asset/file-manager action lists
(`Assets/utils.ts`, `Common/FileManager/utils.ts`) already take it as a parameter, which makes them the
choke point for per-folder gating.

## Goals / Non-Goals

**Goals:**
- One Core read decides start mode, menu, and write affordances; the admin backend decides none of them.
- Keep identity (`id`, `email`) on `CoreUtilityApi.getUserInfo`, feeding `AppContext.userInfo`.
- Full-admin behavior is unchanged for every existing consumer of `isFullAdmin` / `isReadOnlyAdmin`.

**Non-Goals:**
- Removing `UtilityApi` / `adminApiEnabled` (import/export, sync, version still use them).
- A read-only admin level (Core follow-up), seeding `OrgUnitsContext` from `items[]`.

## Decisions

### D1. Model: `UserAccess` resolved to a mode, stored in `AppContext`
`src/models/user-access.ts` holds `AdminAccess` (enum `FULL`, `NONE`, `READ_ONLY`), `UserOrgUnit`
(`OrgUnit` fields + `roles: string[]`, `permissions: Record<string, UnitAction[]>`), `UnitAction`
(`read`, `write`), `UserAccess { adminAccess, units }`, and `AccessMode` (`FULL`, `UNIT`, `DENIED`).
`READ_ONLY` is declared but Core does not emit it yet; `isReadOnlyAdmin` derives from it, so it is always false
today and lights up when Core ships the level. The server resolves the response once with a pure util
`resolveUserAccess` and passes `{ mode, adminAccess, units }` to `AppContextProvider` as `userAccess`.

*Alternative:* a separate `UserAccessContext`. Rejected — the request was for access to live in `AppContext`,
and `isFullAdmin` / `isReadOnlyAdmin` are already there.

### D2. Mode resolution (pure, in `src/utils/auth/`)
`resolveAccessMode(isEnableAuth, result)`:

```
auth disabled                      → FULL   (nothing enforced; Core is not called)
404                                → FULL   (org units off: Core gives no admin signal; Core still 403s real calls)
success, adminAccess FULL          → FULL
success, NONE, items.length > 0    → UNIT
success, NONE, no items            → DENIED
any other failure (401/403/5xx)    → DENIED
```

`full-admin.ts`'s `resolveIsFullAdmin(adminApiEnabled, …)` is replaced; `adminApiEnabled` no longer affects who
is a full admin. The old "no admin backend ⇒ everyone is full admin" rule survives only as 404/auth-off.

### D3. One cached server read: `getUserAccess()`
`src/server/user-access.ts` exports `getUserAccess = cache(async () => …)` (React `cache`, per request) wrapping
`CoreUtilityApi.getUserOrgUnits`. It takes no argument and resolves the token itself: the token object is new on
every `getUserToken` call, so a token-keyed `cache` would never hit. The root layout (403 gate), `[lang]/layout` (context) and `isFullAdminCaller`
all call it, so a request makes one Core call. `CoreUtilityApi` already owns `v1/user/info`, so the sibling
`v1/user/org-units` read lives there rather than in a new client.

*Alternative:* put it on `CoreOrgUnitsApi` (`v1/org-units/public…`). Rejected — that client is the unit-admin
surface; this is the caller's own identity/access, next to `getUserInfo`.

### D4. Identity read no longer gates the page
The root layout's 403 now follows `mode === DENIED`, not the identity read. `userInfo` is fetched alongside and
a failure leaves it `undefined` (email/id unavailable) instead of locking the user out — the identity read
decides nothing about access any more.

### D5. `AppContext` derivations
`isFullAdmin = adminAccess === FULL` (404 and auth-off resolve to a synthetic `FULL`); `isUnitMode = mode === UNIT`;
`isReadOnlyAdmin = isEntityReadOnly || adminAccess === READ_ONLY`. The `adminApiEnabled` term is dropped from
`isReadOnlyAdmin`. New helpers on the context: `canReadNamespace(ns)` (any unit grants `read`) and
`canWriteAt(ns, path)` (nearest unit by `folder` prefix grants `write`; full admin is always true). The owning
unit lookup reuses `getOwningUnit` from `utils/org-units/units`, so ownership has one definition. `UserRole`
and `UserInfo.roles` are deleted.

### D6. Unit-mode surfaces
- **Menu:** sections map to namespaces (Applications `applications`, Toolsets `toolsets`, Prompts `prompts`,
  Files `files`, Skills `skills`, Conversations `conversations`, Approvals `publications`); in unit mode a
  section shows when `canReadNamespace` holds. Platform/admin-only groups are hidden, matching the existing
  group-visibility mechanism.
- **Skipped reads:** unit mode skips the `platform` root and admin-only config reads — notably the
  `telemetryApi` call in `[lang]/layout` — which a unit user would only be refused.
- **Folder write actions:** `getGridActionLabels` / `getTreeActionLabels` / `getToolbarOptionLabels` already
  take a read-only boolean. Callers pass `isReadOnlyAdmin || !canWriteAt(namespace(view), currentPath)`; the
  util signatures do not change.
- **Approve/reject:** enabled only when `publications` `read` + `write` hold at every unit the request touches
  (its target folder and each resource's target).
- **Role assignments tab:** shown on a unit when `role-assignments` `read` holds there; mutating controls need
  `write`. Replaces the "try the call, handle 403" approach.

### D7. Removals
`UtilityApi.getUserInfo`, `SECURITY_INFO_URL`, the `getUserInfo` picker in `api.ts`, `UserRole`, and
`UserInfo.roles`. `CoreUtilityApi.getUserInfo` keeps its `roles: []` placeholder removed along with the field.

## Risks / Trade-offs

- [BE `READ_ONLY_ADMIN` callers now resolve as `NONE`] → accepted; stated in the proposal and release notes.
- [Core with auth on and no admin rules ⇒ 403 page for everyone] → document as a deployment prerequisite.
- [`isFullAdmin` now means Core's `adminAccess`, which feeds Analytics table affordances] → the analytics
  service enforces its own `FULL_ADMIN`; the panel flag only gates UI, so a mismatch hides or shows a button the
  service would still refuse. Delta on `analytics/tables` records the new source.
- [PR #2209 is open; shape may change] → one typed DTO in `src/models/dial/`, re-checked against
  `docs/open_api_core.yaml` before merge.
- [Per-folder gating reaches many call sites] → confined to the places that already build action lists from a
  read-only boolean; no consumer of `isReadOnlyAdmin` changes meaning for a full admin.

## Open Questions

- Namespace for `view` → which `ApplicationRoute`s map to which namespace (e.g. `ApplicationRoute.Skills` vs
  Projects) — settle while implementing the mapping util, with a test per route.
- Whether the `READ_ONLY` enum member should exist before Core emits it (kept here for plumbing; drop if review
  prefers).
