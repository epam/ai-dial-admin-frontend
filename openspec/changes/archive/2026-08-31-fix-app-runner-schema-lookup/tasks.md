## 1. Fix call sites

- [x] 1.1 In `src/components/Assets/Platform/AppRunners/Parameters.tsx` line 56, change `getResolvedRunnerSchema(toCoreRunnerName(runner.$id))` to `getResolvedRunnerSchema(runner.$id)`
- [x] 1.2 In `src/components/Assets/Platform/AppRunners/View.tsx` line 105, change `getResolvedRunnerSchema(toCoreRunnerName(id))` to `getResolvedRunnerSchema(id)`

## 2. Update stale comment

- [x] 2.1 In `src/server/core/app-runner-schema-api.ts`, replace the comment "Lookup is by Core config-map key, which for an API-written runner is its canonical ID (`schemas/platform/{name}`) rather than the runner's own `$id`." with "Lookup is by the runner's own `$id`, URL-encoded once for the query string. DIAL Core PR #1813 changed the key from the canonical config-map path (`schemas/platform/{name}`) to the schema's `$id` field."

## 3. Update tests

- [x] 3.1 In `src/app/[lang]/platform-app-runners/actions.spec.ts`, update the assertion at line 219 from `expect(appRunnerSchemaApi.resolvedSchema).toHaveBeenCalledWith(TOKEN_MOCK, ENCODED)` to `expect(appRunnerSchemaApi.resolvedSchema).toHaveBeenCalledWith(TOKEN_MOCK, ID)`
- [x] 3.2 In `src/components/Assets/Platform/AppRunners/tests/Parameters.spec.tsx`, update the assertion at line 40 from `expect(getResolvedRunnerSchema).toHaveBeenCalledWith('https%3A%2F%2Fhost%2Frunner')` to `expect(getResolvedRunnerSchema).toHaveBeenCalledWith('https://host/runner')`

## 4. Quality checks

- [x] 4.1 Run `npx vitest run src/app/[lang]/platform-app-runners/actions.spec.ts src/components/Assets/Platform/AppRunners/tests/Parameters.spec.tsx` from `apps/ai-dial-admin/` and confirm all tests pass
- [x] 4.2 Run `npm run lint` and `npm run format` and fix any issues

<!-- No browser verification task: all change scenarios' THEN clauses describe HTTP request contracts
     ("the request goes to Core with id set to ..."), not UI state. Unit tests in task 4.1 cover them. -->
