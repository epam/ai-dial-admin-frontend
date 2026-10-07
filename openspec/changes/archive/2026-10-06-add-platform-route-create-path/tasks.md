## 1. Platform Route create form

- [x] 1.1 Update `apps/ai-dial-admin/src/components/Assets/Platform/Routes/CreateProperties.tsx` so `RouteCreateProperties` renders one required Path input, validates it with `getErrorForPath`, and writes the result as the sole item in `paths` while preserving the name-only Core identity and the absence of Display Name and Description.
- [x] 1.2 Update `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/CreateEntity.tsx` to initialize the shared `path` validation entry as invalid for `ApplicationRoute.PlatformRoutes`, so the modal cannot submit a name-only route.

## 2. Automated tests

- [x] 2.1 Extend `apps/ai-dial-admin/src/components/Assets/Platform/Routes/tests/CreateProperties.spec.tsx` to cover the accessible required Path control, its valid `paths: [path]` update, and its empty/invalid inline validation state.
- [x] 2.2 Extend `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/tests/CreateEntity.spec.tsx` to verify Platform Route creation keeps Create disabled until a valid initial Path and name are supplied, then delegates a one-path payload to the create action.

## 3. Quality checks

- [x] 3.1 Run the focused Platform Route create-form and `CreateEntity` Vitest specs from `apps/ai-dial-admin/`.
- [x] 3.2 Run formatting, linting, both application and spec typechecks, and the full test suite.
