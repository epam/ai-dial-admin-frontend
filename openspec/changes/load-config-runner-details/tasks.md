## 1. Object-native Core route UI

- [x] 1.1 Create a typed object-native App Routes component under `apps/ai-dial-admin/src/components/Assets/` that owns keyed route-object selection, add, edit, rename, and delete operations without converting the collection to an array.
- [x] 1.2 Implement typed unprefixed Asset Application and `dial:`-prefixed Core App Runner field mappers plus object-native route content controls, preserving each route object’s nested fields and the selected contract’s permission and role representation.
- [x] 1.3 Wire the object-native component into `apps/ai-dial-admin/src/components/Assets/Apps/` for asset applications and `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/TabsContent.tsx` for Platform/config-file App Runners; retain `ApplicationAppRoutes` and `EntityRoutes` unchanged for admin-BE surfaces.

## 2. Core route reads, validation, and persistence

- [x] 2.1 Update `apps/ai-dial-admin/src/components/Assets/Platform/use-asset-runner-details.ts` to select Platform or Config runner reads by origin, retain raw Core `dial:applicationTypeRoutes` objects, preserve loading/error/stale-request behavior, and remove diagnostic logging.
- [x] 2.2 Update `apps/ai-dial-admin/src/app/[lang]/platform-app-runners/actions.ts` and `apps/ai-dial-admin/src/utils/app-runners/validation.ts` so Platform App Runner reads and writes retain raw Core route objects and validation safely checks Core keyed `dial:` entries, including JSON-editor input.
- [x] 2.3 Remove `apps/ai-dial-admin/src/utils/app-runners/core-app-routes.ts`, its collection conversion models if no longer needed, and the obsolete converter tests; remove dependent conversion calls from Platform App Runner actions.
- [x] 2.4 Update asset application route-tab wiring so own unprefixed objects and inherited raw Core App Runner objects select the appropriate object-native field mapper; retain origin-independent inherited interceptors and features.

## 3. Automated coverage

- [x] 3.1 Add focused tests for object-native route collection operations and both field mappers, including key-derived names, renamed keys, Core nested fields, roles, permissions, response, and attachment paths.
- [x] 3.2 Update `apps/ai-dial-admin/src/utils/app-runners/tests/validation.spec.ts` and `apps/ai-dial-admin/src/app/[lang]/platform-app-runners/actions.spec.ts` for valid and invalid raw Core route maps, JSON-editor-safe failures, and unchanged write payloads.
- [x] 3.3 Update the Platform App Runner and Asset Application route-tab specs to prove object-native routing, sourced Config/Platform runner maps rendered read-only, and unchanged admin-BE array route behavior.
- [x] 3.4 Update `apps/ai-dial-admin/src/components/Assets/Platform/tests/use-asset-runner-details.spec.tsx` to cover origin-aware raw runner details and failure behavior.

## 4. Quality checks

- [x] 4.1 Run the affected Vitest specs from `apps/ai-dial-admin/`, then run `npm run lint`, `npm run typecheck`, and `npm run typecheck:specs`.

## Browser verification

No browser-verification task was added because the user chose to rely on focused automated tests and type checks instead.
