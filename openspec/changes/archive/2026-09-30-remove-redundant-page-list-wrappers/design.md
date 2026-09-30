## Context

The affected asset routes import dedicated `PageList` components, but each wrapper only returns its colocated client-side `List` component. The routes can consume that existing list directly; no list behavior, props, data fetching, or App Router server/client boundary changes.

## Goals / Non-Goals

**Goals:**

- Remove redundant indirection from the seven asset list routes.
- Preserve the existing rendered output and route-level data dependencies.
- Keep the affected route tests isolated by mocking the new direct dependency.

**Non-Goals:**

- Alter list implementations, list props, data fetching, or route behavior.
- Establish a new shared page-list convention.

## Decisions

### Import colocated `List` components directly

Each route will replace its `PageList` import with the exact list component the wrapper currently renders, then the wrapper file will be deleted.

**Rationale:** The target list components are already client components and retain the same props, so direct imports preserve the current Next.js component boundary and rendered result.

**Alternative considered:** Retain wrappers as a future extension point. This introduces seven unused abstractions without a present responsibility, while direct imports follow the existing list component pattern.

### Update mocks at the dependency boundary

The two affected asset-applications route tests will mock `Assets/Apps/List` rather than the deleted `Assets/Apps/PageList` module.

**Rationale:** Tests must continue to isolate the route from the client list it now imports directly.

## Risks / Trade-offs

- [A route import points to an incorrect list export] → Preserve the component name and props used by the existing wrapper, then run targeted tests and typechecks.
- [A stale `PageList` reference remains] → Search for all references after deletion and verify no unresolved imports remain.
- [Test mocks no longer intercept the direct dependency] → Update the two known route test mocks and run their test files.

## Migration Plan

No deployment migration is needed. The change deletes internal modules and updates compile-time imports; reverting restores the wrapper files and route imports.

## Open Questions

None.
