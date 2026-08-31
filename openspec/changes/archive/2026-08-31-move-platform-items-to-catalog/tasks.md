## 1. Menu configuration

- [x] 1.1 In `src/components/Menu/menu-configuration.tsx`, move the six platform items
  (`PlatformModels`, `PlatformAppRunners`, `PlatformInterceptors`, `PlatformRoutes`, `PlatformRoles`,
  `PlatformKeys` — each with `isPreview: true` and its `ApplicationRoute.*` href) from `Assets.items`
  into `Catalog.items` as the first six entries, in that order.
- [x] 1.2 In the same file, add `isPreview: true` to the Catalog group object.

## 2. Tests

- [x] 2.1 In `src/components/Menu/tests/menu-configuration.spec.ts`, update the
  `describe('MENU_CONFIGURATION — Assets group', ...)` block: remove or rewrite the tests that assert
  platform items (`PlatformAppRunners`, `PlatformInterceptors`, `PlatformRoutes`, `PlatformRoles`) are
  present or in a specific order within the Assets group, since those items have moved.
- [x] 2.2 In the same spec file, extend the `describe('MENU_CONFIGURATION — Catalog group', ...)`
  block with tests that:
  - assert all six platform item keys are present in the Catalog group's `items` array,
  - assert each platform item carries `isPreview: true`,
  - assert the Catalog group entry itself has `isPreview: true`,
  - assert `getActualMenuItems` **includes** the Catalog group when its items array is non-empty.
- [x] 2.3 Add a test that asserts none of the six platform items appear in the Assets group.

## 3. Quality checks

- [x] 3.1 Run `npx vitest run src/components/Menu/tests/menu-configuration.spec.ts` from
  `apps/ai-dial-admin/` and confirm all tests pass.
- [x] 3.2 Run `npm run lint` and `npm run format` from the repo root and fix any issues.

_No browser-verification task: user opted out; unit tests cover all spec scenarios._
