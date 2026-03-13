# Container Redeploy Snapshot — Scaling

## Backend Reference

`DeploymentService.isApplicableForRollingUpdate` in `ai-dial-admin-deployment-manager-backend` includes:

```java
!Objects.equals(existing.getScaling(), updated.getScaling())
```

The `Scaling` object contains: `minReplicas`, `maxReplicas`, `scaleToZeroDelaySeconds`, and `strategy` (`$type` + `threshold`).

## Requirements

### REQ-1: Add `scaling` to `ContainerRedeploySnapshot`

- The `ContainerRedeploySnapshot` interface must include `scaling?: Autoscaling`
- `getContainerRedeploySnapshot` must return `container.scaling` as-is (no normalization needed — values are primitives/simple objects)

### REQ-2: "Save & redeploy" shown on scaling changes

- When a running container's `scaling` fields differ from the saved state, the header must show "Save & redeploy" instead of "Save"
- This applies to all container types (`MCP`, `NIM`, `HF`, `INTERCEPTOR`, `ADAPTER`)

### REQ-3: Tests

- Add test: scaling change (e.g. `maxReplicas` differs) → snapshots are not equal
- Add test: identical scaling → snapshots are equal
- Add test: `undefined` scaling on both sides → snapshots are equal

## Files to Change

| File | Change |
|---|---|
| `apps/ai-dial-admin/src/models/deployments/containers.ts` | Add `scaling?: Autoscaling` to `ContainerRedeploySnapshot` |
| `apps/ai-dial-admin/src/utils/deployments/containers.ts` | Add `scaling: container.scaling` to `getContainerRedeploySnapshot` |
| `apps/ai-dial-admin/src/utils/deployments/tests/containers.spec.ts` | Add snapshot tests for scaling changes |
