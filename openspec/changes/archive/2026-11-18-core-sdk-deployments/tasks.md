## 1. Deployment reads on the SDK

- [x] 1.1 Delete the listing chain: `CoreUtilityApi.getAllDeployments`, the conversations `getAllDeployments` action and its spec case, `use-utility-deployments.ts`, and `DEPLOYMENTS_URL` / `DEPLOYMENT_URL` in `core-utility-api.ts`; drop the `getAllDeployments` mocks and `not.toHaveBeenCalled()` assertions in the Conversations `Properties`, `Runs/Summary/DeploymentExternalLink` and `TestSuites/Properties` specs. Leave `server/eval/test-suites-api.ts`'s own `DEPLOYMENTS_URL` alone
- [x] 1.2 `checkDeploymentByName(name, token)` calls `sdk.getDeploymentInfo(encodeCorePath(name), init)` through `sdkGet<DeploymentData>` and returns `DeploymentData | null`; do not use `getDeployment` or `getDeployments`
- [x] 1.3 Add `getDeploymentById(id, token)`: the same call with the id passed unchanged; JSDoc on both methods names their input (typed name vs Core-issued, already-encoded id)
- [x] 1.4 Remove the `TODO` above `checkDeploymentByName`; leave `getCoreVersion` on `BaseApi`

## 2. Consumers

- [x] 2.1 The conversations `getDeployment` action calls `getDeploymentById`; re-type it and the `Properties.tsx` state to `DeploymentData`
- [x] 2.2 Add a pure util mapping Core's `object` to `DeploymentType` (`model` → `Model`, `application` → `Application`, else `undefined`), with unit tests for each branch
- [x] 2.3 `getAgentLinkForConversation` takes `DeploymentData | null | undefined` and the mapped type, resolves through `resolveDeploymentNavigationTarget` (conversation `model.id`, type, `modelRoute`), and falls back to `resolveCatalogDeploymentNavigation` when no type maps; delete `isEvalDeployment` and the eval `Deployment` cases
- [x] 2.4 `Properties.tsx` passes the mapped type to `useModelDeploymentRoute` instead of `$type`, and counts the agent as resolving while the type is `Model` and `modelRoute` is `undefined`
- [x] 2.5 Confirm `checkIsUniqueDeploymentName` needs no change and still treats only `null` as unique

## 3. Tests

- [x] 3.1 Extend `core/tests/core-utility-api.spec.ts` (real SDK, `vitest-fetch-mock`, `CORE_TEST_URL`), for both lookups: a `GET` to `/v1/deployments/{…}` on the Core host; 404 → `null`; 403 → `undefined`; other failure and abort → `null`
- [x] 3.2 Encoding: `checkDeploymentByName` with `?`, `#`, `%` and a space each stays one encoded segment and `a/b` stays `a/b`; `getDeploymentById('applications/bucket/My%20App')` requests that path unchanged, not `My%2520App`
- [x] 3.3 Update `Assets/tests/utils.spec.ts`, the `Properties` spec and the conversations-actions spec: model shows loading until the probe resolves (including the render right after the lookup) and links to the probed route; `applications/bucket/app` links to Assets Applications path `bucket/app`; unprefixed `my-app` with `reference` ≠ id links to Applications; unmapped `object` falls back; no lookup result offers no link

## 4. Gates

- [x] 4.1 Run `npx vitest run src/server/core src/app src/hooks src/components/Assets src/components/Runs src/components/TestSuites` from `apps/ai-dial-admin/`, then `npm run typecheck`, `npm run typecheck:specs` and `npm run lint`
- [x] 4.2 Run the full `npm run test` as the final gate
