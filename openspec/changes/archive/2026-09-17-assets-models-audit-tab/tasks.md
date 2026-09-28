# Tasks — Catalog ▸ Models Audit tab

Reference for every task: `apps/ai-dial-admin/src/components/Assets/Platform/Toolsets/View.tsx` and
`apps/ai-dial-admin/src/components/Assets/Toolsets/View/TabsContent.tsx` — the same wiring for the
sibling platform asset that already ships this tab. Read them before writing anything new.

The consolidated spec `openspec/specs/platform-models/spec.md` is **not** edited by hand in these
tasks: the delta in `openspec/changes/assets-models-audit-tab/specs/platform-models/spec.md` amends
the `Model asset detail view tab set` requirement and lands in the consolidated spec when the change
is archived (`openspec archive`) or synced.

## 1. Tab configuration

- [x] 1.1 In `apps/ai-dial-admin/src/utils/tabs/utils.ts`, make both tab functions agree about
      `ApplicationRoute.PlatformModels`: `getTabsForAsset`'s `PlatformModels` branch appends
      `auditTab(t)` after `interceptorsTab(t)` only when `featureFlags?.dashboardEnabled` is set
      (mirroring the `AssetsToolsets` branch above it), and `getAuditTabs` returns exactly
      `[dashboardTab(t), tracesTab(t)]` for `PlatformModels`. **`getAuditTabs` ends with an
      unconditional `tabs.push(activitiesTab(t))` — the `PlatformModels` case must return before
      reaching it**, or the forbidden `Activities` sub-tab appears. Both functions live in this one
      file on purpose; do not split it. Leave every other route's behaviour untouched.
      Verify with `npx vitest run src/utils/tabs/tests/utils.spec.ts` (run from
      `apps/ai-dial-admin/`) — it will still fail on the assertions task 3.1 rewrites; the check
      here is that no *other* route's expectation broke.

## 2. Detail view wiring

- [x] 2.1 In `apps/ai-dial-admin/src/components/Assets/Platform/Models/View.tsx`, read
      `const { featureFlags } = useAppContext();` from `@/src/context/AppContext` and pass it as the
      third argument to `getTabsForAsset(t, ApplicationRoute.PlatformModels, featureFlags)`, exactly
      as `Assets/Toolsets/View/View.tsx` does. Without this the tab never appears no matter what
      task 1.1 does, and TypeScript will not complain — the parameter is optional.

- [x] 2.2 In `apps/ai-dial-admin/src/components/Assets/Platform/Models/TabsContent.tsx`, render
      `<EntityAudit entity={selectedModel} view={ApplicationRoute.PlatformModels} />` (default import
      from `@/src/components/EntityTabs/Audit/EntityAudit`) when
      `activeTab === EntityViewTab.Audit`, as the last block, mirroring
      `Assets/Toolsets/View/TabsContent.tsx`. Add nothing else — no banner, no revision link, no
      rollback control.

## 3. Unit tests

- [x] 3.1 Tab-set tests. `apps/ai-dial-admin/src/utils/tabs/tests/utils.spec.ts` has no
      `PlatformModels` coverage at all today, so **both** flag states are new cases there, not edits
      to existing ones: `getTabsForAsset(t, ApplicationRoute.PlatformModels)` with the flag unset
      (four tabs) and with `flags({ dashboardEnabled: true })` (five, `auditTab(t)` last), plus
      `getAuditTabs(t, flags({ dashboardEnabled: true }), ApplicationRoute.PlatformModels)`
      returning `[Dashboard, Traces]` and no `Activities`. Keep the existing `Models`,
      `Applications`, `Toolsets` and `AssetsToolsets` expectations as the regression guard. In
      `apps/ai-dial-admin/src/components/Assets/Platform/Models/tests/tabs.spec.ts` **keep the
      existing "Audit is absent" assertion and add a flag-set case beside it** — do not replace it.
      That spec's `tabIds()` helper calls `getTabsForAsset(t, ApplicationRoute.PlatformModels)` with
      no third argument, and `getTabsForAsset` appends `auditTab` only under
      `featureFlags?.dashboardEnabled`, so the assertion is already exactly the flag-unset guard for
      the spec scenario `Detail view renders exactly four tabs`; deleting it would leave that
      scenario uncovered. Add the five-tab expectation for `tabIds(dashboardFlags)`, and keep
      `Parameters`/`AppRoutes`/`Dependencies` asserted absent in both flag states. Also assert
      `PlatformAppRunners`, `PlatformInterceptors`, `PlatformRoutes`, `PlatformKeys` and
      `PlatformRoles` gain no `Audit` tab with the flag set.
      Run: `npx vitest run src/utils/tabs/tests/utils.spec.ts src/components/Assets/Platform/Models/tests/tabs.spec.ts`

- [x] 3.2 New spec `apps/ai-dial-admin/src/components/Assets/Platform/Models/tests/view-tabs.spec.tsx`
      covering the wiring from task 2.1, which no util test can see. Render `ModelView`, mock
      `@/src/components/EntityHeaderControls/SimpleHeader` with a props spy and assert the `tabs`
      prop contains `EntityViewTab.Audit` when the `AppContext` mock reports
      `dashboardEnabled: true` and does not when it reports `false` — re-mock
      `@/src/context/AppContext` locally, since `test-setup.tsx`'s global mock leaves
      `dashboardEnabled` undefined. Mock `@/src/context/assets/ModelsFolderContext`,
      `@/src/app/[lang]/platform-models/actions` and `./TabsContent` locally; keep the render light.
      Run: `npx vitest run src/components/Assets/Platform/Models/tests/view-tabs.spec.tsx`

- [x] 3.3 In `apps/ai-dial-admin/src/components/Assets/Platform/Models/tests/TabsContent.spec.tsx`
      add a case for `activeTab={EntityViewTab.Audit}`: mock
      `@/src/components/EntityTabs/Audit/EntityAudit` with a props spy (it pulls in ECharts and AG
      Grid otherwise) and assert it is rendered with `view === ApplicationRoute.PlatformModels` and
      the selected model as `entity`. Assert no such component renders for the `Properties` tab.
      Do not copy the fake `role="dashboards"` query from
      `EntityTabs/Audit/tests/EntityAudit.spec.tsx` — `.claude/rules/testing.md` §4.4 forbids
      invented roles; assert through the props spy.
      Run: `npx vitest run src/components/Assets/Platform/Models/tests/TabsContent.spec.tsx`

- [x] 3.4 In `apps/ai-dial-admin/src/utils/tests/telemetry.spec.tsx`, inside the existing
      `Utils :: telemetry :: getEntityFilterName` describe, add a case asserting that
      `getEntityFilterName(ApplicationRoute.PlatformModels, entity)` returns the bare `name` and
      ignores the asset's `path` — no `toolsets/` prefix, no `models/platform/` id.
      Run: `npx vitest run src/utils/tests/telemetry.spec.tsx`

## 4. Browser verification

- [x] 4.1 Run the `spec-browser-verify` skill against a locally booted stack with auth disabled and
      the default `DISABLE_MENU_ITEMS` (so `dashboardEnabled` is set) and analytics configured —
      the configuration that reproduces issue #4200. Verify, on `Catalog ▸ Models` → a model that
      has traffic in the booted stack: `Audit is the fifth tab when the dashboard feature is
      enabled`, `Audit opens on Dashboard with Traces alongside`, `No Activities sub-tab`,
      `No Conversations sub-tab`, and `No Audit tab or sync banner` (no revision link, rollback
      control, or Core-sync banner). The flag-unset matrix stays with the unit tests in 3.1.
      Resolve any `fail` verdict before the change is complete.

## 5. Quality checks

- [x] 5.1 From `apps/ai-dial-admin/`, run `npm run lint`, `npm run format`, and `npm run test` (full
      suite with coverage) and report the actual output. Anything this turns up comes back as a new
      dispatch to the task that owns the file, not as an edit from here.
