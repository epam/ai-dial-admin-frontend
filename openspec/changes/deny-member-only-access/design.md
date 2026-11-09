## Context

`resolveUserAccess` (`utils/auth/user-access.ts`) maps Core's `GET /v1/user/role-assignments` answer to full, unit or
denied. It is the one function behind both the server (`server/user-access.ts`, root layout) and the client
`AppContext`. Today `adminAccess: NONE` with `units.length > 0` is unit mode.

Core's built-in `member` role grants `read` on `org-units` only (`OrgUnitRoles.java`, `docs/org-units.md`): it lets
someone find a unit deeper in the tree without reading any content. So a `member`-only caller holds a unit whose
`permissions` is `{"org-units": ["read"]}`, passes the `units.length > 0` check, and gets a panel with nothing to
show. Denied already renders the 403 page and no children (`app/layout.tsx`), which is the wanted outcome.

## Goals / Non-Goals

**Goals:** a caller with no readable content section gets the 403 page, on every route, with no menu.

**Non-Goals:** changing the menu filter, `AppContext`, the 403 page, or Core's roles; giving `org-units` any UI of its
own.

## Decisions

**Gate on readable content in `resolveUserAccess`, not in the layout or the menu.** The function is shared, so one
change covers the server layout, the client context and every server-side admin check, and the denied branch already
exists. Alternatives: checking in `app/layout.tsx` would leave `AppContext` and `isFullAdminCaller` disagreeing about
the mode; hiding everything in `filterMenuForUnitMode` would leave an empty panel, which is the symptom, not the fix.

**"Readable" means `read` on any namespace in `ROUTE_NAMESPACES`.** That map already defines which namespaces a unit
user can reach (nine, including `publications` and `role-assignments`). Exporting its namespace set and reusing it
keeps the gate and the menu from drifting when a route is added. Alternative: a second hard-coded list in
`user-access.ts` — rejected, it is the drift the shared map prevents. `org-units` is not in the map, so it never
counts.

**Reuse the existing `canReadNamespace` predicate.** `utils/org-units/access.ts` already answers "does any unit grant
`read` on this namespace"; the gate is `routableNamespaces.some((ns) => canReadNamespace(units, ns))`. No new grant
logic.

**A denied result keeps `adminAccess` and empties `units`,** matching the existing `{ ...DENIED_ACCESS, adminAccess }`
branch, so nothing downstream sees units for a caller who was refused.

**Mixed callers are unaffected.** `member` at a parent and `viewer` at a child has a readable namespace at the child,
so the mode stays unit and the `member` unit remains in `units` for the tree and breadcrumbs.

## Risks / Trade-offs

- [A role that grants only `org-units: read` plus a namespace the panel has no route for (a future Core namespace)]
  → denied until a route is added to `ROUTE_NAMESPACES`; acceptable, and the same rule the menu already applies.
- [A user relying on the empty panel to reach `/folders-storage` by URL] → `role-assignments: read` is in the map, so
  such a caller is allowed; one without it could not read the page anyway.
- [Server and client both evaluate the gate] → they run the same function on the same response, so they cannot differ.

## Migration Plan

None. No data, config or API change. Rollback is reverting the condition.

## Open Questions

None.
