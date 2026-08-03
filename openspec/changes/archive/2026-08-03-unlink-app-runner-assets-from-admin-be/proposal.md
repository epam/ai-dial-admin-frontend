## Why

`Assets > App Runners` is described as a Core-direct surface, and its published spec `assets-app-runners` states that without qualification. It is not accurate: the runner resource itself is read and written through DIAL Core, but four separate picker/catalogue reads still go to the admin backend, so the surface cannot be configured when that service is unavailable.

The sibling `Assets > Models` surface hit the same problem and resolved half of it in `add-model-asset-resource` (archived 2026-08-03): the two catalogues with no Core counterpart were unlinked, and the three Core-owned entity lists were deferred as task 17.6 precisely because the work spans both asset surfaces and adds a client for a second Core route family. This change is that deferred work, done for App Runners.

Doing it now matters for a reason beyond tidiness: the picker feeds references that Core validates on write. A picker sourced from the admin backend can offer an entity the backend holds but has not pushed to Core, which then fails the save with an HTTP 422 the user cannot act on.

## What Changes

- **Add a Core file-config client** for `GET /v1/admin/config/file/{type}[/{name}]`, a read-only route family `AssetApi` does not cover. It is the only way to see config-file-defined entities, which Core's metadata listing deliberately omits — `ConfigResourceMetadataController`'s own javadoc states "listings are now blob-only. File-sourced entries are not surfaced here".
- **Add a union helper** that merges the two populations Core keeps for the same entity type — API-written ("core asset") entries from `/v1/metadata/{type}/platform/` and config-file entries from the file-config route — with dedup and per-population reference-form rules.
- **Move the interceptor picker to Core.** Both the Interceptors tab's selectable list and the global-interceptors display currently come from the admin backend.
- **Move the per-route role picker to Core.** The AppRoutes tab's `RouteRoles` control is fed by an admin-backend role list, reached through `EntityRoutes`.
- **Drop the topics catalogue for this view.** Core has no topic registry at all — `descriptionKeywords` is a free `List<String>` on `Deployment` — so unlike the entity lists there is nothing to substitute. The control already seeds from the resource and accepts typed entry, so the fetch is enrichment rather than a dependency, exactly as established on the models side.
- **Correct the `assets-app-runners` spec.** Its Core-direct claim becomes a qualified statement of what actually holds: every read and write of the runner resource goes to Core, and no admin-backend call is required to configure a runner.
- Not breaking: no route, resource shape, or stored reference changes. A runner saved before this change reads back identically after it.

## Capabilities

### New Capabilities

- `core-config-file-client`: Read-only access to DIAL Core's config-file entity surface (`/v1/admin/config/file/{type}[/{name}]`), and the union of that population with the API-written population from the metadata listing — including dedup, per-population reference forms, and independent-failure behaviour when only one source responds.

### Modified Capabilities

- `assets-app-runners`: The interceptor and per-route role pickers are sourced from DIAL Core rather than the admin backend; the topics catalogue read is removed; and the surface's Core-direct claim is narrowed to a statement that holds — configuring a runner requires no admin-backend call.

## Impact

- **New**: a Core file-config client under `src/server/core/`, and a pure union/dedup helper with its own tests.
- `src/app/[lang]/assets-app-runners/[id]/page.tsx`: currently fetches `rolesApi.getRolesList` and `interceptorsApi.getInterceptorsList` (both `DIAL_ADMIN_API_URL`); both move to Core reads.
- `src/components/EntityView/Interceptors/Interceptors.tsx`: fetches `getProperties` → `utilityApi.getSystemProperties` on mount for the global-interceptors list. Shared with the entity surfaces, so the Core path must be scoped to this view rather than swapped globally.
- The topics path is transitive and easy to miss: `Assets/AppRunners/Properties.tsx` → `ApplicationRunners/ConfigurationView/Properties` → `AppRunnerExtendedProperties` → `TopicsControl`. `TopicsControl` receives no `view` prop there, which is why the models-side fix did not affect it — so a `view`-based gate alone will not work here.
- `src/constants/assets-core.ts` and `src/types/resource-type.ts`: registering `INTERCEPTOR` and `ROLE` for the metadata half of the union.
- `openspec/specs/assets-app-runners/spec.md`: the corrected claim.
- **Unchanged**: `Entities > Application Runners` and its admin-backend actions; the runner resource's own CRUD, which is already Core-direct; every other consumer of the shared interceptor, role and topic controls.

### Explicitly out of scope

- **The Models side of the same union** — `Assets > Models` still reads its role list, interceptor list and global interceptors from the admin backend. It should consume the client this change introduces, as a follow-up, rather than being bundled here.
- **Any change to `Entities > Application Runners`**, which is admin-backend-backed by design.
- **Writing config-file entities.** The file-config surface is read-only; a picker may offer those entries but nothing in the admin UI can create or edit one.

### Pre-existing defects found while verifying the models change

Recorded here so they are not lost. Neither is this change's work, and neither should be fixed as a side effect:

- `UpstreamEndpoints.onAddEndpoint` inserts **two** rows on the first click — `upstreams.length === 1 ? [...upstreams, {}] : upstreams`. Affects `Entities > Models` too.
- The list grid's name cells share `id="name"` with the create-modal input, so four elements on the page carry that id — an HTML-validity and accessibility problem.
