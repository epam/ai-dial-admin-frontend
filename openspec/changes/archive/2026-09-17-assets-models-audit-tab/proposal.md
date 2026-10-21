## Why

GitHub issue #4200 reports that a model detail view under "Assets → Models" is missing an "Audit tab
with Dashboard and Traces sub-sections", present on "Entities → Models".

Reading the code shows the reporter's navigation label is stale rather than wrong about the gap. The
menu no longer has an "Assets → Models" entry: `MENU_CONFIGURATION` in
`apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx` lists Models only under `Entities`
(`ApplicationRoute.Models`) and under `Catalog` as `PlatformModels` (`ApplicationRoute.PlatformModels`,
`isPreview: true`). This item was moved out of the `Assets` group by the archived change
`2026-08-31-move-platform-items-to-catalog`, one week before this issue — but its component tree still
lives under `src/components/Assets/Platform/Models/` and its capability spec,
`openspec/specs/platform-models/spec.md`, still opens with "The `Assets > Models` admin surface". The
reporter is describing this surface, not a currently-missing "Assets" menu item. This proposal targets
the `Catalog → Models` view backed by `src/components/Assets/Platform/Models/` (route
`/platform-models`).

Comparing the two surfaces directly:

- **Entities → Models** (`apps/ai-dial-admin/src/components/Models/View/TabsContent.tsx`) renders five
  tabs — Properties, Features, Roles, Interceptors, Audit — per `getModelsTabs` in
  `apps/ai-dial-admin/src/utils/tabs/utils.ts`. Its Audit tab renders
  `EntityTabs/Audit/EntityAudit.tsx` with `view={ApplicationRoute.Models}`. `EntityAudit` reads its
  sub-tab set from `getAuditTabs`, which for `ApplicationRoute.Models` returns Dashboard, Traces,
  Conversations, plus an always-present Activities tab.
- **Catalog → Models** (`apps/ai-dial-admin/src/components/Assets/Platform/Models/TabsContent.tsx`)
  renders four tabs — Properties, Features, Roles, Interceptors — per the `ApplicationRoute.PlatformModels`
  branch of `getTabsForAsset` in the same `utils.ts`. There is no `EntityAudit` reference anywhere in
  `Assets/Platform/Models/`. This is confirmed by
  `apps/ai-dial-admin/src/components/Assets/Platform/Models/tests/tabs.spec.ts`, which explicitly
  asserts the tab list is exactly those four and that `EntityViewTab.Audit` is absent, "which has no
  Core counterpart for a config resource" — and by the `platform-models` spec's own requirement,
  "Model asset detail view tab set": "There SHALL be no Audit tab, revision link, rollback control, or
  Core-sync banner, because DIAL Core exposes no audit, revision, history, or snapshot surface for
  config resources."

That stated rationale is accurate for revision/rollback/activity history (Catalog models are
Core `ConfigResourceController` resources with no admin-BE audit trail behind them) but conflates it
with Dashboard/Traces, which are unrelated to that audit trail. `Dashboard`
(`src/components/Telemetry/Dashboard.tsx`) and `UsageLog`
(`src/components/UsageLog/UsageLog.tsx`) both key their analytics query only by
`getEntityFilterName(route, entity)` (`apps/ai-dial-admin/src/utils/telemetry.ts`), which falls back to
the entity's plain `name` for every route except `AssetsToolsets`. Nothing in that path depends on
Core exposing a config-resource audit surface.

A directly analogous case already shipped this pattern for a sibling Core-`ConfigResourceController`
platform asset: `platform-toolsets` (`openspec/specs/platform-toolsets/spec.md`, "Platform toolset
detail view") explicitly reuses `Assets/Toolsets/View/TabsContent` — Properties, Tools, **Audit** —
with `view={ApplicationRoute.AssetsToolsets}`
(`apps/ai-dial-admin/src/components/Assets/Platform/Toolsets/View.tsx`). For that route,
`getAuditTabs` returns only Dashboard and Traces (no Activities, no Conversations) when
`featureFlags.dashboardEnabled` is set. So a platform/Catalog Core-config-resource entity carrying a
Dashboard+Traces Audit tab, with the entity-history sub-tab dropped, is an established pattern in this
codebase — not new ground.

## What Changes

- Add an Audit tab to the Catalog → Models detail view
  (`apps/ai-dial-admin/src/components/Assets/Platform/Models/TabsContent.tsx`), rendering
  `EntityTabs/Audit/EntityAudit` with `view={ApplicationRoute.PlatformModels}` when
  `activeTab === EntityViewTab.Audit` — the same wiring `Assets/Toolsets/View/TabsContent.tsx` already
  uses for `ApplicationRoute.AssetsToolsets`.
- In `apps/ai-dial-admin/src/utils/tabs/utils.ts`:
  - `getTabsForAsset`'s `ApplicationRoute.PlatformModels` branch gains a conditional
    `auditTab(t)`, gated on `featureFlags?.dashboardEnabled`, appended after Interceptors — mirroring
    the existing `ApplicationRoute.AssetsToolsets` branch's conditional push.
  - `getAuditTabs` gains an `ApplicationRoute.PlatformModels` case returning `[dashboardTab(t),
    tracesTab(t)]` only — no Activities, no Conversations — mirroring the existing
    `ApplicationRoute.AssetsToolsets` case.
- Update `openspec/specs/platform-models/spec.md`'s "Model asset detail view tab set" requirement: the
  tab set becomes five tabs when `dashboardEnabled` is set (Properties, Features, Roles, Interceptors,
  Audit), with the Audit sub-tabs limited to Dashboard and Traces; the "no Audit tab" scenario is
  narrowed to "no Activities/revision/rollback/Core-sync-banner surface", not "no Audit tab at all".
- Update the existing tests that assert the opposite of the above:
  `apps/ai-dial-admin/src/components/Assets/Platform/Models/tests/tabs.spec.ts` (currently asserts
  `EntityViewTab.Audit` is absent) and
  `apps/ai-dial-admin/src/components/Assets/Platform/Models/tests/TabsContent.spec.tsx`.

No change to `EntityAudit`, `Dashboard`, `UsageLog`, or `getEntityFilterName` themselves — they already
handle an arbitrary `BaseEntity` + `ApplicationRoute` pair generically.

## Impact

- **Shared components**: `EntityTabs/Audit/EntityAudit.tsx`, `Telemetry/Dashboard.tsx`, and
  `UsageLog/UsageLog.tsx` gain one more call site (unmodified) — same reuse pattern as every other
  entity/asset Audit tab.
- **Shared utils**: `src/utils/tabs/utils.ts` (`getTabsForAsset`, `getAuditTabs`) — both already
  branch per `ApplicationRoute`; this adds one branch/case to each, not new logic shape.
- **Spec**: `openspec/specs/platform-models/spec.md` carries a requirement that directly contradicts
  this change today and must be amended in the same change (SA to draft the delta).
- **No server action, API route, or backend change.** The Audit sub-tabs read from the existing
  analytics pipeline (`DIAL_ANALYTICS_API_URL`, gated by the existing `dashboardEnabled` flag /
  `DISABLE_MENU_ITEMS` env var) exactly as Entities → Models and Catalog → Toolsets already do.
- **No effect on Entities → Models** or on the `Models` entity's own Audit tab.

## Non-goals

- No change to the Audit tab's own content or behavior (Dashboard charts, Traces grid) — reused as-is.
- No Activities (admin activity-log/revision) sub-tab and no rollback/Core-sync banner on Catalog →
  Models — Core's `ConfigResourceController` genuinely exposes no audit/revision surface for this
  resource kind, so that part of the current spec's rationale still holds.
- No Conversations sub-tab — not requested by the issue and not part of the `platform-toolsets`
  precedent this change follows.
- No Audit tab added to any other Catalog/platform entity (App Runners, Interceptors, Routes, Roles,
  Keys) — scoped to Models only, per the issue.
- No renaming of the `Catalog` menu group back to `Assets`, and no other menu/navigation change — the
  stale "Assets → Models" label in the issue and in `platform-models`'s spec Purpose text is left as
  its own possible follow-up, not part of this fix.
- No new feature flag — reuses the existing `dashboardEnabled` flag already gating every other Audit
  tab with Dashboard/Traces sub-sections.
