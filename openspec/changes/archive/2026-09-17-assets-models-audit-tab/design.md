# Design — Catalog ▸ Models Audit tab

## Context

The shape of this change is almost entirely determined by an in-repo precedent:
`Assets/Platform/Toolsets` (spec `platform-toolsets`) already gives a DIAL Core
`ConfigResourceController`-backed platform asset a Dashboard+Traces Audit tab, gated on
`featureFlags.dashboardEnabled`, by reusing `EntityTabs/Audit/EntityAudit`. `Catalog ▸ Models`
(`ApplicationRoute.PlatformModels`, `apps/ai-dial-admin/src/components/Assets/Platform/Models/`) is
structurally identical to it — same `SimpleEntityHeader` + `TabsContent` + `flex-1 overflow-auto`
container. So this file records only the four decisions that were not already made for us, and the
places where this change can go wrong.

## Decisions

1. **Reuse `EntityAudit` addressed as `ApplicationRoute.PlatformModels`.** `EntityAudit`,
   `Telemetry/Dashboard` and `UsageLog/UsageLog` are generic over `(BaseEntity, ApplicationRoute)`;
   `getEntityFilterName` special-cases only `AssetsToolsets` and otherwise falls back to
   `entity.name`, which is exactly the deployment identifier Core keys an API-written platform model
   by. Nothing in those three components changes.

2. **Gate the tab in `getTabsForAsset`, not in `EntityAudit`.** The `Audit` tab is appended to the
   `PlatformModels` branch only when `featureFlags?.dashboardEnabled` is set, mirroring the
   `AssetsToolsets` branch two cases above it.

3. **`getAuditTabs` must return exactly `[Dashboard, Traces]` for `PlatformModels` and must not
   reach the function's trailing `tabs.push(activitiesTab(t))`.** That trailing push is
   unconditional, so a `PlatformModels` case written as a `push` instead of a return would silently
   add an `Activities` sub-tab — the one sub-tab the spec forbids, and the one with no admin-backend
   rows behind it for a Core config resource. The exact expression (extending the existing
   `AssetsToolsets` early return's condition, or a separate early return beside it) is the
   implementer's call; the constraint is the returned array and the non-fallthrough.

4. **`View.tsx` reads `featureFlags` from `useAppContext()`** and passes it as the third argument to
   `getTabsForAsset`, exactly as `Assets/Toolsets/View/View.tsx` and
   `Assets/Platform/Toolsets/View.tsx` do. It is a client component already; nothing is threaded
   through the server page, and no prop is added to `ModelView`.

## Alternatives rejected

- **Render the `Audit` tab unconditionally and let `getAuditTabs` decide what is inside it.**
  Rejected: with `dashboardEnabled` unset, `getAuditTabs` falls through to the unconditional
  `Activities` push, so the user would get an `Audit` tab containing only an activity list that is
  permanently empty for a Core config resource — worse than no tab. Gating at the tab level keeps
  the two functions telling the same story.

- **Full parity with `Entities ▸ Models` (add `Conversations` and `Activities`).** Rejected by the
  proposal's Non-goals and by the backend reality: `Activities` reads the admin backend's
  activity/revision trail, which has no rows for a `ConfigResourceController` resource. Adding it
  would ship an always-empty tab and would need new work with no precedent to reuse.

- **A dedicated `PlatformModelsAudit` component under `Assets/Platform/Models/`.** Rejected: it
  would duplicate `EntityAudit`'s tab/state/time-filter wiring to gain nothing, and the house rule
  is to use shared components rather than fork them. The route enum is already the extension point.

- **A new feature flag for this tab.** Rejected: `dashboardEnabled` already gates every
  Dashboard/Traces Audit surface in the app, and a second flag would have to be documented,
  templated and kept in sync for no behavioural difference.

- **Fixing the `Assets`/`Catalog` naming drift (menu group, spec `Purpose` text, the
  `Assets/Platform/` folder path) while we are in these files.** Rejected: out of scope by EM
  decision; it touches the menu configuration and several specs and belongs in its own change.

## Risks

- **The gating lives in two functions in one file (`src/utils/tabs/utils.ts`), and getting only one
  of them right fails quietly.** `getTabsForAsset` alone → tab appears whose sub-tabs are
  `[Activities]`. `getAuditTabs` alone → nothing appears at all. First place it shows: the tab-set
  unit tests in task 3.1, then the browser verification in task 4.1.

- **The most likely miss is not in the utils at all — it is `View.tsx` never passing
  `featureFlags`.** The util change alone is invisible; the tab still does not appear, which is
  indistinguishable from the reported bug. `getTabsForAsset`'s third parameter is optional, so
  TypeScript will not flag it. That is why task 3.2 asserts the tabs `View` hands to
  `SimpleEntityHeader` rather than only unit-testing the util.

- **Analytics rows are keyed by the model's bare name, so a brand-new platform model shows an empty
  Dashboard and empty Traces.** That is correct — Core records usage under the deployment name, and
  a model nobody has called has no usage — but it will read as "the tab is broken" to anyone
  verifying against a freshly created model. Verify against a model name that has traffic in the
  booted stack.

- **The tab is gated on `dashboardEnabled`, not on `analyticsEnabled`.** A deployment with
  `ANALYTICS_ENABLED` unset but `dashboard` not in `DISABLE_MENU_ITEMS` gets an `Audit` tab whose
  reads fail. This is inherited, not introduced — `Assets ▸ Toolsets` and `Entities ▸ Models` behave
  the same way today — and narrowing it here would change three other surfaces. If it turns out to
  matter, it is one change across all Audit call sites, not a `PlatformModels` special case.

- **What would have to change if the problem's shape changed:** if a future platform asset needs a
  *different* Audit sub-tab set again, the per-route `if` chain in `getAuditTabs` is at the point
  where a route→sub-tabs lookup table would be cheaper than another branch. Two routes sharing
  `[Dashboard, Traces]` is not yet that point.
