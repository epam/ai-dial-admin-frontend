## 1. Models

- [x] 1.1 Add `user_roles?: string[]` to `DialApplicationResource` in `models/dial/resource.ts`
      (design D2) — flows automatically to `DialPlatformApplicationResource` via its existing
      `Omit<DialApplicationResource, ...>` derivation. **Corrected from `userRoles`**: verified
      against `ai-dial-core` that `Application`/`ToolSet` are `@JsonNaming(SnakeCaseStrategy)` (unlike
      `Model`/`Route`), so Core always writes this field back as `user_roles`.
- [x] 1.2 Add `user_roles?: string[]` to `DialToolsetResource` in `models/dial/resource.ts` (design
      D2) — flows automatically to `DialPlatformToolsetResource` the same way. Same correction as 1.1.

## 2. Roles tab rendering

- [x] 2.1 In `components/Applications/View/TabsContent.tsx`, branch the existing
      `activeTab === EntityViewTab.Roles` case on `view === ApplicationRoute.AssetsApplications`:
      render `AssetRoles` for the asset view via the D2a view-object/`onChangeAssetRoles` adapter
      (presents `user_roles` as `userRoles`, translates back without leaking a stray `userRoles` key
      into the write payload), keep the current `EntityRoles` call unchanged for every other view
      (design D3).
- [x] 2.2 In `components/Assets/Toolsets/View/TabsContent.tsx`, add a new
      `activeTab === EntityViewTab.Roles` case rendering `AssetRoles` via the same D2a adapter
      pattern, passed a `roles` prop threaded in from `Props` (design D3).

## 3. Platform tab lists

- [x] 3.1 In `components/Assets/Platform/Applications/View.tsx`, splice `rolesTab(t)` into the tabs
      array immediately before the `Interceptors` tab, inside the same effect that already
      conditionally splices in `toolsTab(t)` for MCP-configured applications (design D1) — both
      conditional insertions computed together so they stay visible at one call site.
- [x] 3.2 In `components/Assets/Platform/Toolsets/View.tsx`, splice `rolesTab(t)` into the
      `useMemo`-computed tabs array immediately after the `Tools` tab and before the conditional
      `Audit` tab (design D1).
- [x] 3.3 Thread a `roles: DialRole[]` prop through `PlatformApplicationView`'s and
      `PlatformToolsetView`'s `Props`, passed down to their `TabsContent` call.

## 4. Page-level role population

- [x] 4.1 In `app/[lang]/assets-applications/[id]/page.tsx`, add
      `readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, optionWarnings)` to the
      existing unconditional `Promise.all` alongside the interceptors/`globalInterceptors` reads
      (design D4), and pass the resulting `roles` prop to `PlatformApplicationView` only — `AppView`'s
      props stay unchanged.
- [x] 4.2 In `app/[lang]/assets-toolsets/[id]/page.tsx`, add an `optionWarnings: EntitiesI18nKey[]`
      array and the same `readConfigEntities<DialRole>(...)` read (design D4), and pass the resulting
      `roles`/`optionWarnings` props to `PlatformToolsetView` only — `ToolsetView`'s props stay
      unchanged. **Scope correction**: the platform-toolsets delta spec's "option-list read failure is
      reported" scenario requires the same incomplete-list notification `PlatformApplicationView`
      already shows, which `PlatformToolsetView` didn't have at all — added an `optionWarnings` prop
      and the identical `useEffect`/`showNotification` handling there too, rather than leave the spec
      scenario unmet.

## 5. Tests

- [x] 5.1 Unit/component tests for `DialApplicationResource`/`DialToolsetResource`'s new
      `user_roles` field are covered implicitly by 5.2/5.3's component tests, which specifically
      assert the `user_roles`↔`userRoles` boundary translation; no standalone model test needed since
      these are plain type additions with no logic.
- [x] 5.2 Add `components/Applications/View/tests/TabsContent.spec.tsx` (none exists today) covering:
      the `Roles` tab renders `AssetRoles` when `view === AssetsApplications`, presents `user_roles`
      as `userRoles`, and round-trips a selection back to `onChangeApplication` as `user_roles` with
      no stray `userRoles` key; the `Roles` tab still renders `EntityRoles` unchanged for the admin-BE
      `Applications` view.
- [x] 5.3 Extend `components/Assets/Toolsets/View/tests/` with a `TabsContent.spec.tsx` covering the
      new `Roles` case rendering `AssetRoles`, presenting `user_roles` as `userRoles`, and
      round-tripping a selection through `onChange` as `user_roles` with no stray `userRoles` key.
- [x] 5.4 Update `components/Assets/Platform/Applications/tests/View.spec.tsx`: assert the tabs list
      includes `Roles` positioned before `Interceptors` (with and without the MCP-conditional `Tools`
      tab present), via `getAllByRole('tab')` ordering (matching `Assets/Skills/View/tests/View.spec.tsx`'s
      established tab-query pattern).
- [x] 5.5 Update `components/Assets/Platform/Toolsets/tests/View.spec.tsx`: assert the tabs list is
      exactly `[Properties, Tools, Roles]` (the default `featureFlags` mock has `dashboardEnabled`
      falsy, so no `Audit` tab appears) via the same `getAllByRole('tab')` pattern.
- [x] 5.6 Add `assets-applications/tests/roles-threading.spec.tsx` asserting the roles read reaches
      `PlatformApplicationView`'s props (via the `Page` function directly, matching
      `evaluators/tests/detail-page.spec.tsx`'s call-and-inspect-element pattern) but not `AppView`'s
      (the public-bucket branch), even though the read itself is unconditional.
- [x] 5.7 Add `assets-toolsets/tests/roles-threading.spec.tsx` (same pattern as 5.6) asserting the new
      roles read reaches `PlatformToolsetView`'s props but not `ToolsetView`'s.

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run format`, and `npm run test` from `apps/ai-dial-admin/` and fix
      any failures. Lint: 0 errors (113 pre-existing warnings, none in files this change touches).
      Format: clean. Full suite: 10862 passed, 2 failed — `EntityListView/Import/tests/
      ImportConflicts.spec.tsx` and `ModelView/ModelProperties/tests/ModelProperties.spec.tsx`, both
      `Test timed out in 5000ms` under full-suite parallel load; `git status` confirms this change
      touches neither file, and both pass cleanly (677ms/230ms) when re-run in isolation — confirmed
      pre-existing flakes, not a regression. Every test this change added or touched passes.
