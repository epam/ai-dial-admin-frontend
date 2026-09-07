## 1. API client

- [x] 1.1 Add `DEPLOYMENT_BY_ID_URL` and `TestSuitesApi.getDeploymentById` in `apps/ai-dial-admin/src/server/eval/test-suites-api.ts` (`GET api/v1/deployments/all/{id}` via `this.get`); verify with a new case in `test-suites-api.spec.ts` (plain id + slash-containing id)
- [x] 1.2 Add `getDeploymentById` server action in `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.ts`; verify with a case in `actions.spec.ts` that forwards the token

## 2. Run Summary link path

- [x] 2.1 Replace list/typed-guessing in `resolve-deployment-type.ts` with a single `getDeploymentById` → `$type` call
- [x] 2.2 Remove `useUtilityDeployments` from `DeploymentExternalLink.tsx`; drop the catalog parameter from `resolve-run-deployment.ts` (pass `[]` into `resolveDeploymentNavigationTarget`)

## 3. Unit / component tests

- [x] 3.1 Add `resolve-deployment-type.spec.ts` (returns `$type` / `undefined` on null; one `getDeploymentById` call)
- [x] 3.2 Add `use-deployment-type.spec.ts` (stored type skips fetch; missing type fetches once)
- [x] 3.3 Add `DeploymentExternalLink.spec.tsx` (loader while pending, icon when resolved, null when unresolved; `getAllDeployments` not called)
- [x] 3.4 Update `resolve-run-deployment.spec.ts` for the dropped catalog argument; keep MCP / type / null cases

## 4. Browser verification

- [x] 4.1 Run the `spec-browser-verify` skill against `migrate-run-summary-deployment-lookup` (local app at `:4200`, auth disabled) and resolve any `fail` verdicts before declaring the change complete

## 5. Quality

- [x] 5.1 Run lint, format, and the targeted vitest files from `apps/ai-dial-admin/` and fix any failures

## 6. Test Suite Properties

- [x] 6.1 Refactor `Properties.tsx`: use `deploymentRef.type` via `useDeploymentType` (by-id only when type missing); drop `getDeployments` list and `useUtilityDeployments`; enable Application picker without a Properties-level list; show Open when navigation resolves
- [x] 6.2 Add `Properties.spec.tsx`: Open with stored type does not call `getDeployments` / `getAllDeployments`; missing type calls `getDeploymentById` once; Open absent when unresolved
- [x] 6.3 Lint, format, and run Properties + existing migration vitest files from `apps/ai-dial-admin/`

## 7. Method tab and Conversations

- [x] 7.1 Refactor `MethodTabContent.tsx`: replace unfiltered `getDeployments` with `getDeployment(id, type)` or `getDeploymentById(id)`; update `MethodTabContent.spec.tsx` mocks
- [x] 7.2 Refactor Conversations `Properties.tsx` + `getAgentLinkForConversation` to use `getDeploymentById`; update utils tests; add Conversations Properties component spec
- [x] 7.3 Lint, format, and run MethodTabContent + Conversations + migration vitest files from `apps/ai-dial-admin/`
