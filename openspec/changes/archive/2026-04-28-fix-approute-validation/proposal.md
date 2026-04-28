## Why

The `SaveValidationContext` uses a flat `Map<string, boolean>` with no key namespacing and no cleanup on component unmount. When multiple app routes share the same validation key (`"displayName"`), switching between routes or tabs leaves stale entries that corrupt the aggregate `isValid` signal — blocking saves for the wrong reasons or allowing them when invalid routes exist.

## What Changes

- Add `RemoveField` action to `SaveValidationContext` so keys can be explicitly deleted from the map
- Add unmount cleanup to `DisplayNameControl` to remove its key from the context when it unmounts, preventing stale validation entries across tab switches
- Add `trackGlobalValidity` prop to `DisplayNameControl` (default `true`); when `false`, the component only maintains local inline error state and does not dispatch to the global context
- `EntityRoutes` computes validity for **all** routes eagerly from route data (not from mounted components) and registers a single `"appRouteNames"` key in the global context
- Remove the existing workaround that disabled app route switching when `isValid` is false — this is no longer needed and was harmful to UX

## Capabilities

### New Capabilities

- `approute-validation`: Correct validation tracking for app routes — all routes' name validity is computed from data in `EntityRoutes` and registered as a single context key; field controls clean up their context entries on unmount

### Modified Capabilities

_(none — no spec-level requirement changes to existing capabilities)_

## Impact

- `SaveValidationContext` — new action type, no breaking change to existing consumers
- `DisplayNameControl` — new optional prop, fully backward-compatible
- `EntityRoutes` — adds eagerly-computed route validity, removes the `isValid` guard on route switching
- `AppRouteList` — remove `pointer-events-none` guard tied to `!isValid`
- `RouteProperties` — passes `trackGlobalValidity={false}` for app route context
- No API or server-action changes
