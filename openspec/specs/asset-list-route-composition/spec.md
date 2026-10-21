# Asset List Route Composition Specification

## Purpose

Define the direct component composition used by asset list routes after removal of redundant pass-through wrappers.

## Requirements

### Requirement: Direct asset list route composition
Asset application, toolset, platform app runner, interceptor, model, role, and route list pages SHALL render their existing colocated list client components directly rather than through a pass-through `PageList` module.

#### Scenario: Asset list route loads
- **WHEN** a user opens any affected asset list route
- **THEN** the route renders the same corresponding list component and receives the same route-provided data as before the cleanup

### Requirement: No obsolete PageList wrappers
The system MUST NOT retain a `PageList.tsx` wrapper that only renders the corresponding list component for the affected asset list pages.

#### Scenario: Route dependencies are resolved
- **WHEN** the application builds the affected asset list routes
- **THEN** each route resolves its list component without importing a deleted pass-through `PageList` module
