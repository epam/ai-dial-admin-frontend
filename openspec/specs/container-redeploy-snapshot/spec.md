# container-redeploy-snapshot Specification

## Purpose

What the container redeploy snapshot compares, so that a change the deployment manager applies through a rolling update is offered as "Save & redeploy". The backend's `DeploymentService.isApplicableForRollingUpdate` treats any difference in `scaling` (`minReplicas`, `maxReplicas`, `scaleToZeroDelaySeconds` and `strategy`) as such a change.

## Requirements

### Requirement: The redeploy snapshot includes scaling

The `ContainerRedeploySnapshot` interface SHALL include `scaling?: Autoscaling`, and `getContainerRedeploySnapshot` SHALL return the container's `scaling` as-is, without normalization.

#### Scenario: A scaling change makes the snapshots differ

- **WHEN** two container states differ only in `scaling` (for example `maxReplicas`)
- **THEN** their redeploy snapshots SHALL NOT be equal

#### Scenario: Identical scaling keeps the snapshots equal

- **WHEN** two container states carry identical `scaling`
- **THEN** their redeploy snapshots SHALL be equal

#### Scenario: Absent scaling on both sides keeps the snapshots equal

- **WHEN** neither container state carries `scaling`
- **THEN** their redeploy snapshots SHALL be equal

### Requirement: A scaling change offers Save & redeploy

When a running container's `scaling` differs from the saved state, the header SHALL show "Save & redeploy" instead of "Save". This SHALL apply to every container type: MCP, Hugging Face, interceptor and adapter.

#### Scenario: Editing max replicas on a running container

- **GIVEN** a running container
- **WHEN** the user changes its maximum replicas
- **THEN** the header SHALL show "Save & redeploy"
