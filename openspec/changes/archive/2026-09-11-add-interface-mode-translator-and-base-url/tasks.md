## 1. Domain models

- [x] 1.1 Extend `src/models/dial/interfaces.ts`: add `InterfaceMode` enum (`Passthrough`/`Translator`),
  `TranslatorReference` type (`string | { base_url: string; out: DeploymentInterfaceType }`), and add
  `mode?`, `translator?`, `default_headers?`/`defaultHeaders?`, `defaults?`, `features?` to
  `DialResourceInterface` (snake_case) and `DialDeploymentInterface` (camelCase, per design D1's type
  symmetry decision — comment that it has no UI consumer yet).
- [x] 1.2 Add `base_url`/`baseUrl` to `DialModelResource`, `DialPlatformApplicationResource`,
  `DialApplicationResource` in `src/models/dial/resource.ts`, matching each type's existing casing.
- [x] 1.3 Add `baseUrl?: string` to `DialModelEndpoint` in `src/models/dial/model.ts`.
- [x] 1.4 Confirm `add-platform-translators`' `DialTranslatorResource` and `getTranslators` action shape
  (re-check the change's current state — 25/26 tasks per design's noted risk — before depending on it).

## 2. Common key-value grid component

- [x] 2.1 Create `src/components/Common/KeyValueGrid/KeyValueGrid.tsx`: a controlled, non-imperative
  key-value editor (no `forwardRef`/`useImperativeHandle`) with its own "Add" button rendered below the
  rows. Built as plain controlled `DialInput` row pairs rather than on `GridView`/ag-grid — see design.md
  D8 for why `default_headers`' flat string-to-string shape doesn't warrant ag-grid's column-def/cell-
  renderer machinery, superseding this task's original plan to reuse `getParamsColumns`/
  `getDeleteOperation` following `ParamsTab.tsx`.
- [x] 2.2 Add `tests/KeyValueGrid.spec.tsx` covering add/edit/delete-row behavior and that empty rows are
  excluded from the emitted value.

## 3. Entity-level base_url and upstream baseUrl

- [x] 3.1 Add a `base_url`/`baseUrl` `EndpointControl`-style input to
  `Assets/Platform/Models/Properties.tsx`, `Assets/Apps/Properties.tsx`, and wherever
  `Assets/Platform/Applications` renders its Properties, positioned between `OverrideNameControl` and
  `InterfacesField` (matching the field order already staged in `Assets/Apps/Properties.tsx`'s
  uncommitted diff), validated with the existing `getUrlError` helper. (Confirmed platform applications
  route through the same shared `ApplicationAssetProperties` as asset applications — no separate file.)
- [x] 3.2 Add a `baseUrl` `DialInput` to `UpstreamEndpoints/Endpoint/Endpoint.tsx`, on the same line as
  and before the `Key` input.
- [x] 3.3 Add `tests/Endpoint.spec.tsx` coverage (extend existing suite) for the new `baseUrl` field
  rendering and independence from `endpoint`.

## 4. Entity-level default headers editor

- [x] 4.1 Wire `KeyValueGrid` into `Assets/Platform/Models/Properties.tsx`, `Assets/Apps/Properties.tsx`,
  and the platform-applications Properties view for the entity-level `default_headers`/`defaultHeaders`
  value.
- [x] 4.2 Add/extend component tests for each Properties view to cover the new default-headers grid.

## 5. Interface mode and translator selection

- [x] 5.1 Add a `mode` `DialSelectField` (default `passthrough`) to `InterfaceRow.tsx` for `isAsset`
  surfaces, defaulting unset `mode` to `passthrough`.
- [x] 5.2 When `mode` is `translator`, replace the `base_url` input with a select of available
  `Translator` assets plus a `Custom` option; on selecting a named translator, store `translator` as that
  name string.
- [x] 5.3 When `Custom` is selected, render an inline `base_url` input and an `out` select (interface
  types excluding `Custom`); store `translator` as `{ base_url, out }`.
- [x] 5.4 Thread a `translators` prop (`ResourceInfo[]` — `getTranslators` returns list metadata only,
  not full `DialTranslatorResource` content) from each surface's `page.tsx` (fetching via
  `add-platform-translators`' `getTranslators`, following how `platform-models/[id]/page.tsx` already
  fetches `roles`/`interceptors`) through the View/TabsContent/Properties chain and `InterfacesField`
  down to `InterfaceRow`.
- [x] 5.5 Add/extend `InterfacesField.spec.tsx` and `InterfaceRow` tests for mode switching, named
  translator selection, and the `Custom` inline flow.

## 6. Per-interface default headers, Defaults, and Features popups

- [x] 6.1 Wire `KeyValueGrid` into `InterfaceRow.tsx` for that interface's `default_headers`.
- [x] 6.2 Add a `Defaults` button + popup on `InterfaceRow.tsx` containing a Monaco JSON editor bound to
  the interface's `defaults` object, following the JSON editor pattern from
  `add-table-draft-schema-json-editor` (`JsonEditorInput`); block confirmation on invalid JSON.
- [x] 6.3 Add a `Features` button + popup on `InterfaceRow.tsx`. Reuses the field set/grouping the asset
  Features editors already render (`resourceSwitchGroups`/`resourceFeatureLabelMap` from
  `Assets/Resources/constants.ts`, the `DialResourceFeatures` shape common to both
  `ModelResourceFeatures` and `ResourceFeatures`) rather than importing either resource-specific
  component directly, since both are hardcoded to their own resource type and neither takes a bare
  `features` object.
- [x] 6.4 Add tests for both popups: open/edit/confirm/cancel behavior and that changes are scoped to the
  single interface, not the entity or other interfaces.

## 7. i18n

- [x] 7.1 Add i18n keys for: entity `base_url` label/placeholder, upstream `Base Url` label, default
  headers grid labels, `mode` selector options, translator selector + `Custom` labels, `out` select
  label, and the `Defaults`/`Features` popup buttons/titles, in `src/constants/i18n.ts` and
  `src/locales/en.ts`. (Entity `base_url` label and `out` label reuse the existing
  `EntityFieldsI18nKey.baseUrl`/`.translatorOut` `add-platform-translators` already added, rather than
  duplicating them.)

## 8. Final quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, and the full `npm run test` suite
  from `apps/ai-dial-admin/`; fix any failures introduced by this change. Full suite: 1005/1009 files,
  11821/11825 tests passed; the 4 failures (`ContainerNodePool.spec.tsx`, `ImportConflicts.spec.tsx`,
  `MenuContent.spec.tsx`) are in files this change never touches, timed out only under full-suite
  parallel load, and pass cleanly (14/14) when re-run in isolation — pre-existing flakiness, not a
  regression from this change.
