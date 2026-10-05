## Context

`EntityRoutes` and its child controls are built around `DialAppRoute[]`: they select by index, render `route.name`, validate unprefixed fields, and emit an updated array. That matches the admin-BE contracts for `/applications` and `/application-runners`.

Core-owned surfaces have different storage contracts that must remain visible in the JSON editor:

1. Asset applications store `routes` as an unprefixed object keyed by route name.
2. Platform and config-file App Runners store `dial:applicationTypeRoutes` as an object keyed by route name, using `dial:`-prefixed route, nested upstream, response, attachment-path, role, and permission fields.

The current `toCoreAppRoutes` and `fromCoreAppRoutes` collection converters conceal the second contract by replacing it with arrays. The planned object-native editor keeps the original object in parent state and operates directly on keyed route entries instead.

## Goals / Non-Goals

**Goals:**

- Preserve `EntityRoutes` and `ApplicationAppRoutes` as the unchanged array-only UI for admin-BE surfaces.
- Add an object-native Core-owned route editor for Asset Applications and Platform App Runners.
- Retain each Core-owned collection’s exact object shape in state, JSON editing, and persistence.
- Give the object-native editor a controlled field mapper for the unprefixed asset-application and `dial:`-prefixed App Runner object contracts.
- Validate Platform App Runner Core objects before saving without converting them to arrays.
- Load full runner details by explicit origin without changing their Core route representation.

**Non-Goals:**

- Generalizing the existing `EntityRoutes` API to every route storage type.
- Changing Core’s `dial:applicationTypeRoutes` schema, route name restrictions, or persistence endpoints.
- Fetching runner content for every picker option.

## Decisions

### Separate array and object route editors by backend ownership

`ApplicationAppRoutes` continues to compose `EntityRoutes` only for `/applications` and `/application-runners`. A new component under `components/Assets/` owns routes for `/assets-applications` and `/platform-app-runners`; its public input/output is always a keyed object.

**Alternative considered:** Add storage-format adapters to `EntityRoutes`. Rejected because the shared component and children are tightly coupled to array state and unprefixed `DialAppRoute` fields; extending it would make the admin-BE editor carry Core-specific storage behavior it does not own.

### Retain keyed objects in parent state and JSON editor

Platform App Runner and Asset Application state remains in the backend’s native object representation. The new UI identifies a route by its map key, updates that entry, and rebuilds the keyed object for add, rename, and delete. Platform App Runner JSON editing therefore shows Core’s `dial:` map exactly as Core stores it, while Asset Application JSON editing shows its unprefixed map.

**Alternative considered:** Convert Core maps to arrays on read and serialize them only for JSON editing or writes. Rejected because it gives the form and JSON editor divergent representations and makes raw JSON edits require an extra conversion lifecycle.

### Use field mappers inside the object-native UI, not collection converters

The object-native editor shares layout, route selection, and collection operations, but uses an explicit mapper for each object contract:

- Asset Application mapper reads and writes `paths`, `methods`, `upstreams`, `response`, `attachmentPaths`, and related unprefixed fields.
- Core App Runner mapper reads and writes `dial:paths`, `dial:methods`, `dial:upstreams`, `dial:response`, `dial:attachmentPaths`, `dial:userRoles`, and Core permission casing.

The mapper applies only to a selected object entry. It does not produce or consume a collection array. New object-native content controls replace the array-oriented `RouteContent` use for these surfaces as necessary.

### Validate the Core object contract directly

`validateAppRunner` receives the raw Core object from Platform App Runner state. It validates the keyed map, each key’s allowed route-name form, and Core-prefixed nested fields without using collection converters. A malformed map returns validation errors rather than throwing, including when entered directly in the JSON editor. `toRunnerPayload` preserves the validated object; it no longer translates an array to a Core map.

### Load runner details by explicit origin without normalizing routes

`useAssetRunnerDetails` continues to call `getRunner(path, DEFAULT_ETAG)` for Platform-origin options and `getConfigFileAppRunner($id/name)` for Config-origin options. It retains raw Core `dial:applicationTypeRoutes` objects while exposing the same interceptor and feature handling for either origin. Loading, stale-read, and failure semantics remain unchanged.

## Risks / Trade-offs

- **New object UI duplicates some array-editor controls** → Keep common presentation primitives only where their field contract is neutral; do not force Core data through array-only components.
- **Two object contracts could drift** → Isolate their differences in explicit, typed field mappers and cover both with focused tests.
- **Raw JSON can carry malformed Core maps** → Validate defensively and surface field-specific errors before the write action.
- **Route rename can leave stale keys** → Rebuild the object atomically from the edited route name and remove the previous key.
- **Detail reads can fail** → Keep the existing loading/error state so sourced asset applications do not render a false empty-route editor.

## Migration Plan

No stored-data migration is required. Core-owned route maps remain untouched in persisted form; only their UI editor changes. Reverting the frontend change restores the previous UI behavior without modifying stored resources.
