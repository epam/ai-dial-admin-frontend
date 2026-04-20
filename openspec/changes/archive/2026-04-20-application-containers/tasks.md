## 1. Enums & Routes

- [x] 1.1 Add `APPLICATION = 'application'` to `CONTAINER_TYPE` in `src/types/deployments/containers.ts`
- [x] 1.2 Add `APPLICATION = 'application'` to `IMAGE_TYPE` in `src/types/deployments/images.ts`
- [x] 1.3 Add `ApplicationContainers = '/application-containers'` to `ApplicationRoute` in `src/types/routes.ts`

## 2. i18n

- [x] 2.1 Add the following keys in `src/constants/i18n.ts`:
  - `MenuI18nKey.ApplicationContainers`
  - `ImagesI18nKey.ImageTypeApplication`
  - `ContainersI18nKey.FromInternalApplicationImage`
  - `SourceI18nKey.ApplicationContainer`
  - `DeleteEntityI18nKey.ApplicationContainer`
  - (No `EntitiesI18nKey.ApplicationContainer` — mirrors absence of `EntitiesI18nKey.AdapterContainer`; no `NoAdapterContainers`-style empty-state key exists, generic `NoContainers` is reused)
- [x] 2.2 Add English translations in `src/locales/en.ts`:
  - `"Application Containers"`, `"Application Container"` (DeleteEntity + Source), `"Application image"`, `"From Internal Application Image"`

## 3. Menu

- [x] 3.1 Add `{ key: MenuI18nKey.ApplicationContainers, href: ApplicationRoute.ApplicationContainers }` immediately after the `AdapterContainers` entry in `MENU_CONFIGURATION` in `src/components/Menu/menu-configuration.tsx`

## 4. Routes — list & detail

- [x] 4.1 Create `src/app/[lang]/application-containers/page.tsx` mirroring `adapter-containers/page.tsx`, filtering by `CONTAINER_TYPE.APPLICATION`, passing `route={ApplicationRoute.ApplicationContainers}`
- [x] 4.2 Create `src/app/[lang]/application-containers/[id]/page.tsx` mirroring `adapter-containers/[id]/page.tsx` with:
  - Conditional image fetch for `source.$type === INTERNAL_IMAGE` only
  - `decodeVariables(container)`
  - `names` list for rename validation
  - Omit the `adaptersApi.getAdaptersList` fetch, `createEntity` prop, and `entityNames` prop
- [x] 4.3 Add `getApplicationContainers()` action + `containersApi.getApplicationContainers` backend helper — mirrors `getAdapterContainers`

## 5. ContainerView optionality

- [x] 5.1 Verify `createEntity` and `entityNames` props on `ContainerView` are optional. If they are not, make them optional and guard the companion-entity picker UI behind `createEntity != null`. Update adapter-containers call site to match.

## 6. Create dropdown & Docker-image-reference modal

- [x] 6.1 Add `createApplicationDockerImage` to the `ModalType` enum in `src/components/EntityListView/Components/Modals.tsx`
- [x] 6.2 In `src/components/Containers/List/HeaderButtons.tsx`, add `applicationDropdownItems` with "From Internal Application Image" (opens `ModalType.createContainer`) and "From Docker Image Reference" (opens `ModalType.createApplicationDockerImage`)
- [x] 6.3 Extend `showDropdown` to include `ApplicationRoute.ApplicationContainers`
- [x] 6.4 Wire dropdown-item selection to return `applicationDropdownItems` when `route === ApplicationRoute.ApplicationContainers`
- [x] 6.5 Add a `ServingCreate` portal block for `ModalType.createApplicationDockerImage` with `type={CONTAINER_TYPE.APPLICATION}` and `sourceType={CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE}`
- [x] 6.6 Confirm the shared `ContainerCreate` internal-image flow filters the image picker by `IMAGE_TYPE.APPLICATION` when `type = CONTAINER_TYPE.APPLICATION` — handled by the utility switch updates in task 7 (`getContainerType` / `getImageType` / `getContainerTypeByRoute`)

## 7. Deployment utility branches

- [x] 7.1 `src/utils/deployments/images.tsx`:
  - `getContainerTypeByImageType(IMAGE_TYPE.APPLICATION) → CONTAINER_TYPE.APPLICATION`
  - `getImageType(ApplicationRoute.ApplicationContainers) → 'APPLICATION'`
  - Include `IMAGE_TYPE.APPLICATION` in the `setTransport` transportType-stripping branch
- [x] 7.2 `src/utils/deployments/entity.ts`:
  - `getRouteByType(IMAGE_TYPE.APPLICATION) → ApplicationRoute.ApplicationContainers`
  - `getTranslatedType(ApplicationRoute.ApplicationContainers) → EntitiesI18nKey.Application` (new key added)
- [x] 7.3 `src/utils/deployments/containers.ts`:
  - `getContainerTypeByRoute(ApplicationRoute.ApplicationContainers) → CONTAINER_TYPE.APPLICATION`
  - `getContainerTemplate` requires no changes: APPLICATION falls through to the same defaults as ADAPTER, and the `transport` field is already gated on `type === CONTAINER_TYPE.MCP`
- [x] 7.4 `src/utils/deployments/export.ts`:
  - Add `CONTAINER_TYPE.APPLICATION` and `IMAGE_TYPE.APPLICATION` mappings
  - Add `APPLICATION_DEPLOYMENT`, `APPLICATION_IMAGE_DEFINITION`, `APPLICATION_CONTAINER` enum values to `DeploymentExportComponentType` / `DeploymentExportEntityType` in `types/deployments/export.ts`
- [x] 7.5 `src/constants/deployments/images.tsx`:
  - Add `[IMAGE_TYPE.APPLICATION]: ImagesI18nKey.ImageTypeApplication` to `IMAGE_TYPE_I18N_KEYS`
  - Add APPLICATION to the `IMAGE_TYPES` selector list
- [x] 7.6 `src/components/Breadcrumbs/constants.ts` — add Application Containers breadcrumb entry
- [x] 7.7 `src/components/EntityView/Modals/Delete/utils.ts` — add APPLICATION branch for delete confirmation labels
- [x] 7.8 `src/components/ExportConfig/AddEntities/utils.ts` and `src/components/ExportConfig/deployment-utils.ts` — add APPLICATION branches
- [x] 7.9 `src/utils/is-view.ts` — include ApplicationContainers in `isDeploymentManagerView`
- [x] 7.10 `src/constants/help-documentation-links.ts` — add entry for ApplicationContainers using `deployments-applications` doc path

## 8. Grep sweep for missed sites

- [x] 8.1 Grep sweep completed. Additional sites updated beyond tasks 7.x:
  - `src/utils/entities/get-export-deps.ts` — added `DEPLOYMENT_IMAGE_DEP.APPLICATION` and `APPLICATION_CONTAINER` branch
  - `src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils.ts` — added `applicationDeployments` / `applicationImageDefinitions` keys
  - `src/components/ExportConfig/Preview/utils.ts` — added `APPLICATION_DEPLOYMENT` / `APPLICATION_IMAGE_DEFINITION` mappings
  - `src/app/[lang]/export-config/actions.ts` — added `APPLICATION_CONTAINER` branch calling `containersApi.getApplicationContainers`
  - `src/components/ExportConfig/AddEntities/utils.ts` — mapped `DEPLOYMENT_IMAGE_DEP.APPLICATION` to new `ExportI18nKey.ApplicationImage`
  - `src/models/deployments/preview.ts` — added `applicationDeployments` / `applicationImageDefinitions` fields to `DeploymentImportPreviewResponse`
  - `ExportI18nKey.ApplicationImage` + locale string added
  - Intentionally skipped: `src/components/SourceField/utils.ts` (no Applications source field in scope), `src/components/Adapter/**` (adapter entity view, untouched per non-goals)

## 9. Tests

- [x] 9.1 Unit tests extending the existing spec files to cover APPLICATION:
  - `getImageType` + `setTransport` (images spec)
  - `getRouteByType` + `getTranslatedType` (entity spec)
  - `getContainerTemplate` with INTERNAL_IMAGE and IMAGE_REFERENCE (containers spec)
  - `getDeploymentExportComponentType` for APPLICATION container + image (export spec)
  - `DEPLOYMENT_ENTITY_TABS` length/ids/translation calls (deployment-utils spec)
- [x] 9.2 `getApplicationContainers` — covered indirectly via existing deployment actions spec patterns; no new dedicated test added (adapter parallel has none either)
- [x] 9.3 List-page component test — skipped; no parallel test exists for `adapter-containers/page.tsx` and the copied file is functionally identical
- [x] 9.4 `HeaderButtons` test extended to assert `FromInternalApplicationImage` + `FromDockerImageReference` items render on the Application Containers route
- [x] 9.5 Existing mocks reused; no new mocks added
- [x] 9.6 No `data-testid` used

## 10. Quality Checks

- [x] 10.1 `npm run lint` — 0 errors (26 pre-existing warnings, unrelated). `npm run format` — all files Prettier-clean. `npx vitest run` — 4200 tests passing, 16 skipped, 0 failing across 448 files. `tsc --noEmit` — 0 errors in any touched file.
