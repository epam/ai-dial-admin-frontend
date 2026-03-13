# Tasks

## Task 1: Add scaling to redeploy snapshot ✅

**Files:**
- `apps/ai-dial-admin/src/models/deployments/containers.ts` — add `scaling?: Autoscaling` to `ContainerRedeploySnapshot`
- `apps/ai-dial-admin/src/utils/deployments/containers.ts` — add `scaling: container.scaling` to `getContainerRedeploySnapshot`

## Task 2: Add tests ✅

**File:** `apps/ai-dial-admin/src/utils/deployments/tests/containers.spec.ts`

Add to the `getContainerRedeploySnapshot` describe block:
- `detects scaling change via snapshot inequality` — different `maxReplicas`
- `treats identical scaling as equal`
- `treats missing scaling on both sides as equal`

## Task 3: Run quality checks ✅

Run lint, format, and tests to verify no regressions.
