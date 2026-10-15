## Context

`ApplicationRoute` currently doubles as a *view* and a *type discriminator*: `McpContainers`, `AdapterContainers`, `ApplicationContainers`, `InterceptorContainers` are passed to `ContainersList`, `ContainerView`, `HeaderButtons`, `ContainerCreate`, tab factories, `getTranslatedType`, `getUrnForEntity`, the audit route map, breadcrumbs, help links and `is-view`. About 85 non-spec references. The four page pairs already share all components; they differ in the `$type` filter, the companion-entity wiring and `ToolsetFolderProvider` (MCP only).

`getContainers(type?)` already exists (action `deployments.ts`, `ContainersApi.getContainers`) and forwards `?type=`; `getMCPContainers`, `getAdapterContainers`, … are fixed-type wrappers of the same call.

## Goals / Non-Goals

**Goals:** one list route, one detail route, type selector in the create modal, per-type name validation, redirects, one menu entry, no behavior change inside a type.

**Non-Goals:** model-servings, deployment-images, backend changes, migrating persisted grid state.

## Decisions

### D1. One URL route; the four members stay as internal container kinds
Add `ApplicationRoute.Containers = '/containers'` for every URL, menu href, breadcrumb and navigation. The four `ApplicationRoute.{Mcp,Adapter,Application,Interceptor}Containers` members are **kept** but stop being URLs: they remain the internal "container kind" discriminator that ~15 helpers (`getTranslatedType`, `getTranslatedEntity`, tab factories, `SourceField/utils`, `getContainersByView`, …) and the `route`/`view` props of `ContainerView`, `ContainerCreate`, `Delete` already switch on. A single mapping `getContainerKind(type: CONTAINER_TYPE): ApplicationRoute` (and the inverse) lives in `src/constants/deployments/container-types.ts`; pages and rows derive the kind from `container.$type` and pass it down unchanged. A `CONTAINER_TYPE`-keyed config holds the per-type data the list and create modal need (label, source options, help link, companion wiring).

**Why:** the discriminator is threaded through ~85 references and props; rewriting every helper to take `$type` is a risky, wide diff with no user-visible gain. Redirects (D6) catch any leftover old-path URL, so a missed URL site degrades to a redirect, not a 404. **Alternative rejected:** deleting the four members and rewriting all helpers to `$type` — cleaner end state, but it multiplies the blast radius; it can follow as a separate refactor. The old members' values are no longer valid paths, so a lint-visible comment on the enum marks them as kinds, and URL builders MUST go through `getContainerPath` / `ApplicationRoute.Containers`.

### D2. Detail page branches through a config map
`containers/[id]/page.tsx` fetches the container, then looks up `{ loadEntities, createEntity, Wrapper }` by `$type` (adapter → `adaptersApi` / `createAdapter`; application → none; interceptor → its API and creator; MCP → `toolSetsApi` / `createToolset` / `ToolsetFolderProvider`). The map lives server-side next to the page because loaders use server APIs; a `$type` outside the four renders `notFound()`. Companion entities are loaded only for the matching type, so the page does not fetch toolsets for an adapter.

### D3. Name validation: keep today's rules
No new method. The detail page calls `getContainers(type)` with the container's own `$type` (uppercased, as the existing wrappers do) and filters out the container itself. The list page keeps passing **all** container names (inference included) to the create and duplicate modals. **Why not per type for create:** in the deployment-manager backend the `deployment` table has a single primary key `id` shared by every type (`pk_deployment`) and a unique `service_name`, and `DeploymentRepository.getById(id)` takes no type, so a same-named container of another type would collide or overwrite. Per-type checking is therefore only safe on the detail page, where the name is not being claimed. **Alternative rejected:** per-type names everywhere (the earlier plan) — it would let the UI accept a name the backend cannot store.

### D4. Type selector is a field inside the create modal
`HeaderButtons` stops switching on route and renders one "Create" control. The modal contains a required type selector (no default) plus the source option for that type; source options, image-picker filter and `$type` of the POSTed container come from the D1 config. The `ModalType.create*DockerImage` variants collapse into one modal driven by the selected type and source option. `ModelServings` keeps its own header buttons (it is not routed through this list). Shared components (`ContainerCreate`, `ServingCreate`) are used, not extended with new props for this caller; the type-dependent parts are handled in a wrapper.

### D5. List page
`containers/page.tsx` calls `getContainers()` once, keeps `$type ∈ {adapter, application, interceptor, mcp}`, and `ContainersList` gains a Type column in `CONTAINERS_COLUMNS` (label from the D1 config). `storageKey` becomes `/containers`; old per-route column state is abandoned.

### D6. Redirects in `next.config.js`
Permanent redirects `/:prefix/<legacy>` → `/:prefix/containers`, `/:prefix/<legacy>/:path*` → `/:prefix/containers/:path*` for the four segments (covers `[id]` and `[id]/[activityId]`). The existing `mcp-deployments` / `interceptor-deployments` redirects are retargeted to `/containers` to avoid a double hop. Redirects, not folder stubs, so no `page.tsx` remains under the old paths.

### D7. Cross-cutting call sites
Audit route map (`constants/activity-audit.ts`), `open-in-new-tab`, `deployment-navigation`, breadcrumbs, `is-view`, tabs (`utils/tabs`), export-config and `getContainersByView` map the four container kinds to `ApplicationRoute.Containers` for URLs only; code that switches on the kind keeps doing so. `getContainersByView` keeps serving `Models/Applications/Toolsets/Interceptors/Adapters` views (those are entity views, unrelated to container routes). Export-config labels keep `MenuI18nKey.*Containers` (they name entity types, not menu items); the menu gets a new `MenuI18nKey.Containers`.

## Risks / Trade-offs

- **Breadth**: ~85 references. Mitigated by phasing (tasks) so each PR compiles and passes both typechecks.
- **Kind vs URL confusion**: the four kept members look like routes. Mitigated by the `getContainerPath` helper, an enum comment, and the redirects as a safety net.
- **Bookmarked grid state lost** (column visibility per old `storageKey`) — accepted, called out as BREAKING.
- **Detail rename stays per type**: harmless while names are not editable there; if rename ever changes the id it must move to the global rule.
- **Redirect loops/ordering** with the existing `*-deployments` rules — covered by a test of the redirect table.
