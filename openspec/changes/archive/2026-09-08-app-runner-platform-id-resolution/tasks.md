## 1. Rename `AppRunnerOrigin` and its paired i18n keys

- [x] 1.1 In `SourceField/Application/models.ts`, rename `AppRunnerOrigin.Entity` → `AppRunnerOrigin.Config` and `AppRunnerOrigin.Asset` → `AppRunnerOrigin.Platform` (member name and string value).
- [x] 1.2 In `SourceField/Application/utils.ts`, update `getRunnerOrigin`'s fallback and `toEntityOption`/`toAssetOption`'s `origin` assignments to the renamed members; update the doc comment on `toAssetOption` if it names the old members.
- [x] 1.3 In `constants/i18n.ts`, rename `SourceI18nKey.EntityRunner` → `SourceI18nKey.ConfigRunner` and `SourceI18nKey.AssetRunner` → `SourceI18nKey.PlatformRunner`; update `locales/en.ts` to match (English text — "Configuration file" / "API" — unchanged).
- [x] 1.4 Update every remaining reader of the old enum/i18n names: `constants/grid-columns/grid-columns.tsx` (`PICKER_RUNNER_COLUMNS`'s `origin` formatter), `components/EntityView/Interceptors/{Interceptors.tsx,models.ts}`, `components/Assets/Resources/ResourceFeatures.tsx`, `components/Assets/Platform/use-asset-runner-details.ts`, `components/Applications/ParametersTab/ParametersTab.tsx`, `components/SourceField/Application/AppRunners.tsx`.
- [x] 1.5 Update the fixtures/assertions in `SourceField/Application/tests/runner-options.spec.ts` and `assets-applications/tests/runner-sources.spec.tsx` to the renamed members and i18n keys.

## 2. Add the shared runner-scheme resolver

- [x] 2.1 Create `SourceField/Application/resolve-app-runner.ts` exporting `resolveAppRunnerScheme(runner?: DialApplicationScheme): Promise<{ runner?: DialApplicationScheme; scheme?: DialApplicationScheme }>` per design.md's "A shared resolver, not a hook" and "Platform resolution fetches details first" / "Config resolution is unchanged, just relocated" decisions — branching on `getRunnerOrigin(runner)`, importing `getRunner` from `@/src/app/[lang]/platform-app-runners/actions`, `getResolvedRunnerSchema` from the same module, `getResolvedApplicationScheme` from `@/src/app/[lang]/application-runners/actions`, and `DEFAULT_ETAG` from `@/src/constants/api-headers`.
- [x] 2.2 Add unit tests for `resolveAppRunnerScheme` (new `SourceField/Application/tests/resolve-app-runner.spec.ts`) covering: `Config`-origin success/failure (existing behavior, relocated), `Platform`-origin success (detail fetch succeeds, resolved schema uses the detail's `$id`, not the input's), `Platform`-origin with a failed detail fetch (falls back to the input runner and its `$id`), `Platform`-origin with a failed resolved-schema call (falls back to the — possibly corrected — runner), and `undefined` input (`{}`).

## 3. Wire `AppRunners.tsx` through the shared resolver

- [x] 3.1 Replace `handleRunnerSelect`'s inline origin-branching resolve logic with a call to `resolveAppRunnerScheme(runner)`; build `applicationProperties` from the returned `scheme` (falling back to the returned `runner`, per design.md).
- [x] 3.2 Use the returned `runner`'s `$id` (falling back to the originally-picked `value` when there is no runner, e.g. a cleared selection) as the id written into `createSchemaSource(...)` for the entity-based API path, and as the first argument to `onChangeValue(...)` for the legacy callback-based API path.
- [x] 3.3 Update `SourceField/Application/tests/AppRunnersMerged.spec.tsx` and `AppRunners.spec.tsx`: mock `getRunner` (platform-app-runners actions) alongside the existing `getResolvedRunnerSchema`/`getResolvedApplicationScheme` mocks; add/adjust cases asserting that selecting a platform runner calls `getRunner` with its `path`, that `getResolvedRunnerSchema` is then called with the *detail response's* `$id`, and that `onChangeValue`/`onChange` receive that corrected id — including the case where the detail fetch's `$id` differs from the picker option's `$id`.

## 4. Wire `ParametersTab.tsx` through the shared resolver

- [x] 4.1 Replace the scheme-resolution `useEffect`'s inline origin-branching resolve logic with a call to `resolveAppRunnerScheme(foundRunner)`, using the returned `scheme` (falling back to `foundRunner`) exactly where the old `scheme` local was used.
- [x] 4.2 Update `Applications/ParametersTab/tests/ParametersTab.spec.tsx`: mock `getRunner` alongside the existing resolver mocks; add/adjust a case for a platform-origin `foundRunner` asserting `getRunner` is called with its `path` and the Parameters view renders the scheme from the detail-corrected `$id`'s resolution.

## 5. Quality gate

- [x] 5.1 Run `npx vitest run --coverage` from `apps/ai-dial-admin/` and confirm the coverage gate in `vitest.config.ts` is not regressed. Note: the full 11k+ test run is flaky under this environment's parallel workers — a different, unrelated set of files times out each run (confirmed pre-existing: reproduces on the unmodified `development` HEAD and every failing file passes cleanly in isolation). None of this change's files (`SourceField/Application/*`, `Applications/ParametersTab/*`, `resolve-app-runner.*`, i18n/grid-columns/Interceptors/ResourceFeatures/use-asset-runner-details) appeared among the failures in any run; all were run in isolation and pass.
- [x] 5.2 Run `npm run lint` and `npm run format` (or `format:write`) and resolve any findings.
