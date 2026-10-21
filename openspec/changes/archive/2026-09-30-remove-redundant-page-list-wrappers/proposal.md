## Why

Asset list routes currently depend on `PageList` components that only render their colocated `List` component. Removing these pass-through wrappers makes the route-to-list relationship direct without changing the rendered UI or data flow.

## What Changes

- Remove the seven unused `PageList` wrappers for asset applications, toolsets, and platform app runners, interceptors, models, roles, and routes.
- Update each affected route to render its existing sibling `List` component directly.
- Update tests that mock the asset applications wrapper to mock the direct list dependency instead.

## Non-goals

- Change list behavior, data loading, routing, or client/server component boundaries.
- Refactor the underlying list components or introduce a shared replacement abstraction.

## Capabilities

### New Capabilities

- `asset-list-route-composition`: Internal route composition requirements for asset list pages.

### Modified Capabilities

None.

## Impact

- Affected code: seven `PageList.tsx` components, their corresponding App Router pages, and two asset-applications route tests.
- APIs, dependencies, and user-visible behavior are unchanged.
