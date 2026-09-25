## 1. Canonical post-create navigation

- [x] 1.1 Update `apps/ai-dial-admin/src/utils/open-in-new-tab.ts` so flat platform routes can resolve the created resource name from `_metadata.name` after the existing `name` and `$id` sources, then retain the route's existing encoding behavior.
- [x] 1.2 Update `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/CreateEntity.tsx` and `apps/ai-dial-admin/src/components/Assets/Deployments/CreateAsset.tsx` to use the canonical entity URL builder for post-create redirects while preserving any required seeded-create route state.

## 2. Regression coverage

- [x] 2.1 Extend `apps/ai-dial-admin/src/utils/tests/open-in-new-tab.spec.ts` to cover colon-containing flat-platform and platform-bucket names, including a Core response identity supplied only as `_metadata.name`.
- [x] 2.2 Extend `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/tests/CreateEntity.spec.tsx` and `apps/ai-dial-admin/src/components/Assets/Deployments/tests/CreateAsset.spec.tsx` to assert encoded post-create redirects for Catalog models and platform Applications/Toolsets.

## 3. Quality checks

- [x] 3.1 Run the focused Vitest specs from `apps/ai-dial-admin/`, then run lint, format checking, both typecheck projects, and the applicable test suite; resolve failures caused by this change.

Browser verification was offered and declined; focused unit/component coverage covers the requested redirect-only scope.
