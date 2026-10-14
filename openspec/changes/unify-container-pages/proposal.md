## Why

The admin console has four near-identical page pairs for deployment containers — `/adapter-containers`, `/application-containers`, `/interceptor-containers`, `/mcp-containers`, each with a `[id]` detail page. They differ only in the `$type` filter, the companion-entity wiring (adapter, application, interceptor, toolset) and one provider wrapper. Every container feature is therefore touched four times, and the menu carries four entries for one concept.

## What Changes

- One listing page `/containers` shows containers of all four types (adapter, application, interceptor, MCP) with a new **Type** column.
- One detail page `/containers/[id]` loads the container and renders the existing view; the type-specific wiring (companion-entity list, create-entity action, provider wrapper) is chosen from `container.$type`.
- The create modal on `/containers` gets a **type selector**; the existing per-type source options (internal image, docker image reference, MCP registry) follow the chosen type.
- Name validation keeps today's rules: create and duplicate check names against every container (the backend id is shared by all types), rename on the detail page checks the container's own type via the existing `getContainers(type)` fetch.
- The four old list URLs and their `[id]` (and `[id]/[activityId]` audit) URLs redirect permanently to the new routes.
- Pin the container list column display (formatted **Source type**, **Source Name**, **Creation time**, **Updated time**) in the spec; the underlying Grid 2.0 regression is already fixed on `development` (#4973).
- The header help button shows the container type's documentation on the detail page and is hidden on the mixed-type list.
- The four menu entries collapse into one **Containers** entry.
- `ApplicationRoute.Containers` becomes the only container URL; the four `*Containers` members stay as internal container kinds (no longer URLs), derived from `container.$type`.
- **BREAKING**: URLs `/{adapter,application,interceptor,mcp}-containers[/…]` stop serving pages (redirected). Per-route persisted grid state (column visibility under the old `storageKey`s) is not migrated.

## Capabilities

### New Capabilities
- `containers`: unified list page, detail page, creation flow with type selector, name validation, legacy-URL redirects and single menu entry for adapter, application, interceptor and MCP containers.

### Modified Capabilities
- `application-containers`: list page, detail page and navigation-entry requirements move to `containers` (removed here); creation requirement retargeted to `/containers`.
- `activity-audit-deployments-detail`: the container chip navigates to `/containers/{id}` for all four subtypes.
- `activity-audit-deployments-tab`: audit tab and audit-row navigation use the unified container routes.
- `add-model-serving-toolset-source`: "Go to container" for an MCP source opens `/containers/[id]`; list-scoping scenario reworded.
- `container-list-resource-columns`: columns and persistence apply to `/containers` instead of four routes.
- `container-source-field-layout`: source-type label resolved from the container type, not the route.

## Non-goals

- `/model-servings` (HF) and `/deployment-images` stay as they are.
- No backend change; the containers API and its `?type=` filter are used as-is.
- No new container capabilities; behavior inside a type is unchanged.

## Impact

- Routing: new `app/[lang]/containers/{page,[id]/page}.tsx`; four route folders become redirects (`next.config.js` redirects already exist for the older `*-deployments` URLs and MUST point at the new routes too).
- ~85 non-spec references to the four route enum members (menu, breadcrumbs, help links, audit route map, open-in-new-tab, tabs, is-view, deployment-navigation, export-config, header buttons, banner, Source field) and their specs.
- i18n keys `MenuI18nKey.{Mcp,Interceptor,Adapter,Application}Containers`: the export-config labels still use them; the menu gets a new `Containers` key.
- Docs: `docs/MENU-DOCUMENTATION.md`.
