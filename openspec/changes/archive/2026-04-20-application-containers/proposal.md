## Why

The deployment manager backend now exposes Application as a new image-definition and deployment type (see `specs/011-application-type` and migration `V1.54` in `epam/ai-dial-admin-deployment-manager-backend`). It is structurally identical to Adapter — empty marker subclasses, Jackson discriminator `$type: "application"`, and `GET /api/v1/deployments?type=APPLICATION` already work. The frontend has no UI for listing, viewing, or creating application containers or application-type images, so users cannot exercise the backend capability.

## What Changes

- Add `/application-containers` list and detail routes, mirroring the existing `/adapter-containers` flow.
- Add a new "Application Containers" entry in the Deployments menu group, right after "Adapter Containers".
- Extend `CONTAINER_TYPE` with `APPLICATION = 'application'` and `IMAGE_TYPE` with `APPLICATION = 'application'`.
- Extend the shared `/deployment-images` list to render application-type images through the same Type column (no new route).
- Add the "Create" header dropdown for application containers with options "From Internal Application Image" and "From Docker Image Reference" — parallels the adapter pattern.
- Add `ModalType.createApplicationDockerImage` for the docker-image-reference flow.
- Add i18n keys and English translations mirroring adapter wording.
- Update all switch-based deployment utilities (route-by-type, export component type, container template, entity page resolution, breadcrumbs, delete confirmation, export-config add-entities, etc.) to handle the new type.

## Non-goals

- No link between `ApplicationContainer` and the existing rich `DialApplication` entity. The adapter-style companion-entity creation (`createEntity`, `entityNames`, adapters list prefetch in the detail page) is **deferred** and will be proposed separately.
- No `SourceField/Applications` picker.
- No changes to the existing `/applications` page, `DialApplication` model, or `Applications/` components.
- No new feature flag — the menu item is gated only by the existing `deploymentsEnabled` flag at the group level.
- No standalone `/application-images` route — the shared `/deployment-images` list is extended.

## Capabilities

### New Capabilities
- `application-containers`: list, view, and create application-type containers and recognize application-type images in the deployment manager UI.

### Modified Capabilities
_None — adapter and interceptor flows are untouched._

## Impact

- New routes under `src/app/[lang]/application-containers/` (`page.tsx`, `[id]/page.tsx`).
- `ApplicationRoute.ApplicationContainers` added to `src/types/routes.ts`.
- `CONTAINER_TYPE.APPLICATION`, `IMAGE_TYPE.APPLICATION` added to `src/types/deployments/{containers,images}.ts`.
- Menu entry in `src/components/Menu/menu-configuration.tsx`.
- i18n enums: `MenuI18nKey.ApplicationContainers`, `EntitiesI18nKey.ApplicationContainer`, `ImagesI18nKey.ImageTypeApplication`, `ContainersI18nKey.FromInternalApplicationImage`, `SourceI18nKey.ApplicationContainer`, `DeleteEntityI18nKey.ApplicationContainer` — plus English translations in `src/locales/en.ts`.
- `ModalType.createApplicationDockerImage` in `src/components/EntityListView/Components/Modals.tsx`.
- `HeaderButtons.tsx`: new `applicationDropdownItems`, extended `showDropdown`, new `ServingCreate` portal block.
- Deployment utility branches in `src/utils/deployments/{images,entity,containers,export}.ts` and `src/constants/deployments/images.tsx`.
- `getApplicationContainers` action in `src/app/actions/deployments.ts`.
- Updates to `src/components/Breadcrumbs/constants.ts`, `src/components/EntityView/Modals/Delete/utils.ts`, `src/components/ExportConfig/AddEntities/utils.ts`, `src/components/ExportConfig/deployment-utils.ts`, `src/utils/is-view.ts`, `src/constants/help-documentation-links.ts`.
- No API/server-layer changes beyond the type filter call-site.
