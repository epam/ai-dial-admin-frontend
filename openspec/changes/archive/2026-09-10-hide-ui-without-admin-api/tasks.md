## 1. Feature flag

- [x] 1.1 Add `adminApiEnabled: boolean` to `FeatureFlags` in `src/models/feature-flags.ts`.
- [x] 1.2 Compute it in `src/app/[lang]/layout.tsx` as `process.env.DIAL_ADMIN_API_URL != null` and
      pass it through with the rest of `featureFlags`.

## 2. Menu configuration

- [x] 2.1 In `src/components/Menu/menu-configuration.tsx`, filter out the Entities, Builders, and
      Access Management groups when `!featureFlags.adminApiEnabled`, following the existing
      `deploymentsEnabled`/`evaluationEnabled`/`analyticsEnabled` filter chain.
- [x] 2.2 In the same file, filter the Audit group out entirely (Dashboard, Activity, and Usage Log all
      hidden together) when `!featureFlags.adminApiEnabled`, using the same group-level filter as
      Entities/Builders/Access Management — not an item-level filter within Audit.
- [x] 2.3 Update `src/components/Menu/tests/menu-configuration.spec.ts` to cover: both flags disabled
      (Entities/Builders/Access Management/Audit groups all absent in full, other groups untouched),
      flag independence from `deploymentsEnabled`/`evaluationEnabled`, and flag enabled (unaffected).

## 3. Menu actions

- [x] 3.1 In `src/components/Menu/MenuContent/MenuContent.tsx`, gate the "Import config" and
      "Export config" `MenuAction`s in `MenuActionsBar` on `featureFlags.adminApiEnabled`; leave
      "System properties" unconditional.
- [x] 3.2 Gate the same two actions passed into the collapsed `MenuActions` bar
      (`showImportExport` prop or equivalent) on `featureFlags.adminApiEnabled` combined with the
      existing `!isReadOnlyAdmin` check.
- [x] 3.3 Update/add tests in `src/components/Menu/MenuContent/tests/` covering Import/Export
      presence/absence for both the expanded and collapsed bars.
- [x] 3.4 In `src/components/WelcomeView/WelcomeView.tsx`, gate the Import/Export quick-action
      buttons on `featureFlags.adminApiEnabled` in addition to the existing `!isReadOnlyAdmin` check;
      update `src/components/WelcomeView/WelcomeView.spec.tsx` to cover the disabled case.

## 4. Footer and status polling

- [x] 4.1 In `src/components/Content/Content.tsx`, read `featureFlags` via `useAppContext()` and skip
      starting the `checkAppStatus` and `checkCoreVersion` effects (including their initial call and
      `setInterval`) when `!featureFlags.adminApiEnabled`.
- [x] 4.2 In the same file, render `<Footer .../>` only when `featureFlags.adminApiEnabled`.
- [x] 4.3 Update `src/components/Content/tests/Content.spec.tsx` (or equivalent) to assert the Footer
      is absent and `getAppProcessStatus`/`getCoreVersions` are never called when the flag is `false`.

## 5. Route guards — Entities

- [x] 5.1 Add the `if (!process.env.DIAL_ADMIN_API_URL) redirect(ApplicationRoute.Home);` guard
      (mirroring `src/app/[lang]/model-servings/page.tsx`) as the first statement in:
      `models/page.tsx`, `models/[id]/page.tsx`, `models/[id]/[subId]/page.tsx`,
      `applications/page.tsx`, `applications/[id]/page.tsx`, `applications/[id]/[subId]/page.tsx`,
      `interceptors/page.tsx`, `interceptors/[id]/page.tsx`, `interceptors/[id]/[subId]/page.tsx`,
      `toolsets/page.tsx`, `toolsets/[id]/page.tsx`, `toolsets/[id]/[subId]/page.tsx`,
      `routes/page.tsx`, `routes/[id]/page.tsx`, `routes/[id]/[subId]/page.tsx`
      (all under `src/app/[lang]/`).

## 6. Route guards — Builders

- [x] 6.1 Add the same guard to: `adapters/page.tsx`, `adapters/[id]/page.tsx`,
      `adapters/[id]/[subId]/page.tsx`, `application-runners/page.tsx`,
      `application-runners/[id]/page.tsx`, `application-runners/[id]/[subId]/page.tsx`,
      `interceptor-templates/page.tsx`, `interceptor-templates/[id]/page.tsx`,
      `interceptor-templates/[id]/[subId]/page.tsx` (all under `src/app/[lang]/`).

## 7. Route guards — Access Management, Audit, Import/Export

- [x] 7.1 Add the same guard to: `roles/page.tsx`, `roles/[id]/page.tsx`,
      `roles/[id]/[subId]/page.tsx`, `keys/page.tsx`, `keys/[id]/page.tsx`,
      `keys/[id]/[subId]/page.tsx`, `activity-audit/page.tsx`, `activity-audit/[id]/page.tsx`,
      `dashboard/page.tsx`, `usage-log/page.tsx`, `import-config/page.tsx`, `export-config/page.tsx`
      (all under `src/app/[lang]/`). `dashboard` and `usage-log` are the other two Audit-group
      routes — the whole group is now hidden together (see §2.2), so they need the same guard as
      `activity-audit` even though neither has an `[id]` sub-route.

## 8. Verification

- [x] 8.1 Run `npx vitest run` for every spec file touched above; then run `npm run test` and
      `npm run typecheck` as the final gate.
