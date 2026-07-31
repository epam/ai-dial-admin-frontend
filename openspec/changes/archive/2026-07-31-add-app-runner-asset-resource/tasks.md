## 1. Types and constants

- [x] 1.1 Add `APP_TYPE_SCHEMA` to `ResourceType` in `src/types/resource-type.ts`.
- [x] 1.2 Add `SCHEMAS_PREFIX = 'schemas/platform/'` and the `RESOURCE_TYPE_PREFIX[ResourceType.APP_TYPE_SCHEMA]` entry in `src/constants/publications-core.ts`.
- [x] 1.3 Register `APP_TYPE_SCHEMA` in `CORE_RESOURCE_URL` and `CORE_RESOURCE_METADATA_URL` in `src/constants/assets-core.ts`, and widen `VersionedResourceType` to `Exclude<ResourceType, ResourceType.FILE | ResourceType.MODEL | ResourceType.APP_TYPE_SCHEMA>`.
- [x] 1.4 Add `ApplicationRoute.AssetsAppRunners = '/assets-app-runners'` in `src/types/routes.ts`.
- [x] 1.5 Map the new view to the `platform` root in `src/utils/files/root-folder.ts` (rename `MODELS_ROOT_FOLDER` to a shared `PLATFORM_ROOT_FOLDER` or add a sibling constant — do not duplicate the literal).

## 2. Domain models

- [x] 2.1 Add `DialAppRunnerResource` in `src/models/dial/resource.ts` covering the Core wire shape: `$schema`, `$id`, `type`, `title`, `description`, the `dial:applicationType*` fields, `dial:applicationTypeMcp`, `dial:applicationTypeInterceptors`, `$defs`, `properties`, `required`, `topics`, and the read-only `status`.
- [x] 2.2 Add the Core route types (`CoreAppRunnerRoute`, `CoreAppRunnerUpstream`) in a `models.ts` beside the converters — the `dial:`-prefixed object shape, distinct from `DialAppRoute`.

## 3. Name encoding helpers

- [x] 3.1 Add pure `toCoreRunnerName($id)` and `fromCoreRunnerName(name)` helpers applying and reversing the extra `encodeURIComponent` layer (the shared `encodeCorePath`/`decodeCorePath` supply the second).
- [x] 3.2 Add a pure guard rejecting ids containing `!`, `~`, `*`, `'`, `(`, `)` — characters `encodeURIComponent` leaves unescaped and `ENTITY_NAME_PATTERN` disallows. Implemented as `hasUnencodableRunnerIdChars` over an exported `CORE_UNENCODABLE_ID_CHARS` list, rather than the originally-planned `isValidRunnerId` that also folded in the empty check: conflating the two produced an error blaming forbidden characters for a merely-absent id (see 12.2).

## 4. Route converters

- [x] 4.1 Add pure `toCoreAppRoutes(routes: DialAppRoute[]): Record<string, CoreAppRunnerRoute>`: key from `displayName || name`; `dial:` prefixes; `paths` as regex source strings; `permissions` uppercased to `READ`/`WRITE`; `extraData` object serialized to a JSON string; `secretExtraData`, `id`, and `responsesEndpoint` dropped from upstreams; `dial:response` emitted with both `dial:status` and `dial:body` when present.
- [x] 4.2 Add pure `fromCoreAppRoutes(routes: Record<string, CoreAppRunnerRoute>): DialAppRoute[]` reversing 4.1, with the object key becoming the route name and `dial:extraData` parsed back to an object when it holds JSON.
- [x] 4.3 Make `toCoreAppRoutes` report duplicate resolved route names as an error rather than letting one entry overwrite another.

## 5. Core-asset-client support

- [x] 5.1 Add `createdAt` to `CoreResourceMetadataNode` and project it in `flatMetadataFields` in `src/server/core/asset-metadata.ts`.
- [x] 5.2 Add `mergeAppRunnerResource` + the `ASSET_MERGERS[ResourceType.APP_TYPE_SCHEMA]` entry, using `flatMetadataFields` and applying `fromCoreAppRoutes` to `dial:applicationTypeRoutes`.
- [x] 5.3 Confirm `AssetApi`'s existing flat handling (`isVersioned`, flat `parsePathFields`, etag-from-metadata, `resolveListPath` root strip) covers the new type without further change; add the root-prefix strip entry if `resolveListPath` needs it.

## 6. Server actions and routes

- [x] 6.1 Add `src/app/[lang]/assets-app-runners/actions.ts` with `getRunners`, `createRunner`, `getRunner`, `updateRunner`, `removeRunner`, `bulkDeleteRunners`, mirroring `assets-models/actions.ts`. The payload helper strips `name`, `status`, `path`, and `folderId`, and applies `toCoreAppRoutes`.
- [x] 6.2 Add a `getResolvedRunnerSchema` action reading Core's `GET /v1/application_type_schemas/schema?id=schemas/platform/{encoded $id}`, and surface a resolution failure as a recognizable error rather than an empty result.
- [x] 6.3 Add `src/app/[lang]/assets-app-runners/page.tsx` (list) and `[id]/page.tsx` (detail), following the `assets-models` routing pattern; the detail page additionally fetches the interceptor list from `interceptorsApi`.

## 7. Menu and list registration

- [x] 7.1 Add an `App Runners` entry directly after `Models` in the Assets section of `src/components/Menu/menu-configuration.tsx`.
- [x] 7.2 Register `AssetsAppRunners` in `CreateAssetActionMap` and the `CreateAssetRoute`/`CrudAssetRoute` unions in `src/components/Assets/BaseAssetList/` so the list toolbar's create and delete actions resolve.
- [x] 7.3 Add the i18n keys for the menu entry, tab labels, and validation messages in `src/locales/en.ts` and the relevant `*I18nKey` enum in `src/constants/i18n.ts`.

## 8. Components

- [x] 8.1 Add `src/components/Assets/AppRunners/models.ts` for the component prop types. No component-level `constants.ts` was needed — the only constant values (allowed HTTP methods, route-name pattern) belong with the pure validators, so they live in `src/utils/app-runners/constants.ts`.
- [x] 8.2 Add `src/components/Assets/AppRunners/List.tsx` delegating to `BaseAssetList` with the new view, and metadata-only grid columns (`$id`, author, created-at, updated-at) in `BaseAssetList/utils.tsx` — no per-row content fetch, so display name, description, and topics are not list columns.
- [x] 8.3 Add `View.tsx` and `TabsContent.tsx` wiring exactly `Properties`, `Features`, `Parameters`, `AppRoutes`, and `Interceptors` — no `Applications` tab, no `Audit` tab, and no create-application header actions.
- [x] 8.4 Add `Properties.tsx` with display name, description, icon, title, viewer URL, editor URL, bucket copy, topics, and the source field; `$id` read-only here and editable only in the create modal.
- [x] 8.5 Features tab content — reused the existing `ApplicationRunners/ConfigurationView/Features` component (already renders exactly the four endpoint controls and three switches) rather than adding a duplicate `Features.tsx`; wired in `TabsContent`.
- [x] 8.6 Wire the `AppRoutes` tab to the existing `EntityView/AppRoute` component and the `Interceptors` tab to `EntityView/Interceptors`, both on the FE-shaped model with the converters at the action boundary.
- [x] 8.7 Provide the create-modal body reusing `SchemeProperties` in `isModal` mode so `$id` and display-name validation match the entity-side create flow.

## 9. Client-side validation

- [x] 9.1 Add the save-blocking validation rules: non-empty `dial:applicationTypeDisplayName`; route keys matching `^[a-zA-Z0-9_]+$`; every route carrying non-empty `dial:paths`, non-empty `dial:methods`, and `dial:upstreams`; methods within `GET HEAD POST PUT DELETE PATCH`; every upstream carrying `dial:endpoint`; `dial:response` carrying both `dial:status` and `dial:body` when present.
- [x] 9.2 Surface each violation with a message identifying the offending route or field, via the existing save-validation context.

## 10. Tests

- [x] 10.1 Unit tests for the name-encoding helpers, including a `$id` round trip and rejection of ids containing `!~*'()`.
- [x] 10.2 Unit tests for `toCoreAppRoutes`/`fromCoreAppRoutes`: array↔object round trip, `dial:` prefixing, permission case flip, `extraData` object↔string, dropped upstream fields, duplicate-key error.
- [x] 10.3 Unit tests for `mergeAppRunnerResource` and the `createdAt` projection.
- [x] 10.4 Unit tests for `assets-app-runners/actions.ts` covering the strip list (`name`/`status`/`path`/`folderId` absent from the payload), create-conflict, update-etag, delete conditional semantics, and the resolved-schema error path.
- [x] 10.5 Component tests for `Assets/AppRunners/List` (flat rendering, no create-folder action, create action present) and for the tab set (exactly five tabs, no Applications or Audit).
- [x] 10.6 Component tests in `Assets/AppRunners/tests/View.spec.tsx` proving each validation rule blocks the save request, with the header mocked always-enabled so validation is the only possible gate (a mock that also disabled on `isChanged` made the assertions vacuous).

## 11. Quality checks

- [x] 11.1 Run lint, format check, and the full test suite from `apps/ai-dial-admin/`; fix any failures.

Note: no automated browser-verification task was added for this change — the user declined one when asked, despite several scenarios (menu placement, flat list, tab set, create action, validation blocking save) being browser-observable; coverage for those relies on the component tests in section 10.

## 12. Defects found running the feature against DIAL Core

All six were found by using the view, not by the suite — sections 1–11 were reported complete beforehand. Each fix carries a test verified to fail against the pre-fix code.

- [x] 12.1 Mount `AppRunnersFolderProvider` in `[lang]/layout.tsx`. The provider was never mounted, so every visit threw; the central test mock of all folder contexts hid it. Added `BaseAssetList/tests/provider-wiring.spec.ts` asserting each view in `AssetFolderContextMap` has its provider imported and mounted.
- [x] 12.2 Split the `$id` write guard into missing-id and forbidden-character errors, and add the character constraint to the create form's id field via an opt-in `forbiddenChars` prop on the shared id control (entity-side runners deliberately unaffected).
- [x] 12.3 Register `AssetsAppRunners` in `isSimpleEntity` and order the app-runner branch ahead of that check in the shared `Properties` dispatcher. `isSimpleEntity` defaults to `true`, so the app-runner branch was dead code and the create modal rendered the generic `name`-based form — the typed id never reached `$id`. This is what surfaced as the missing-id error from 12.2.
- [x] 12.4 Remove the folder-tree action set for this view. `addSibling`/`addChild` routed into the shared create-folder handler, which submits `getEmptyAsset` — no `$id` — so a folder create on a flat type could only fail.
- [x] 12.5 Scope the file manager's name rules for this view: override the ui-kit's default forbidden-symbols regex with a control-characters-only pattern (its default covers `:` and `/`, which greyed every row as invalid and disabled its context-menu actions), and gate row opening on a view-aware check instead of `isItemNameValid`. Also stop the manager label wrapping — `App Runners` is the first multi-word label.
- [x] 12.6 Stop the detail page decoding the `path` query parameter a second time, and derive the created-at column from the ui-kit's date-column factory so it renders a localized date instead of raw epoch milliseconds. Added `tests/path-round-trip.spec.ts` pinning all four encode/decode boundaries.

## 13. Verification status

- [x] 13.1 Full suite (708 files, 7148 tests) and `npm run build` pass.
- [x] 13.2 List, create, and the create → Core PUT → list round trip exercised against a live DIAL Core; the doubly-encoded resource name reads back as the decoded `$id`.

Not yet exercised against a live Core: the detail view's tabs (Properties, Features, Parameters, AppRoutes, Interceptors), update-with-etag, and delete. Given every defect in section 12 came from a wiring assumption the suite could not see, further instances should be expected in those surfaces.

## 14. Follow-up: asset runners selectable from asset applications (Issue #4078)

Deferred from this change's original non-goals. Makes the shipped `Assets > App Runners` surface reachable: an asset application can select an asset runner, store the correct reference, and reopen with it intact.

### 14.1 Reference-value helpers

- [x] 14.1.1 Add a pure `toRunnerReference($id)` composing `SCHEMAS_PREFIX + toCoreRunnerName($id)`, beside the existing name helpers in `src/utils/app-runners/`. Do not inline the concatenation at call sites — write and read must agree on one definition.
- [x] 14.1.2 Add its inverse, recognising a canonical reference and returning the `$id`, returning `undefined` for a value that is not one (so an entity `$id` passes through the reverse lookup untouched).

### 14.2 Whole-bucket Core list

- [x] 14.2.1 ~~Add a recursive sibling to `assetApi.list`~~ — **dropped.** This resource kind is flat (`PLATFORM_BUCKET_RESOURCE_TYPES`; `parseEncodedFlatPath` returns `folderId: ''`; section 12.4 removed folder creation for this view), so the bucket root already holds every runner and `list` already follows `nextToken` to completion. `asset-api.ts` needs no change.
- [x] 14.2.2 ~~Add a recursive flatten in `asset-metadata.ts`~~ — **dropped** with 14.2.1. A nested node cannot arise, and `parseEncodedFlatPath` would have mis-parsed one into `nested/http://b` as its name; supporting it would have meant changing a shared helper for an impossible case.
- [x] 14.2.3 Add `getAllRunners()` to `src/app/[lang]/assets-app-runners/actions.ts` wrapping `assetApi.list` with the empty path, returning every runner in the `platform` bucket.

### 14.3 Merged option list

- [x] 14.3.1 Define the merged row model in a `models.ts` beside the picker: the fields the grid renders plus an origin discriminator (an enum, per the repo's enums-over-string-unions rule) and the reference value. Do not widen `DialApplicationScheme` to carry asset fields.
- [x] 14.3.2 Add a pure builder mapping an admin-BE runner list and an asset runner list into that row model — entity rows keeping `$id` as the reference value, asset rows using `toRunnerReference`, asset rows labelled by `$id`.
- [x] 14.3.3 Fetch both lists in `src/app/[lang]/assets-applications/page.tsx` and `[id]/page.tsx`, with the asset read isolated so a Core failure degrades to the entity-only list instead of failing the page. Leave the other six `getApplicationSchemesList` consumers untouched.

### 14.4 Picker

- [x] 14.4.1 Add the `Source` column to the runner grid columns in `src/constants/grid-columns/grid-columns.tsx`, scoped to the picker's column set so `Entities > Application Runners` list columns are unaffected.
- [x] 14.4.2 Give the grid a sort fallback for rows with no `Display Name`, so asset rows are not grouped at one end by an empty sort key.
- [x] 14.4.3 Change the option value in `src/components/SourceField/Application/AppRunners.tsx` from `r.$id` to the row's reference value, and make `SelectAppRunnersModal` select and compare on it.
- [x] 14.4.4 Dispatch the resolved-schema read on the row's origin: `getResolvedApplicationScheme` for entity rows, `getResolvedRunnerSchema` for asset rows. Keep the existing fall-back-to-unresolved-runner behaviour on failure for both.
- [x] 14.4.5 Make `openInNewTab` route by origin — `/assets-app-runners/{path}` for asset rows, `/application-runners/{$id}` for entity rows.
- [x] 14.4.6 Fix the `valueTitle` lookup, which matches the selected value against the option list and therefore breaks on the reference-value change if left keyed on `$id`.

### 14.5 Reverse lookup

- [x] 14.5.1 Update the runner lookup in `src/components/Assets/Apps/Properties.tsx` to match a stored canonical reference as well as a plain `$id`. Its `scheme.$id === schemaSourceId` comparison can never match an asset reference.
- [x] 14.5.2 Confirm `showResponsesDefaults` follows from the corrected lookup — it reads `appRunner['dial:applicationTypeResponsesEndpoint']`, so a failed lookup silently hides the Responses defaults section.

### 14.6 Tests

- [x] 14.6.1 Unit tests for `toRunnerReference` and its inverse: `http://asdqwe` → `schemas/platform/http%3A%2F%2Fasdqwe` and back; an entity `$id` is not mistaken for a reference; round trip over ids containing `:` and `/`.
- [x] 14.6.2 Unit tests for the merged-row builder: both populations present, origin set correctly, entity reference value is the bare `$id`, asset rows labelled by `$id` with empty content columns.
- [x] 14.6.3 Unit tests for the whole-bucket list: an omitted path targets `schemas/platform/` (not `public/`), `nextToken` is followed to completion, and rows carry the decoded `$id` as name with the singly-encoded form as path.
- [x] 14.6.4 Component test asserting selection of an asset runner writes `schemas/platform/{encoded $id}` to `application_type_schema_id` — the exact string, not a match against a helper's output.
- [x] 14.6.5 Component test for the save → reopen round trip: an application whose stored reference is canonical renders the runner as selected, not blank.
- [x] 14.6.6 Component test asserting resolve dispatch by origin — an asset selection calls Core's resolved-schema action and not the admin BE's, and vice versa.
- [x] 14.6.7 Test that a failing asset-runner read still renders the picker with the admin-BE list.
- [x] 14.6.8 Test that the `Entities > Applications` picker offers entity runners only.

### 14.7 Quality checks

- [x] 14.7.1 Run lint, format check, and the full test suite from `apps/ai-dial-admin/`; fix any failures.
