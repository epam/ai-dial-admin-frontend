## Why

Run Summary (and Compare Summary) builds the deployment external link with up to three network
calls: two eval listing calls to guess deployment type when `deploymentRef.type` is missing, plus a
full admin catalog list for navigation fields. The same list-then-find pattern appears on Test Suite
Properties (Open Application), Method tab (`selectedApplication` for Change Method), and Assets
Conversations Properties (agent link via admin catalog). The eval backend now exposes
`GET /api/v1/deployments/all/{id}`, which resolves type server-side — callers that need one
deployment should use stored type and/or a single get-by-id
([#4380](https://github.com/epam/ai-dial-admin-frontend/issues/4380)).

## What Changes

- Add eval API client method + server action for `GET /api/v1/deployments/all/{id}`
  (`getDeploymentById`).
- Replace the list/typed-guessing fallback in `resolveDeploymentType` with that single call.
- Stop loading the full admin deployments catalog from `DeploymentExternalLink` (used by Run Summary
  and Compare Summary).
- Drop the unused catalog argument from `resolveRunDeployment`; navigation uses `$type` plus the
  existing `applications/` prefix fallback.
- Test Suite Properties Open Application: read `deploymentRef.type` (zero calls when present); fall
  back to `getDeploymentById` only when type is missing; drop unfiltered `getDeployments()` and
  `useUtilityDeployments()`.
- Method tab: replace unfiltered `getDeployments()` with `getDeployment(id, type)` when type is
  present, else `getDeploymentById(id)`, for `selectedApplication`.
- Assets Conversations Properties: replace admin `getAllDeployments()` + find-by-reference with
  eval `getDeploymentById(model.id)`; agent link built from `$type` + id.

## Non-goals

- No change to the `useUtilityDeployments` hook module itself if other callers remain.
- Create wizard Target step still uses typed/filtered `getDeployments` lists for picking.
- No shared cache for Compare’s two deployment links.

## Capabilities

### New Capabilities

- `run-summary-deployment-link`: How Run Summary / Compare Summary, Test Suite Properties, Method
  tab selection, and Conversations agent link resolve a single deployment (fetch strategy, loading /
  empty states, MCP vs deployment suites).

### Modified Capabilities

_(none)_

## Impact

- `apps/ai-dial-admin/src/server/eval/test-suites-api.ts` — new `getDeploymentById`.
- `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.ts` — new server action.
- `apps/ai-dial-admin/src/components/Runs/Summary/` — `resolve-deployment-type`,
  `DeploymentExternalLink`, `resolve-run-deployment`.
- `apps/ai-dial-admin/src/components/TestSuites/Properties/Properties.tsx` — Open Application path.
- `apps/ai-dial-admin/src/components/TestSuites/View/MethodTabContent.tsx` — selectedApplication.
- `apps/ai-dial-admin/src/components/Assets/Conversations/View/Properties.tsx` +
  `Assets/utils.ts` — agent link.
- Co-located unit/component tests.
