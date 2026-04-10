# Fix Autoscaling Bugs

**Issue:** [#2900](https://github.com/epam/ai-dial-admin-frontend/issues/2900)
**Type:** Bug fix

## Problem

Three autoscaling-related bugs in the container deployment UI:

1. **2h/6h scale-to-zero options accepted by UI but rejected by Knative** — The webhook rejects `scale-to-zero-pod-retention-period` values > 1 hour due to a Knative bug ([knative/serving#13725](https://github.com/knative/serving/issues/13725)).

2. **Min replicas=0 allowed with "Never scale to zero"** — Contradictory config: user selects "Never automatically scale to zero" but can set min replicas to 0, which allows zero running replicas.

3. **Phantom error indicator after discard in JSON editor** — After editing scaling in JSON editor, getting a server error, discarding, and switching back to form UI, the Endpoint Configuration section shows a false error indicator. Root cause: `getPortError(undefined)` returns an error for `containerGrpcPort` on MCP containers after `resetCounter` forces validation to re-run.

## Solution

### Fix 1: Remove 2h and 6h options
Remove the `'7200'` and `'21600'` entries from `AUTOSCALE_OPTIONS` in `constants/deployments/containers.tsx`.

### Fix 2: Validate min replicas with scale-to-zero setting
Add a `scaleToZeroDisabled` parameter to `getReplicasError()`. When true and `min === 0`, return a validation error. Pass this flag from `ContainerAutoscaling` handlers based on whether `scaleToZeroDelaySeconds` is absent/0.

### Fix 3: Fix `getPortError` for undefined values
Add an early return in `getPortError()` for `undefined` when `required` is falsy — consistent with how `getPathError` already handles this case.

## Files to change

- `src/constants/deployments/containers.tsx` — remove 2h/6h options
- `src/utils/deployments/validation.ts` — fix `getReplicasError`, fix `getPortError`
- `src/components/Deployments/Fields/ContainerAutoscaling.tsx` — pass scale-to-zero flag to validation

## Non-goals

- Fixing the upstream Knative bug
- Adding threshold field validation
- Changing JSON editor validation flow
