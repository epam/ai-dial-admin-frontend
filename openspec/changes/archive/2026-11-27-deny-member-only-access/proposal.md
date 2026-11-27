## Why

A caller whose only role is `member` is let into the panel. Core defines `member` as `read` on `org-units` and nothing
else ("Sees the unit and its child units, not their content"), so such a caller can read no content section. The panel
still resolves them to unit mode because `resolveUserAccess` enters it for any caller with at least one unit, and
renders the panel around an empty or wrong menu instead of the 403 page (issue #5446).

## What Changes

- `resolveUserAccess` enters unit mode only when some unit grants `read` on a namespace the panel can show. A caller
  with `adminAccess: NONE` whose units grant nothing of the kind resolves to denied, which already renders the 403 page
  with no menu and no panel.
- The set of namespaces that count is derived from `ROUTE_NAMESPACES` (`utils/org-units/namespaces.ts`), the same map
  that decides which menu items a unit user sees, so the gate and the menu cannot drift apart.
- Units a denied caller holds are dropped with the rest of the access (`units: []`), as in the existing no-units case.
- A caller who is `member` at one unit and `viewer` (or any content role) at another stays in unit mode; the `member`
  unit stays in `units` for the tree and breadcrumbs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-org-units-access`: "Start mode follows the access read" — unit mode needs a readable content namespace, not
  merely a unit; a caller with units that grant none resolves to denied.

## Non-goals

- No change to the menu filter (`filterMenuForUnitMode`), `AppContext`, or the 403 page. They already behave correctly
  once the mode is denied.
- No change to Core or to what `member` grants.
- `org-units` alone never counts as readable: no menu item or page depends on it.
- No new "empty state" for unit mode. A caller with nothing to read is denied, not shown an empty panel.

## Impact

- `apps/ai-dial-admin/src/utils/auth/user-access.ts` — the unit-mode condition.
- `apps/ai-dial-admin/src/utils/org-units/namespaces.ts` — export the routable namespaces for the gate to reuse.
- `apps/ai-dial-admin/src/utils/auth/tests/user-access.spec.ts` — new cases.
- `openspec/specs/user-org-units-access/spec.md` — requirement and scenarios.
- Shared by the server (`server/user-access.ts`, root layout) and the client context, so both pick the change up from
  the one function. Callers who today land in unit mode with an empty or broken menu now see the 403 page.
