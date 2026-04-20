## Context

Backend spec `011-application-type` (merged in `epam/ai-dial-admin-deployment-manager-backend`) introduces `APPLICATION` as a new image-definition and deployment type. It is an empty marker subclass of the existing deployment and image-definition polymorphic hierarchies — byte-for-byte schema parity with Adapter. Jackson discriminator is `$type: "application"` for both containers and image definitions; migration `V1.54` adds `application_image_definition` and `application_deployment` tables; `GET /api/v1/deployments?type=APPLICATION` filters.

The frontend already has a near-complete precedent in `/adapter-containers`:
- A list page that filters the unified `getContainers()` response by `CONTAINER_TYPE.ADAPTER`.
- A detail page that delegates to the shared `ContainerView`.
- A shared `HeaderButtons` with an adapter-specific "Create" dropdown.
- A shared `/deployment-images` list rendering the Type column from `IMAGE_TYPE_I18N_KEYS`.

Adapter containers additionally link to the `DialAdapter` entity via `createEntity={createAdapter}` and an adapters-list prefetch in the detail page. **This link is explicitly excluded from this change.**

## Goals / Non-Goals

**Goals:**
- Mirror the adapter deployment flow exactly in structure.
- Ship the new type enum values, routes, menu entry, list/detail pages, create dropdown, docker-image-reference modal, and i18n.
- Extend every switch-based deployment utility that enumerates image/container types.

**Non-Goals:**
- No companion-entity linking to `DialApplication`.
- No `/application-images` route.
- No changes to the existing `/applications` page or `Applications/` components.
- No new feature flag.

## Decisions

### 1. Enum string value: `'application'`
`CONTAINER_TYPE.APPLICATION = 'application'` and `IMAGE_TYPE.APPLICATION = 'application'` — matches the backend Jackson name. All polymorphic payloads then round-trip without special casing.

### 2. Route naming: `/application-containers`
Parallels `/adapter-containers`. No `/application-images` — the shared `/deployment-images` list suffices.

### 3. Detail page is a subset of adapter-containers/[id]
Omit the `adaptersApi.getAdaptersList()` prefetch and the `createEntity`/`entityNames` props on `ContainerView`. Everything else — image prefetch for `INTERNAL_IMAGE`, `decodeVariables`, `names` list for rename validation, `SaveValidationContextProvider` — is identical.

**Why:** keeps the initial change scoped to "list/view/create" only, matching the user's intent to defer application-entity linking. Requires `createEntity` and `entityNames` on `ContainerView` to be optional; if they are not already, make them optional as part of this change and guard the companion-entity picker UI behind `createEntity != null`.

### 4. Docker-image-reference modal: new `ModalType` entry
Add `ModalType.createApplicationDockerImage` and render the matching `ServingCreate` portal block in `HeaderButtons`. Reuses the adapter/interceptor/MCP precedent verbatim. No refactor to a generic typed modal — matches repo style and keeps the diff reviewable.

### 5. Menu position
Right after `MenuI18nKey.AdapterContainers` in the Deployments group. No feature flag.

### 6. i18n label wording
All English strings use "Application" verbatim:
- `Menu.ApplicationContainers` = "Application Containers"
- `Images.ImageTypeApplication` = "Application image"
- `Containers.FromInternalApplicationImage` = "From Internal Application Image"
- `Entities.ApplicationContainer` = "Application container"
- `DeleteEntity.Entities.ApplicationContainer` = "Application container"
- `Source.ApplicationContainer` = "Application container"

The pre-existing "Applications" entries in the Entities and Assets groups remain untouched — the word "Containers" is the disambiguator in the Deployments group.

### 7. Utility switches exhaustively updated
Every deployment utility that switches on `CONTAINER_TYPE` or `IMAGE_TYPE` gets an `APPLICATION` branch. Known sites:
- `getContainerType(imageType)` in `utils/deployments/images.tsx` → `CONTAINER_TYPE.APPLICATION`.
- Image update logic (line ~105 of `images.tsx`) that strips `transportType` for adapter/interceptor → include APPLICATION (matches adapter behavior).
- `getRouteByType` in `utils/deployments/entity.ts` → `ApplicationRoute.ApplicationContainers`.
- `getContainerTemplate` in `utils/deployments/containers.ts` → APPLICATION returns the same shape as ADAPTER for both `INTERNAL_IMAGE` and `IMAGE_REFERENCE`, no `transport` field.
- `CONTAINER_TYPE_TO_EXPORT_COMPONENT` and `IMAGE_TYPE_TO_EXPORT_COMPONENT` maps in `utils/deployments/export.ts`.
- `IMAGE_TYPE_I18N_KEYS` map in `constants/deployments/images.tsx`.
- Breadcrumb map in `components/Breadcrumbs/constants.ts`.
- Delete modal utility in `components/EntityView/Modals/Delete/utils.ts`.
- Export-config add-entities utilities in `components/ExportConfig/AddEntities/utils.ts` and `components/ExportConfig/deployment-utils.ts`.
- `utils/is-view.ts`.
- `constants/help-documentation-links.ts`.

### 8. DeploymentExportComponentType values
If the enum already has `APPLICATION_DEPLOYMENT` and `APPLICATION_IMAGE_DEFINITION` values (shipped with backend spec 011), wire them in. If missing on the frontend but present on the backend, add the enum values. Task 7.4 resolves this during implementation.

### 9. No backend shims
The backend accepts `$type: "application"` today. No feature-flag guarding or graceful-degradation is required. If the deployed backend version is older than spec 011, users simply see an empty list and creation attempts fail server-side — same behavior as any other missing-backend-support case in this repo.

## Risks / Trade-offs

- **Risk — missed switch site.** Deployment-type enums are switched on in many places. Task 8 is an explicit grep sweep to catch un-enumerated call sites. `Record<CONTAINER_TYPE, ...>` / `Record<IMAGE_TYPE, ...>` maps give TypeScript-level exhaustiveness; raw `switch` statements don't and are the higher-risk category.
- **Risk — `DeploymentExportComponentType.APPLICATION_*` may be absent.** Low risk; task 7.4 verifies and adds.
- **Risk — `ContainerView` props may not be optional.** Task 5 handles the optionality conversion.
- **Trade-off — duplication over generic abstraction.** Following the adapter precedent verbatim; no refactor to a generic type-parameterized container flow. Matches the repo pattern and keeps diffs reviewable.
- **Trade-off — deferred companion-entity linking.** Means creating an application container will not simultaneously create a matching entity in `/applications`. Acceptable per the user's stated plan to add that in a later change.
