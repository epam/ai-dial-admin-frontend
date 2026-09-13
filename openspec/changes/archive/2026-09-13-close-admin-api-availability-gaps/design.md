## Context

`2026-09-10-hide-ui-without-admin-api` (PR #4516) added `featureFlags.adminApiEnabled` and used it
to hide the Import/Export menu actions, suppress the Footer/status polling, and redirect a fixed
list of routes home when `DIAL_ADMIN_API_URL` is unset. That route list covers the Entities,
Builders, Access Management, and Audit menu groups — but two admin-backend-dependent surfaces live
outside those routes and were left ungated:

- The per-entity **Audit tab**, added by `auditTab()` in `utils/tabs/utils.ts` and rendered via
  `components/EntityTabs/Audit/EntityAudit.tsx`. Its sidebar always includes an Activities pane
  backed by `ActivityAuditApi` (`ACTIVITIES_URL`/`ACTIVITY_AUDIT_URL`/`ACTIVITY_AUDIT_ROLLBACK_URL`),
  which is built on `DIAL_ADMIN_API_URL` in `app/api/api.ts`. This tab is reachable independent of
  `adminApiEnabled` on surfaces gated by a different flag: Deployments Containers/Images
  (`deploymentsEnabled`), Analytics Pipelines/Tables (evaluation/analytics flags), and Assets ▸
  Platform Models / Toolsets (`dashboardEnabled`).
- The Assets ▸ Applications list (`assets-applications/page.tsx`) and detail
  (`assets-applications/[id]/page.tsx`) server pages, which call `applicationRunnersApi` and
  `applicationsApi` — both admin-backend clients (`host: process.env.DIAL_ADMIN_API_URL`) — to build
  runner options and populate the Dependencies tab, even though the rest of these pages is
  Core-direct (`assetApi`, `getModelsList`, `readConfigEntities`).

## Goals / Non-Goals

**Goals:**

- Hide the per-entity Audit tab wherever it is added, on every surface, whenever
  `featureFlags.adminApiEnabled` is `false` — independent of whatever other flag governs that
  surface's own visibility.
- Stop the Assets ▸ Applications list/detail pages from calling admin-backend APIs when
  `DIAL_ADMIN_API_URL` is unset, letting them run on Core-direct data alone like Assets ▸ Toolsets
  already does.

**Non-Goals:**

- Splitting `EntityAudit`'s internal sidebar so only the Activities pane is gated while
  Dashboard/Traces/Conversations remain visible. The whole Audit tab is hidden as one unit — this
  matches how the top-nav Audit menu group is already hidden as a whole (`menu-group-visibility`),
  and avoids a partially-populated sidebar with only some panes present.
- Changing behavior for entities whose routes are already redirect-guarded
  (Models/Applications/Roles/Keys/Interceptors/InterceptorTemplates/Adapters/ApplicationRunners/
  Routes/Toolsets) — gating their Audit tab too is defense-in-depth/consistency, not a fix for an
  observable bug, since those routes are unreachable without the admin API regardless.
- Any change to Assets ▸ Toolsets — its list and detail pages were verified to already be
  Core-direct.

## Decisions

### D1: Gate the Audit tab centrally in each tab-builder, not by filtering inside `EntityAudit`

Each entity's tab list is built by a small set of functions in `utils/tabs/utils.ts`
(`getRouteTabs`, `getApplicationTabs`, `getModelsTabs`, `getAdapterTabs`, `getAppRunnerTabs`,
`getRoleTabs`, `getInterceptorTabs`, `getToolsetTabs`, `getInterceptorTemplateTabs`, `getKeyTabs`,
`getDeploymentsViewTabs`, and `getTabsForAsset`'s `AssetsToolsets`/`PlatformModels` branches). Each
already takes `t`, and `getTabsForAsset`/`getAuditTabs` already take `featureFlags` for their own
flag checks. Threading `featureFlags: FeatureFlags` into the remaining builders and conditionally
omitting `auditTab(t)` there is the smallest change consistent with the existing pattern (e.g.
`getTabsForAsset`'s `dashboardEnabled` checks) and keeps the gating logic at the single place each
entity's tab list is assembled, rather than adding a second check inside `EntityAudit` (which would
leave a dead tab entry pointing at a component that renders nothing).

**Alternative considered:** have `EntityAudit` itself return `null` when `!adminApiEnabled`. Rejected
— the tab button would still render and be clickable, showing an empty panel instead of the tab
disappearing, which doesn't match how the top-nav Audit group behaves (absent, not present-but-empty).

### D2: `getTabsForAsset`'s Toolsets/Platform Models branches require *both* flags

```ts
if (featureFlags?.dashboardEnabled && featureFlags?.adminApiEnabled) {
  tabs.push(auditTab(t));
}
```

`dashboardEnabled` and `adminApiEnabled` gate different sub-panes of the same tab (Dashboard/Traces
need the former, Activities needs the latter), but since D1 hides the tab as one unit, showing it
requires both dependencies to be satisfiable. This is additive to the existing check, not a
replacement — `dashboardEnabled` still fully governs these branches when the admin API is available,
matching today's behavior exactly.

### D3: Skip the admin-backend calls in Assets ▸ Applications behind `process.env.DIAL_ADMIN_API_URL`, not `featureFlags.adminApiEnabled`

`assets-applications/page.tsx` and `assets-applications/[id]/page.tsx` are server components that
run before `featureFlags` (computed in the root layout) is available to them as a prop, and the
existing redirect guard in `admin-api-availability` already reads `process.env.DIAL_ADMIN_API_URL`
directly at the same layer for the same reason. Reading the env var directly here keeps this
consistent with that precedent rather than introducing a new way to plumb the flag into a server
page.

Both calls are already wrapped in the pages' existing `try`/`catch`, and `applicationSchemes`/
`applications` already default to `[]` — so skipping the calls when the env var is unset needs no
new fallback plumbing; `buildAppRunnerOptions` and the Dependencies tab already tolerate an empty
list (this is exactly what happens today on any transient failure of those calls).

## Risks / Trade-offs

- **[Risk]** Threading `featureFlags` into ~10 `View.tsx` components that don't currently read
  `useAppContext()` touches a wide, low-complexity surface, and mechanical passes like this always
  have a hydration/memoization pitfall if a per-render `useMemo` dependency is missed. →
  **Mitigation:** each tab list is built once per render already (not derived from an unstable
  reference), and `featureFlags` from `useAppContext()` is a stable object per the existing
  `AppContext` provider — matching the exact pattern already in use in `Toolsets`' `TabsContent`
  callers via `getTabsForAsset`.
- **[Risk]** Gating the Audit tab on entities that are already redirect-guarded is dead code from an
  end-user's perspective (unreachable either way), adding surface area for no observable benefit. →
  **Mitigation:** accepted as intentional per the proposal's Non-goals — the cost is a one-line
  conditional per builder, and it removes an inconsistency a future change (e.g. one that loosens the
  redirect guard) could otherwise reintroduce silently.

## Migration Plan

No data migration or environment variable changes. This is a pure UI-gating change behind an
existing flag/env var; rollout is the standard PR merge + deploy. No feature flag toggle or
rollback beyond reverting the commit is needed.

## Open Questions

None outstanding — scope and flag semantics were confirmed during exploration (see this change's
proposal for the resolved decisions).
