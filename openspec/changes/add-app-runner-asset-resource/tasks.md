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
- [x] 3.2 Add a pure `isValidRunnerId($id)` guard rejecting ids containing `!`, `~`, `*`, `'`, `(`, `)` — characters `encodeURIComponent` leaves unescaped and `ENTITY_NAME_PATTERN` disallows.

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
