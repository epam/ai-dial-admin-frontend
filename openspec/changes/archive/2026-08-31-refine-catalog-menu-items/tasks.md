## 1. Util rewrite

- [x] 1.1 In `src/utils/env/get-menu-items.ts`, extract the key-parsing logic into a private
  `parseKey(rawKey: string): string` helper and rewrite `getActualMenuItems` to apply
  group-level filtering: before mapping children, filter out groups whose key (via `parseKey`)
  appears in `disableItems`.
- [x] 1.2 In `src/utils/env/tests/menu-items.spec.ts`, add a test that verifies a group whose
  key is in `disableItems` is removed entirely (regardless of its children).

## 2. Remove redundant isPreview from platform items

- [x] 2.1 In `src/components/Menu/menu-configuration.tsx`, remove `isPreview: true` from each
  of the six Catalog items: PlatformModels, PlatformAppRunners, PlatformInterceptors,
  PlatformRoutes, PlatformRoles, PlatformKeys. The `isPreview: true` on the Catalog group
  itself must stay.
- [x] 2.2 In `src/components/Menu/tests/menu-configuration.spec.ts`, update the Catalog group
  tests: the `each platform item carries isPreview: true` test should be removed or rewritten to
  assert `isPreview` is absent (or undefined) on each item.

## 3. Quality checks

- [x] 3.1 Run `npx vitest run src/utils/env/tests/menu-items.spec.ts src/components/Menu/tests/menu-configuration.spec.ts`
  from `apps/ai-dial-admin/` and confirm all tests pass.
- [x] 3.2 Run `npm run lint` and `npm run format` from the repo root and fix any issues.
