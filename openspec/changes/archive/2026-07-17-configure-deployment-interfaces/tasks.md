## 1. Models & constants

- [x] 1.1 Add `DeploymentInterfaceType` enum (`openaiChatCompletions`, `openaiResponses`,
      `anthropicMessages`) in `src/models/dial/interfaces.ts`.
- [x] 1.2 Add `DialDeploymentInterface { baseUrl: string }` and `DialResourceInterface { base_url:
      string }` types in `src/models/dial/interfaces.ts`.
- [x] 1.3 Add `interfaces?: Record<string, DialDeploymentInterface>` to `DialModel`
      (`src/models/dial/model.ts`), `DialApplication` (`src/models/dial/application.ts`), and
      `DialInterceptor` (`src/models/dial/interceptor.ts`).
- [x] 1.4 Add `interfaces?: Record<string, DialResourceInterface>` to `DialApplicationResource`
      (`src/models/dial/resource.ts`).
- [x] 1.5 Add per-view allowed-type catalogs (`MODEL_INTERFACE_TYPES`,
      `APPLICATION_INTERFACE_TYPES`, `INTERCEPTOR_INTERFACE_TYPES`,
      `ASSET_APPLICATION_INTERFACE_TYPES`) in `src/constants/deployment-interfaces.ts`, mirroring
      admin-backend's `DeploymentInterfaceTypes.java`.
- [x] 1.6 Add `InterfacesI18nKey` entries (section title, per-type labels) to `src/constants/i18n.ts`
      and corresponding strings to `src/locales/en.ts`. (Add/Delete button labels reuse the existing
      `ButtonsI18nKey.Add`/`ButtonsI18nKey.Delete` keys instead of new ones.)

## 2. Generic `InterfacesField` component

- [x] 2.1 Create `src/components/BaseControls/InterfacesField/InterfacesField.tsx`: props `entity`,
      `onChangeEntity`, `allowedTypes`, `isAsset?`, `disabled?` — renders section title, bordered
      container, existing rows, and the add control. (Placed in `BaseControls/`, not `Common/`, and
      uses the `entity`/`onChangeEntity`/`isAsset` prop shape to match the existing shared-field
      convention already used by `BaseControls/MaxRetryAttempts.tsx`, rather than a bare
      `value`/`onChange`/`baseUrlKey` API.)
- [x] 2.2 Implement single-allowed-type behavior: "+ Add" creates that type's row directly (no
      dropdown), button hides once the row exists.
- [x] 2.3 Implement multi-allowed-type behavior: "+ Add" opens a dropdown filtered to types not yet in
      `entity.interfaces`; selecting closes the dropdown and reveals the labeled input; button hides
      once all types are present.
- [x] 2.4 Implement per-row delete control (`DialGhostIconButton` + `IconTrashX` red icon) that removes
      that type's entry from `entity.interfaces`.
- [x] 2.5 Wire row inputs to the entry's `baseUrl`/`base_url` field (selected via `isAsset`) via a
      controlled `DialInput`, calling `onChangeEntity` with the updated entity on every keystroke.
- [x] 2.6 Respect `disabled` (read-only admin / immutable entity) by hiding add/delete controls and
      rendering inputs as read-only, consistent with existing read-only handling in
      `ResourceMultiAuth`.
- [x] 2.7 Add component tests in
      `src/components/BaseControls/InterfacesField/tests/InterfacesField.spec.tsx` covering: dropdown
      shows only unused types, single-type add has no dropdown, add button hides when exhausted,
      delete removes a row and restores add availability, input change calls `onChangeEntity` with
      correct casing per `isAsset`, disabled state.

## 3. Wire into the four entity views

- [x] 3.1 Render `InterfacesField` in `src/components/ModelView/ModelProperties/ModelProperties.tsx`
      with `allowedTypes={MODEL_INTERFACE_TYPES}`, bound to the model draft's `interfaces`.
- [x] 3.2 Render `InterfacesField` in `src/components/Applications/View/Properties/Properties.tsx` with
      `allowedTypes={APPLICATION_INTERFACE_TYPES}`, bound to the application draft's `interfaces`.
- [x] 3.3 Render `InterfacesField` in `src/components/Interceptors/View/Properties/Properties.tsx` with
      `allowedTypes={INTERCEPTOR_INTERFACE_TYPES}`, bound to the interceptor draft's `interfaces`.
- [x] 3.4 Render `InterfacesField` in `src/components/Assets/Apps/Properties.tsx` (alongside the existing
      `ResourceMultiAuth`) with `allowedTypes={ASSET_APPLICATION_INTERFACE_TYPES}` and `isAsset`, bound
      to the asset draft's `interfaces`.

## 4. Save-time stripping of empty values

- [x] 4.1 Add a shared `stripEmptyInterfaces` helper (pure function) in
      `src/utils/deployments/interfaces.ts` that removes entries with a blank/empty
      `base_url`/`baseUrl` and returns `undefined` when the resulting map is empty.
- [x] 4.2 Apply `stripEmptyInterfaces` in `src/app/[lang]/models/actions.ts` (`updateModel`,
      `createModel`) before sending the payload.
- [x] 4.3 Apply `stripEmptyInterfaces` in `src/app/[lang]/applications/actions.ts`
      (`updateApplication`, `createApplication`) before sending the payload.
- [x] 4.4 Apply `stripEmptyInterfaces` in `src/app/[lang]/interceptors/actions.ts`
      (`updateInterceptor`, `createInterceptor`) before sending the payload.
- [x] 4.5 Apply `stripEmptyInterfaces` in `src/app/[lang]/assets-applications/actions.ts` (`updateApp`,
      `createApp`), alongside the existing `stripExternalServiceAuthStatuses` call.
- [x] 4.6 Add unit tests for `stripEmptyInterfaces` covering: blank value removed (both castings),
      non-empty value kept, all-empty map becomes `undefined`, undefined input passed through, empty
      map input.
- [x] 4.7 Add/extend server-action tests for each of the four `actions.ts` files confirming the outgoing
      payload omits empty interface entries and preserves non-empty ones.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, and `npm run test` (from `apps/ai-dial-admin/`) and fix
      any failures.

## 6. UI polish (post-implementation feedback)

- [x] 6.1 Fix the "+ Add" button stretching full width: wrap it in its own non-flex `<div>` inside the
      `InterfacesField.tsx` bordered container so it sizes to content instead of stretching under
      `flex flex-col` cross-axis stretch.
- [x] 6.2 Fix the per-row delete button's vertical alignment: extracted each row into
      `InterfaceRow.tsx`, switched from `DialGhostIconButton`+`IconTrashX` to the dedicated
      `DialRemoveButton` (matching the existing `Path.tsx`/`Endpoint.tsx` per-row delete convention),
      with the row using `items-end` so the button aligns to the bottom of the input.
- [x] 6.3 Add URL validation to each interface row matching `BaseControls/Endpoint/Endpoint.tsx`'s
      pattern: `getUrlError` + `useSaveValidationContext`/`ValidationActionType` (`SetField` on
      mount/change/`resetCounter`, `RemoveField` on row delete/unmount), inline `error`/`invalid` on
      the `DialInput`. Blank values are not flagged (they're stripped on save); only non-empty invalid
      URLs block save.
- [x] 6.4 Extend `InterfacesField.spec.tsx` with tests for: URL validation error shown/cleared, no
      error for a blank value, add button wrapped in its own container.
