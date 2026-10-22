## Why

The admin backend is being phased out. After that, a running Deployment Manager container can only
become usable in DIAL Core if the frontend writes the Core asset itself. Today only MCP containers
can do that, through "Asset toolset". Adapter, application and interceptor containers, and
text-generation Model Servings, can create only an admin-backend entity, and their pages call the
admin backend with no guard.

## What Changes

- Container detail page (`/containers/[id]`): the Create action for ADAPTER, APPLICATION and
  INTERCEPTOR containers becomes a dropdown with two independent options, as MCP already has
  (`ContainersButtonsWrapper` `createToolsetOptions`):
  - the existing admin-backend entity (adapter / application / interceptor);
  - a new Core asset: a **model** for an adapter container, and an application or interceptor in
    the `platform` bucket for the other two.
  Each click creates exactly one entity. Nothing is written to both stores.
- Model Serving detail page (`/model-servings/[id]`): the text-generation "Create model" action gets
  the same two options (admin-backend model / Core model). The text-classification toolset action
  gets an admin-backend toolset or a Core toolset.
- Without the admin API (`DIAL_ADMIN_API_URL` unset, `getIsAdminApiEnabled()` false), the page shows
  one plain button for the Core option, labelled with the entity name and no "Asset" prefix. An
  adapter container's button reads "Create model". The page makes no admin-backend call.
- New per-type asset templates, derived from the container. They fill the Core fields each entity
  needs to route:
  - adapter → model: `baseUrl` plus a chat or embeddings interface;
  - model serving → model: a full `endpoint` plus `overrideName`;
  - interceptor and application: `baseUrl`/`base_url` plus the chat interface;
  - MCP → toolset: `endpoint` (unchanged).
- Duplicate-name validation for every Core create reads Core: the type's `platform` names and the
  type's config-file names. A name taken by another type is refused by Core (409), and the modal's
  existing error notification shows it.

## Capabilities

### New Capabilities

- `container-core-assets`: creating a Core asset from a running container. Covers the options shown
  with and without the admin API, the per-type asset template (field set and URL derivation), and
  duplicate-name validation against Core.

### Modified Capabilities

- `containers`: the "Companion entity per type" scenario changes. It now offers the admin-backend
  entity and the Core asset, and it reflects that application containers already offer a linked
  application.
- `model-serving-capability-gating`: the capability-driven create action offers the Core variant
  alongside the admin-backend one.
- `admin-api-availability`: container detail pages skip every admin-backend call when the admin
  API is absent.

## Non-goals

- No dual-write. One click never writes both an admin-backend entity and a Core asset. Writing both
  would make Core serve the asset in place of the exported entity under the same name.
- No Core "adapter" concept. Core has none, so an adapter container yields one model per create.
  Several models served by one adapter mean several creates.
- No automatic re-sync of a Core asset's URL after a container change. The Deployment Manager URL is
  stable per deployment id (`dm-<id>`), so a URL change needs a new deployment.
- No removal of the admin-backend options. They go when the backend is switched off, which the
  `adminApiEnabled` gate already handles.
- No new asset create form. The existing `CreateAsset` modal and the platform create actions are
  reused. The modal gains one optional prop for the platform-only target.

## Impact

- `components/EntityHeaderControls/Wrappers/ContainersButtonsWrapper.tsx`: options, labels, admin-API
  branch.
- `app/[lang]/containers/[id]/page.tsx`, `app/[lang]/model-servings/[id]/page.tsx`: guarded
  admin-backend calls, Core name lists, folder providers per type.
- `utils/deployments/entity.ts`: `getAssetTemplate` grows per-type templates.
- Reuses `platform-models`, `platform-interceptors`, `assets-applications` and `assets-toolsets`
  create actions, plus the `AssetFolderContextMap` folder contexts. No change to `AssetApi`.
- New i18n keys for "Asset model", "Asset interceptor" and "Asset application" dropdown labels.
