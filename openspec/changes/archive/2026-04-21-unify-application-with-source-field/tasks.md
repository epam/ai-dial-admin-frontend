## 1. Model unification

- [x] 1.1 In `apps/ai-dial-admin/src/components/SourceField/types.ts`, add optional `applicationTypeSchemaId?: string` field to `SOURCE_FIELD`.
- [x] 1.2 In `apps/ai-dial-admin/src/models/dial/application.ts`, remove the `ApplicationSource` interface; change `DialApplication.source?: SOURCE_FIELD`; keep `export { SOURCE_TYPE as ApplicationSourceType } from '@/src/components/SourceField/types'` for backward compatibility.
- [x] 1.3 Update `apps/ai-dial-admin/src/utils/entities/application-source.ts` — retype helpers (`getSchemaSourceId`, `ENDPOINTS_SOURCE`, `SCHEMA_SOURCE`, `createSchemaSource`) to use `SOURCE_FIELD` instead of `ApplicationSource`. Keep behavior identical.
- [x] 1.4 Run `tsc` (e.g. `npx nx run ai-dial-admin:typecheck` or `npm run build`) to surface every consumer still importing the removed `ApplicationSource` interface; fix each importer to use `SOURCE_FIELD` (no behavior change). (Verified via `tsc` — no consumers imported the removed interface; all call sites use the `ApplicationSourceType` alias that is still re-exported.)

## 2. New `ApplicationEndpoint` component

- [x] 2.1 Create `apps/ai-dial-admin/src/components/SourceField/Endpoints/ApplicationEndpoint.tsx`. Copy the markup + handlers from `components/SourceField/Application/EndpointAndMCPContainer.tsx` that are specific to `DialApplication` (i.e. the `view !== ApplicationRunners` branches). Props: `{ entity: DialApplication; onChange: (entity: DialApplication) => void; isEntityImmutable?: boolean; isModal?: boolean; disabled?: boolean }`. (Also hosts the `isEntityImmutable` ViewerUrl/EditorUrl controls that previously lived in `ApplicationSource.tsx`'s ENDPOINTS branch, preserving the regular Application's edit-tab UX.)
- [x] 2.2 Writes target flat entity fields only: `entity.endpoint`, `entity.mcp` (with sub-fields `endpoint`, `transport`, `forwardPerRequestKey`, `configDelivery`). No writes to `entity.source`.
- [x] 2.3 In `apps/ai-dial-admin/src/components/SourceField/Endpoints/Endpoints.tsx`, add a case for `view === ApplicationRoute.Applications` that renders `<ApplicationEndpoint />`.

## 3. Move runner side-effects into `AppRunners`

- [x] 3.1 In `apps/ai-dial-admin/src/components/SourceField/Application/AppRunners.tsx`, widen the component's responsibility: accept `entity: DialApplication`, `onChange: (entity: DialApplication) => void`, `runners?: DialApplicationScheme[]`, `isEntityImmutable?`, `isModal?`, `disabled?`. (Legacy `selectedValue`/`onChangeValue` kept as alternate mode for AssetApp flow in `ApplicationSource.tsx`; when `entity`/`onChange` are provided, AppRunners owns the side-effect.)
- [x] 3.2 Move the scheme-fetch + defaults derivation logic from `components/SourceField/Application/ApplicationSource.tsx::onChangeAppRunner` into `AppRunners`. Use `getResolvedApplicationScheme` from `@/src/app/[lang]/application-runners/actions` and `getSchemaDefaults` from `@/src/utils/schema`.
- [x] 3.3 On runner selection, call `onChange` once with `{ ...entity, source: createSchemaSource(runnerId) or direct { $type: SCHEMA, applicationTypeSchemaId: runnerId }, applicationProperties }`. Preserve the `isEntityImmutable` branch (keep existing `applicationProperties` when immutable).
- [x] 3.4 On fetch failure, fall back to using the unresolved runner for defaults derivation (matches current behavior).

## 4. Extend `SourceField.tsx`

- [x] 4.1 Widen the generic constraint to include `DialApplication`: `<T extends DialInterceptor | DialModel | Toolset | DialApplication>`.
- [x] 4.2 Add a SCHEMA branch: `{source === SOURCE_TYPE.SCHEMA && <AppRunners ... />}`. Pipe `runners` through props; accept a new optional prop `runners?: DialApplicationScheme[]` and pass through.
- [x] 4.3 Update `onChangeSource` with view-aware clearing. Default reset stays `{ endpoint: '' }`. When `view === ApplicationRoute.Applications`, additionally reset `{ mcp: undefined, viewerUrl: undefined, editorUrl: undefined, applicationTypeSchemaId: undefined, applicationProperties: undefined }`.
- [x] 4.4 Update the mount effect to skip the Models-specific `completionEndpointPath` seeding when `view === Applications` (already conditional on Models, just verify). (Verified: the block is conditional on `view === ApplicationRoute.Models` only — no Applications effect.)

## 5. Add Applications source items

- [x] 5.1 In `apps/ai-dial-admin/src/components/SourceField/constants.ts`, add `APPLICATION_SOURCE_ITEMS: SelectOption[] = [{ value: SOURCE_TYPE.ENDPOINTS, label: 'Endpoints' }, { value: SOURCE_TYPE.SCHEMA, label: 'App Runner' }]` (or labels matching current radio labels; use existing i18n keys if available).
- [x] 5.2 Extend `getItems` switch with `case ApplicationRoute.Applications: return APPLICATION_SOURCE_ITEMS`.

## 6. Extend validation

- [x] 6.1 In `apps/ai-dial-admin/src/components/SourceField/utils.ts`, extend `isValidSourceField` type signature to include `DialApplication`.
- [x] 6.2 Add `SOURCE_TYPE.SCHEMA` branch: `return !!source.applicationTypeSchemaId`.
- [x] 6.3 Branch `SOURCE_TYPE.ENDPOINTS` on entity shape: if `DialApplication`, validate "at least one of `entity.endpoint` or `entity.mcp?.endpoint` is a valid URL via `getUrlError`"; otherwise keep current Model/Adapter behavior.
- [x] 6.4 Consider adding a small `isDialApplication` type guard (e.g. presence of `mcp` field, or a shared discriminator) — or thread `view` down from callers. Pick whichever has smaller diff. (Added local `isDialApplication` guard checking presence of mcp/applicationProperties/viewerUrl/editorUrl.)

## 7. Swap the Applications view caller

- [x] 7.1 In `apps/ai-dial-admin/src/components/Applications/View/Properties/Properties.tsx`, replace the `<ApplicationSource ...>` import + render with `<SourceField view={ApplicationRoute.Applications} sourceItems={APPLICATION_SOURCE_ITEMS} runners={runners} entity={entity} onChange={onChange} ... />`. (Also swapped the non-immutable Applications branch in `EntityMainProperties/Properties/DeploymentProperties.tsx`.)
- [x] 7.2 Pass a no-op or empty `getContainers` stub to `SourceField` (since CONTAINER is not in `APPLICATION_SOURCE_ITEMS` it should never be invoked). Alternative: make `getContainers` optional in `SourceField` — prefer the simplest change. (Made `getContainers` optional in `SourceField` props and guarded the CONTAINER render branch on its presence.)
- [x] 7.3 Verify the Applications view still reads `runners` from its existing source (server action or context) and passes them through. (Runners plumbed through `Properties.tsx`, `DeploymentProperties.tsx` into `SourceField` unchanged.)

## 8. Prune `ApplicationSource.tsx` to AssetApp-only

- [x] 8.1 In `apps/ai-dial-admin/src/components/SourceField/Application/ApplicationSource.tsx`, remove all branches conditioned on `view !== ApplicationRoute.AssetsApplications`. Keep only the AssetApp path.
- [x] 8.2 Simplify `sourceType` initial state: only the AssetApp discriminator (`(entity as AssetApp).applicationTypeSchemaId`) remains.
- [x] 8.3 Remove imports that become unused (`ENDPOINTS_SOURCE`, `SCHEMA_SOURCE`, `createSchemaSource`, `getSchemaSourceId` if not needed, etc.). (Also dropped unused imports: `JSONSchema7`, `getResolvedApplicationScheme`, `EditorUrlControl`/`ViewerUrlControl` [now inside `ApplicationEndpoint`], `EndpointAndMCPContainer`, `getSchemaDefaults`, `DefaultsValue`, `ApplicationRoute`; replaced `EndpointAndMCPContainer` with `ApplicationEndpoint`.)
- [x] 8.4 Update the AssetsApplications view caller (search for consumers of `ApplicationSource` from `@/src/components/SourceField/Application/ApplicationSource`) to ensure the props contract still matches. (Updated `EntityMainProperties/Properties/AssetProperties.tsx` and `Assets/Apps/Properties.tsx`: dropped `view` prop, entity now typed as `AssetApp`.)

## 9. Remove `DialApplication` branches from `EndpointAndMCPContainer.tsx`

- [x] 9.1 In `apps/ai-dial-admin/src/components/SourceField/Application/EndpointAndMCPContainer.tsx`, remove the `view === ApplicationRoute.Applications` and `view === ApplicationRoute.AssetsApplications` branches. Leave only the `view === ApplicationRoute.ApplicationRunners` (runner editor) path. (Component now only targets `DialApplicationScheme`; writes exclusively to `dial:applicationTypeCompletionEndpoint` and `dial:applicationTypeMcp`. Optional `view?` prop retained for call-site compatibility, no runtime branching.)
- [x] 9.2 Consider renaming to `ApplicationRunnerEndpoint.tsx` for clarity — optional, not required. (Skipped — kept original name to minimize diff noise; single caller `AppRunnerSource.tsx` is unambiguous.)
- [x] 9.3 Verify the component is still imported only by the runner editor; fix any stale callers. (Verified via grep — only `ApplicationRunners/ConfigurationView/AppRunnerSource.tsx` imports it.)

## 10. Tests

- [x] 10.1 Update `apps/ai-dial-admin/src/utils/entities/tests/application-source.spec.ts` to reflect the retyped helpers (`SOURCE_FIELD`-based). Ensure existing cases still pass. (Added coverage for `ApplicationSourceType` alias, `ENDPOINTS_SOURCE`, `SCHEMA_SOURCE`, `createSchemaSource`, plus round-trip through `getSchemaSourceId`.)
- [x] 10.2 Update (or add) `apps/ai-dial-admin/src/components/SourceField/tests/utils.spec.ts` with cases for:
  - SCHEMA valid / invalid
  - Applications ENDPOINTS: chat only valid, MCP only valid, both valid, both invalid, neither set
- [x] 10.3 Add tests for `apps/ai-dial-admin/src/components/SourceField/Endpoints/ApplicationEndpoint.tsx`: renders chat + MCP inputs; writes to `entity.endpoint` / `entity.mcp`; both-off prevented; MCP sub-fields (`transport`, `forwardPerRequestKey`, `configDelivery`) wired correctly. Reuse existing mocks from `test-setup.tsx`. (10 tests; mocks `@epam/ai-dial-ui-kit`, `EndpointControl`, `ViewerUrlControl`, `EditorUrlControl` locally.)
- [x] 10.4 Add tests for `AppRunners` runner-selection side-effects: successful resolve writes source + `applicationProperties`; failed resolve falls back to unresolved runner; `isEntityImmutable` keeps current `applicationProperties`. (4 tests; covers both entity-mode and legacy `selectedValue`/`onChangeValue` API.)
- [x] 10.5 Add tests for `SourceField.tsx` view-aware clearing when `view === Applications` for both ENDPOINTS → SCHEMA and SCHEMA → ENDPOINTS transitions. (5 tests; also verifies non-Applications views only reset `endpoint` and don't touch Application-specific fields.)
- [x] 10.6 Smoke-test that existing `Properties.tsx` tests still pass after swapping `<ApplicationSource>` for `<SourceField>` (update fixtures / assertions as needed — no `data-testid`, use accessible queries). (No spec exists for `Applications/View/Properties/Properties.tsx`; full test suite passes — 4240 tests, 2 pre-existing skipped.)

## 11. Final validation

- [x] 11.1 Run `npm run lint` (from repo root) and fix any violations. (Fixed 2 prettier errors in `ApplicationEndpoint.tsx` and `EndpointAndMCPContainer.tsx` via `npm run format:write`; lint now passes with 0 errors, 26 pre-existing warnings in unrelated files.)
- [x] 11.2 Run `npm run format` and apply `npm run format:write` if needed. (Applied.)
- [x] 11.3 Run `npm run test` (or `npx vitest run` from `apps/ai-dial-admin/`) and ensure all tests pass. (4240 passed, 16 pre-existing skipped, 0 failed.)
- [x] 11.4 Run `npm run build` and confirm TypeScript emits with no errors. (Build succeeded.)
